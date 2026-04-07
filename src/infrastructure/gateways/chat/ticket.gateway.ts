import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageType, TicketStatus } from 'generated/prisma/client';
import { Server, Socket } from 'socket.io';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tickets',
})
export class TicketChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly ticketService: TicketService) {}

  // Handle new WS connection
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userRole = client.handshake.query.role as string;

    if (!userId) {
      console.log('Connection rejected: No userId provided');
      client.disconnect();
      return;
    }

    await this.ticketService.addConnection(userId, client.id);
    console.log(
      `User ${userId} (${userRole}) connected via socket ${client.id}`,
    );

    // Auto-join queue rooms based on role
    if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
      client.join('queue:all');
      console.log(`User ${userId} joined queue:all room`);
    }

    client.join('queue:available');
    console.log(`User ${userId} joined queue:available room`);
  }

  // Handle WS disconnection
  async handleDisconnect(client: Socket) {
    await this.ticketService.removeConnection(client.id);
    console.log(`Socket ${client.id} disconnected`);
  }

  // Client joins a specific ticket room
  @SubscribeMessage('joinTicketChat')
  handleJoinTicketChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.join(data.ticketId);
    console.log(`Socket ${client.id} joined ticket room: ${data.ticketId}`);
    return { status: 'joined', room: data.ticketId };
  }

  // Client leaves a specific ticket room
  @SubscribeMessage('leaveTicketChat')
  handleLeaveTicketChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.leave(data.ticketId);
    console.log(`Socket ${client.id} left ticket room: ${data.ticketId}`);
    return { status: 'left', room: data.ticketId };
  }

  // Client joins available queue room
  @SubscribeMessage('joinAvailableQueue')
  handleJoinAvailableQueue(@ConnectedSocket() client: Socket) {
    client.join('queue:available');
    console.log(`Socket ${client.id} joined available queue room`);
    return { status: 'joined', queue: 'available' };
  }

  // Client joins all queue room (admin/supervisor only)
  @SubscribeMessage('joinAllQueue')
  handleJoinAllQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { role: string },
  ) {
    if (data.role === 'ADMIN' || data.role === 'SUPERVISOR') {
      client.join('queue:all');
      console.log(`Socket ${client.id} joined all queue room`);
      return { status: 'joined', queue: 'all' };
    }
    return { status: 'error', message: 'Insufficient permissions' };
  }

  // Handle incoming message from client or agent
  @SubscribeMessage('sendTicketMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      ticketId: string;
      authorId: string;
      content: string;
      authorType: MessageType;
    },
  ) {
    console.log('New message received:', payload);

    // 1. Persist to database via service
    const message = await this.ticketService.saveMessage(payload);

    // 2. Broadcast to everyone in the ticket room (including sender)
    this.server.to(payload.ticketId).emit('newTicketMessage', message);

    console.log(`Message broadcasted to ticket ${payload.ticketId} room`);

    // Optional: Return the message to the sender as acknowledgment
    return message;
  }

  // Method to emit queue updates (called from controller after ticket changes)
  emitQueueUpdate(ticket: any, action: 'created' | 'updated' | 'deleted') {
    console.log(
      `Emitting queue update for ticket ${ticket.id}, action: ${action}`,
    );

    // Emit to available queue room
    if (ticket.status === TicketStatus.NEW && !ticket.agentId) {
      this.server.to('queue:available').emit('queueUpdated', {
        action,
        ticket,
        timestamp: new Date(),
      });
    } else {
      // Ticket removed from available queue
      this.server.to('queue:available').emit('queueUpdated', {
        action: 'removed',
        ticketId: ticket.id,
        timestamp: new Date(),
      });
    }

    // Emit to all queue room (admin/supervisor)
    this.server.to('queue:all').emit('allQueueUpdated', {
      action,
      ticket,
      timestamp: new Date(),
    });
  }

  // Method to emit ticket updates (status change, reassignment, etc.)
  emitTicketUpdate(ticket: any, updatedBy: string) {
    console.log(`Emitting ticket update for ${ticket.id} to involved parties`);

    // Emit to the ticket room (for open chat windows)
    this.server.to(ticket.id).emit('ticketUpdated', {
      ticket,
      updatedBy,
      timestamp: new Date(),
    });

    // Also update queue lists with new lastMessageAt
    this.server.to('queue:available').emit('queueUpdated', {
      action: 'updated',
      ticket: ticket,
      timestamp: new Date(),
    });

    this.server.to('queue:all').emit('allQueueUpdated', {
      action: 'updated',
      ticket: ticket,
      timestamp: new Date(),
    });

    // If ticket was reassigned, notify old and new agents
    if (ticket.agentId) {
      this.server.to(`user:${ticket.agentId}`).emit('ticketAssigned', {
        ticket,
        timestamp: new Date(),
      });
    }
  }

  // Method to notify about new ticket created
  emitNewTicket(ticket: any) {
    console.log(`New ticket created: ${ticket.id}`);

    // Notify available queue room
    if (ticket.status === TicketStatus.NEW && !ticket.agentId) {
      this.server.to('queue:available').emit('newTicketAvailable', {
        ticket,
        timestamp: new Date(),
      });
    }

    // Notify all queue room
    this.server.to('queue:all').emit('newTicketCreated', {
      ticket,
      timestamp: new Date(),
    });
  }

  // Method to emit typing indicator
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { ticketId: string; userId: string; isTyping: boolean },
  ) {
    client.to(data.ticketId).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
      timestamp: new Date(),
    });
  }

  // Method to emit message read status
  @SubscribeMessage('markMessagesRead')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { ticketId: string; userId: string; messageIds: number[] },
  ) {
    // Here you would update message status in database
    console.log(
      `User ${data.userId} marked messages as read in ticket ${data.ticketId}`,
    );

    // Notify other participants
    client.to(data.ticketId).emit('messagesRead', {
      userId: data.userId,
      messageIds: data.messageIds,
      timestamp: new Date(),
    });
  }
}

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageType } from 'generated/prisma/enums';
import { Server, Socket } from 'socket.io';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';

@WebSocketGateway({
  cors: { origin: '*' },
  //TODO Set namespace
})
export class TicketChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: TicketService) {}

  // Handle new WS connection
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      client.disconnect();
      return;
    }

    await this.chatService.addConnection(userId, client.id);
    console.log(`User ${userId} connected via socket ${client.id}`);
  }

  // Handle WS disconnection
  async handleDisconnect(client: Socket) {
    await this.chatService.removeConnection(client.id);
    console.log(`Socket ${client.id} disconnected`);
  }

  // Client joins a specific ticket room
  @SubscribeMessage('joinTicketChat')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.join(data.ticketId);
    console.log(`Socket ${client.id} joined room: ${data.ticketId}`);
    return { status: 'joined', room: data.ticketId };
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
    // 1. Persist to database via service
    const message = await this.chatService.saveMessage(payload);

    // 2. Broadcast to everyone in the ticket room (including sender)
    this.server.to(payload.ticketId).emit('newTicketMessage', message);

    // Optional: Return the message to the sender as acknowledgment
    return message;
  }
}

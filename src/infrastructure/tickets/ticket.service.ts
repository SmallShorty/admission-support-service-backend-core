import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, TicketStatus, AccountRole } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async addConnection(accountId: string, socketId: string) {
    console.log('New connection attempt:', accountId);
    return this.prisma.userConnection.create({
      data: { accountId, socketId },
    });
  }

  async removeConnection(socketId: string) {
    console.log('Removing connection for socket:', socketId);
    return this.prisma.userConnection.deleteMany({
      where: { socketId },
    });
  }

  async saveMessage(data: {
    ticketId: string;
    authorId: string;
    content: string;
    authorType: MessageType;
  }) {
    console.log('START TRANSACTION: saveMessage');
    console.log('Payload received:', JSON.stringify(data, null, 2));

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        console.log(`Creating message in ticket: ${data.ticketId}`);
        const message = await tx.ticketMessage.create({
          data: {
            ticketId: data.ticketId,
            authorId: data.authorId,
            authorType: data.authorType,
            content: data.content,
            status: 'SENT',
          },
        });
        console.log('Message created successfully. ID:', message.id);

        console.log(`Updating updatedAt for ticket: ${data.ticketId}`);
        await tx.ticket.update({
          where: { id: data.ticketId },
          data: { updatedAt: new Date() },
        });
        console.log('Ticket updatedAt refreshed');

        return message;
      });

      console.log('TRANSACTION COMMITTED SUCCESSFULLY');
      return result;
    } catch (error) {
      console.error('TRANSACTION FAILED');
      console.error('Error details:', error);
      throw error;
    }
  }

  async getMessagesByTicket(
    ticketId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    console.log(
      'Fetching messages for ticket:',
      ticketId,
      'cursor:',
      cursor,
      'limit:',
      limit,
    );

    const take = Math.min(Math.abs(Number(limit)), 100);

    const where: Prisma.TicketMessageWhereInput = { ticketId };

    if (cursor && !isNaN(Number(cursor))) {
      where.id = { lt: BigInt(cursor) };
    }

    const messages = await this.prisma.ticketMessage.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const hasMore = messages.length === take;
    const nextCursor =
      hasMore && messages.length > 0
        ? messages[messages.length - 1].id.toString()
        : null;

    return {
      items: messages.reverse(),
      hasMore,
      nextCursor,
    };
  }

  async getMyTickets(accountId: string) {
    console.log('Getting my tickets for account:', accountId);

    return this.prisma.ticket.findMany({
      where: {
        agentId: accountId,
        status: {
          in: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED],
        },
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getAvailableQueue(
    accountId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    console.log('Getting available queue for account:', accountId);

    // Convert to numbers and ensure they're valid
    const take = Math.min(Math.abs(Number(limit)), 100);
    const skip = Math.max(0, Number(offset));

    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: TicketStatus.NEW,
        agentId: null,
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take,
      skip,
    });

    const total = await this.prisma.ticket.count({
      where: {
        status: TicketStatus.NEW,
        agentId: null,
      },
    });

    return {
      items: tickets,
      total,
      hasMore: skip + tickets.length < total,
      offset: skip,
      limit: take,
    };
  }

  async getAllQueue(
    accountId: string,
    accountRole: AccountRole,
    limit: number = 50,
    offset: number = 0,
    status?: TicketStatus[],
    agentId?: string,
  ) {
    console.log(
      'Getting all queue for account:',
      accountId,
      'role:',
      accountRole,
    );

    if (
      accountRole !== AccountRole.ADMIN &&
      accountRole !== AccountRole.SUPERVISOR
    ) {
      throw new ForbiddenException(
        'Access denied. Admin or Supervisor role required.',
      );
    }

    // Convert to numbers and ensure they're valid
    const take = Math.min(Math.abs(Number(limit)), 100);
    const skip = Math.max(0, Number(offset));

    const where: Prisma.TicketWhereInput = {};

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (agentId) {
      where.agentId = agentId;
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take,
      skip, // Now skip is a number, not string
    });

    const total = await this.prisma.ticket.count({ where });

    return {
      items: tickets,
      total,
      hasMore: offset + tickets.length < total,
      offset: skip,
      limit: take,
    };
  }

  async takeTicket(ticketId: string, accountId: string) {
    console.log('Taking ticket:', ticketId, 'by account:', accountId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== TicketStatus.NEW) {
        throw new Error('Ticket is not available for taking');
      }

      if (ticket.agentId !== null) {
        throw new Error('Ticket is already assigned to another agent');
      }

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          agentId: accountId,
          status: TicketStatus.IN_PROGRESS,
          assignedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      console.log('Ticket taken successfully:', ticketId);
      return updatedTicket;
    });
  }

  async escalateTicket(
    ticketId: string,
    fromAgentId: string,
    toAgentId: string,
    cause: string,
    causeComment?: string,
  ) {
    console.log(
      'Escalating ticket:',
      ticketId,
      'from:',
      fromAgentId,
      'to:',
      toAgentId,
    );

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.agentId !== fromAgentId) {
        throw new Error('Ticket is not assigned to this agent');
      }

      const escalation = await tx.escalationTicketAudit.create({
        data: {
          ticketId,
          fromAgentId,
          toAgentId,
          cause: cause as any,
          causeComment,
          escalatedAt: new Date(),
        },
      });

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          agentId: toAgentId,
          status: TicketStatus.ESCALATED,
          updatedAt: new Date(),
        },
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      console.log('Ticket escalated successfully:', ticketId);
      return updatedTicket;
    });
  }

  async updateTicketStatus(
    ticketId: string,
    accountId: string,
    status: TicketStatus,
  ) {
    console.log(
      'Updating ticket status:',
      ticketId,
      'to:',
      status,
      'by:',
      accountId,
    );

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.agentId !== accountId) {
        throw new Error('You are not assigned to this ticket');
      }

      const data: Prisma.TicketUpdateInput = {
        status,
        updatedAt: new Date(),
      };

      if (status === TicketStatus.RESOLVED) {
        data.resolvedAt = new Date();
      } else if (status === TicketStatus.CLOSED) {
        data.closedAt = new Date();
      }

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data,
        include: {
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      console.log('Ticket status updated successfully:', ticketId);
      return updatedTicket;
    });
  }

  async getTicketById(ticketId: string) {
    console.log('Getting ticket by id:', ticketId);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }

  async getTicketMessagesCount(ticketId: string): Promise<number> {
    console.log('Getting messages count for ticket:', ticketId);

    return this.prisma.ticketMessage.count({
      where: { ticketId },
    });
  }
}

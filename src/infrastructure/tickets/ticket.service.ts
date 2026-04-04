import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType } from 'generated/prisma/enums';

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
    console.log('--- START TRANSACTION: saveMessage ---');
    console.log('Payload received:', JSON.stringify(data, null, 2));

    try {
      // We use a transaction to ensure message is saved AND ticket is updated
      const result = await this.prisma.$transaction(async (tx) => {
        console.log(`1. Creating message in ticket: ${data.ticketId}...`);
        const message = await tx.ticketMessage.create({
          data: {
            ticketId: data.ticketId,
            authorId: data.authorId,
            authorType: data.authorType,
            content: data.content,
            status: 'SENT',
          },
        });
        console.log('✓ Message created successfully. ID:', message.id);

        console.log(`2. Updating updatedAt for ticket: ${data.ticketId}...`);
        await tx.ticket.update({
          where: { id: data.ticketId },
          data: { updatedAt: new Date() },
        });
        console.log('✓ Ticket updatedAt refreshed.');

        return message;
      });

      console.log('--- TRANSACTION COMMITTED SUCCESSFULLY ---');
      return result;
    } catch (error) {
      console.error('!!! TRANSACTION FAILED !!!');
      console.error('Error details:', error);

      // Пробрасываем ошибку дальше, чтобы гейтвей её увидел
      throw error;
    }
  }

  async getMessagesByTicket(ticketId: string, limit: number) {
    return this.prisma.ticketMessage.findMany({
      where: { ticketId },
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
  }
}

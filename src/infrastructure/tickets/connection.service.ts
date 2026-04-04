import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async saveConnection(accountId: string, socketId: string) {
    console.log('New connection attempt:', accountId);
    return this.prisma.userConnection.create({
      data: {
        accountId,
        socketId,
      },
    });
  }

  async removeConnection(socketId: string) {
    return this.prisma.userConnection.updateMany({
      where: {
        socketId,
        disconnectedAt: null,
      },
      data: {
        disconnectedAt: new Date(),
      },
    });
  }

  async isOnline(accountId: string): Promise<boolean> {
    const connection = await this.prisma.userConnection.findFirst({
      where: {
        accountId,
        disconnectedAt: null,
      },
    });
    return !!connection;
  }

  async getUserActiveSockets(accountId: string): Promise<string[]> {
    const connections = await this.prisma.userConnection.findMany({
      where: {
        accountId,
        disconnectedAt: null,
      },
      select: { socketId: true },
    });
    return connections.map((c) => c.socketId);
  }
}

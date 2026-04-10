import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TicketController],
  providers: [TicketService, TicketChatGateway, PrismaService, AccountService],
  exports: [TicketService],
})
export class TicketModule {}

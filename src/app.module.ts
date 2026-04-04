import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { AccountModule } from './presentation/accounts/account.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth/auth.module';
import { TicketModule } from './presentation/tickets/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AccountModule,
    AuthModule,
    TicketModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}

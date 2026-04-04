import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { AccountModule } from './presentation/accounts/account.module';

@Module({
  imports: [AccountModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}

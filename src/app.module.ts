import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Module({
  imports: [PrismaService],
  controllers: [],
  providers: [],
})
export class AppModule {}

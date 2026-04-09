import { Module } from '@nestjs/common';
import { TemplateService } from 'src/infrastructure/prisma/templates.service';
import { TemplateController } from './templates.controller';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Module({
  controllers: [TemplateController],
  providers: [PrismaService, TemplateService],
  exports: [TemplateService],
})
export class TemplatesModule {}

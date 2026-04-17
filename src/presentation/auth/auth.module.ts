import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from 'src/infrastructure/auth/auth.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditLogModule } from 'src/presentation/audit-log/audit-log.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '31d' },
      }),
      inject: [ConfigService],
    }),
    AuditLogModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AccountService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}

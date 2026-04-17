import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LoginDto } from 'src/application/dto/auth/login.dto';
import { AuthService } from 'src/infrastructure/auth/auth.service';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private auditLogService: AuditLogService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Account login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await this.authService.logout(accessToken, req.user.id);

    try {
      const account = await this.accountService.account({ id: req.user.id });
      if (account) {
        await this.auditLogService.log({
          action: AuditAction.LOGOUT,
          category: AuditCategory.AUTH,
          severity: LogSeverity.INFO,
          actor: {
            id: account.id,
            email: account.email,
            role: account.role!,
            firstName: account.firstName,
            lastName: account.lastName,
            middleName: account.middleName,
          },
          targetId: account.id,
          targetType: 'Account',
          metadata: { email: account.email },
        });
      }
    } catch {}

    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current account profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req) {
    return req.user;
  }
}

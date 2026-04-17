import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { GetAccountsQueryDto } from 'src/application/dto/accounts/get-accounts-query.dto';
import {
  RegisterAccountDto,
  RegisterAccountResponseDto,
} from 'src/application/dto/accounts/register-account.dto';
import { RegisterAccountUseCase } from 'src/application/use-cases/accounts/register-account.usecase';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';
import { AccountService } from 'src/infrastructure/prisma/accounts.service';
import { AuditLogService } from 'src/infrastructure/prisma/audit-log.service';
import { Account } from 'generated/prisma/client';
import { AuditAction, AuditCategory, LogSeverity } from 'generated/prisma/enums';
import { UpdateAccountDto } from 'src/application/dto/accounts/update-account.dto';
import { JwtAuthGuard } from 'src/presentation/auth/guards/jwt-auth.guard';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccountUseCase,
    private readonly accountService: AccountService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiBody({
    type: RegisterAccountDto,
    examples: {
      example1: {
        summary: 'Sample account registration for worker',
        value: {
          firstName: 'Ivan',
          lastName: 'Ivanovich',
          middleName: 'Ivanov',
          email: 'ivan.operator@example.com',
          role: 'OPERATOR',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account successfully created',
    type: RegisterAccountResponseDto,
    examples: {
      example1: {
        summary: 'Returned email and generated password',
        value: {
          email: 'ivan.operator@example.com',
          password: 'a1b2c3d4e5f6',
        },
      },
    },
  })
  async register(
    @Body() dto: RegisterAccountDto,
    @Req() req,
  ): Promise<RegisterAccountResponseDto> {
    const registrar = req.user
      ? await this.accountService.account({ id: req.user.id }).then((a) =>
          a
            ? {
                id: a.id,
                email: a.email,
                role: a.role!,
                firstName: a.firstName,
                lastName: a.lastName,
                middleName: a.middleName,
              }
            : null,
        )
      : null;
    return this.registerAccountUseCase.execute(dto, registrar);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of accounts with search' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of accounts',
    type: PaginatedResponseDto,
  })
  async findAll(
    @Query() query: GetAccountsQueryDto,
  ): Promise<PaginatedResponseDto<Omit<Account, 'passwordHash'>>> {
    return this.accountService.accounts(query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing account' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @Req() req,
  ): Promise<Omit<Account, 'passwordHash'>> {
    const before = await this.accountService.account({ id });

    const result = await this.accountService.updateAccount({
      where: { id },
      data: dto,
    });

    try {
      const actor = req.user
        ? await this.accountService.account({ id: req.user.id }).then((a) =>
            a
              ? {
                  id: a.id,
                  email: a.email,
                  role: a.role!,
                  firstName: a.firstName,
                  lastName: a.lastName,
                  middleName: a.middleName,
                }
              : null,
          )
        : null;

      const changes = Object.entries(dto)
        .filter(([, v]) => v !== undefined)
        .map(([field, to]) => ({
          field,
          from: before ? (before as Record<string, unknown>)[field] : undefined,
          to,
        }));

      await this.auditLogService.log({
        action: AuditAction.ACCOUNT_UPDATED,
        category: AuditCategory.ACCOUNT,
        severity: LogSeverity.INFO,
        actor,
        targetId: id,
        targetType: 'Account',
        metadata: { targetAccountId: id, changes },
      });
    } catch {}

    return result;
  }
}

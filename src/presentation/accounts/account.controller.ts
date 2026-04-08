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
import { Account } from 'generated/prisma/client';
import { UpdateAccountDto } from 'src/application/dto/accounts/update-account.dto';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccountUseCase,
    private readonly accountService: AccountService,
  ) {}

  @Post('register')
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
  ): Promise<RegisterAccountResponseDto> {
    return this.registerAccountUseCase.execute(dto);
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
  @ApiBearerAuth()
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
  ): Promise<Omit<Account, 'passwordHash'>> {
    // В AccountService должен быть метод update, принимающий id и данные
    return this.accountService.updateAccount({
      where: { id },
      data: dto,
    });
  }
}

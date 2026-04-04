import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegisterAccountDto,
  RegisterAccountResponseDto,
} from 'src/application/dto/accounts/register-account.dto';
import { RegisterAccountUseCase } from 'src/application/use-cases/accounts/register-account.usecase';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly registerAccountUseCase: RegisterAccountUseCase,
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
}

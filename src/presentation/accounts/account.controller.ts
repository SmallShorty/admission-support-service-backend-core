import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
  async register(
    @Body() dto: RegisterAccountDto,
  ): Promise<RegisterAccountResponseDto> {
    return this.registerAccountUseCase.execute(dto);
  }
}

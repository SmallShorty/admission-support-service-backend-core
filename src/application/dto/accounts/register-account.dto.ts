import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { AccountRole } from 'generated/prisma/enums';

export class RegisterAccountDto {
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  middleName?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(AccountRole)
  role?: AccountRole;
}

export class RegisterAccountResponseDto {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}

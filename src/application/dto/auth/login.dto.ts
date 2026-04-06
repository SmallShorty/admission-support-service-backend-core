import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@admin.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  password: string;
}

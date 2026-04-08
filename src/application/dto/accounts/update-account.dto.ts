import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RegisterAccountDto } from './register-account.dto';
import { AccountStatus } from 'generated/prisma/client';

export class UpdateAccountDto extends PartialType(RegisterAccountDto) {
  @ApiProperty({
    example: 'ACTIVE',
    enum: AccountStatus,
    required: false,
  })
  status?: AccountStatus;
}

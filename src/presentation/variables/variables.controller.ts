import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import { DynamicVariableDto } from 'src/application/dto/variables/response/dynamic-variable.dto';

@ApiTags('Variables')
@Controller('variables')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VariablesController {
  constructor(
    private readonly dynamicVariableService: DynamicVariableService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all dynamic variables',
    description:
      'Returns the full dictionary of dynamic variables available for use in agent messages. Intended for display in the knowledge base.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all dynamic variables',
    type: [DynamicVariableDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<DynamicVariableDto[]> {
    return this.dynamicVariableService.findAll();
  }
}

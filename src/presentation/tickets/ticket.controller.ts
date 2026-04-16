import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Patch,
  Body,
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
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { TicketStatus, AccountRole } from 'generated/prisma/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { TicketChatGateway } from 'src/infrastructure/gateways/chat/ticket.gateway';
import {
  GetTicketsQueryDto,
  EscalateTicketRequestDto,
  UpdateTicketStatusDto,
  TicketListResponseDto,
  TicketDetailResponseDto,
  TicketCountsResponseDto,
  VariableResolvedDto,
} from 'src/application/dto/tickets/index';
import { GetTicketVariablesUseCase } from 'src/application/use-cases/tickets/get-ticket-variables.usecase';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly ticketGateway: TicketChatGateway,
    private readonly getTicketVariablesUseCase: GetTicketVariablesUseCase,
  ) {}

  @Get('my')
  @ApiOperation({
    summary: 'Get my active tickets',
    description:
      'Returns all tickets assigned to the current agent with status IN_PROGRESS or ESCALATED',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of active tickets',
    type: [TicketListResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyTickets(@Req() req) {
    const accountId = req.user.id;
    return this.ticketService.getMyTickets(accountId);
  }

  @Get('available')
  @ApiOperation({
    summary: 'Get available queue',
    description:
      'Returns tickets available for taking (status NEW, no agent assigned). Sorted by priority DESC and createdAt ASC',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of available tickets',
    schema: {
      example: {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            applicant: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'John Doe',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
            operator: { id: null },
            category: 'DOCUMENT_SUBMISSION',
            status: 'NEW',
            priorityValue: 5,
            createdAt: '2024-01-15T10:30:00Z',
            lastMessageAt: '2024-01-15T10:30:00Z',
          },
        ],
        total: 25,
        hasMore: true,
        offset: 0,
        limit: 50,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableQueue(
    @Req() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const accountId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.ticketService.getAvailableQueue(accountId, limitNum, offsetNum);
  }

  @Get('queue/all')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.SUPERVISOR)
  @ApiOperation({
    summary: 'Get all tickets queue (Admin/Supervisor only)',
    description:
      'Returns all tickets in the system with optional filtering. Only accessible by ADMIN and SUPERVISOR roles',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Comma-separated list of statuses to filter',
    example: 'NEW,IN_PROGRESS',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    type: String,
    description: 'Filter by agent ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of all tickets',
    schema: {
      example: {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            applicant: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'John Doe',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
            operator: { id: '123e4567-e89b-12d3-a456-426614174002' },
            category: 'DOCUMENT_SUBMISSION',
            status: 'IN_PROGRESS',
            priorityValue: 5,
            createdAt: '2024-01-15T10:30:00Z',
            lastMessageAt: '2024-01-15T10:35:00Z',
          },
        ],
        total: 100,
        hasMore: true,
        offset: 0,
        limit: 50,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getAllQueue(
    @Req() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
  ) {
    const accountRole = req.user.role;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    let statusArray: TicketStatus[] | undefined;
    if (status) {
      statusArray = status.split(',') as TicketStatus[];
    }

    return this.ticketService.getAllQueue(
      accountRole,
      limitNum,
      offsetNum,
      statusArray,
      agentId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated tickets with filters',
    description:
      'Universal paginated endpoint for Kanban columns. Supports filtering by status and agentId',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TicketStatus,
    description: 'Filter by ticket status',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    type: String,
    description: 'Filter by agent ID (Admin/Supervisor only)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tickets',
    schema: {
      example: {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            applicant: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'John Doe',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
            operator: { id: '123e4567-e89b-12d3-a456-426614174002' },
            category: 'DOCUMENT_SUBMISSION',
            status: 'IN_PROGRESS',
            priorityValue: 5,
            createdAt: '2024-01-15T10:30:00Z',
            lastMessageAt: '2024-01-15T10:35:00Z',
          },
        ],
        total: 100,
        hasMore: true,
        offset: 0,
        limit: 20,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTickets(@Req() req, @Query() query: GetTicketsQueryDto) {
    const accountId = req.user.id;
    const accountRole = req.user.role;

    return this.ticketService.getTicketsPaginated(accountId, accountRole, {
      status: query.status,
      agentId: query.agentId,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('counts')
  @ApiOperation({
    summary: 'Get ticket counts by status',
    description:
      'Returns ticket counts aggregated by status for UI header counters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns counts per status',
    type: TicketCountsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTicketCounts() {
    return this.ticketService.getTicketCounts();
  }

  @Post(':id/take')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Take a ticket',
    description:
      'Assigns the ticket to the current agent and changes status to IN_PROGRESS',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket successfully taken',
    type: TicketListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ticket not available for taking' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async takeTicket(@Param('id') ticketId: string, @Req() req) {
    const accountId = req.user.id;
    const { ticket, systemMessage } = await this.ticketService.takeTicket(
      ticketId,
      accountId,
    );

    this.ticketGateway.emitQueueUpdate(ticket, 'updated');
    this.ticketGateway.emitTicketUpdate(ticket, accountId);
    this.ticketGateway.server
      .to(ticketId)
      .emit('newTicketMessage', systemMessage);

    return ticket;
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate a ticket',
    description:
      'Escalates the ticket to another agent. Changes status to ESCALATED and reassigns the agent',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['toAgentId', 'cause'],
      properties: {
        toAgentId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174003',
          description: 'Target agent ID',
        },
        cause: {
          type: 'string',
          enum: [
            'COMPLEX_ISSUE',
            'INSUFFICIENT_RIGHTS',
            'CUSTOMER_COMPLAINT',
            'TECHNICAL_FAILURE',
            'TIMEOUT',
            'OTHER',
          ],
          example: 'COMPLEX_ISSUE',
        },
        causeComment: {
          type: 'string',
          example: 'Issue requires senior agent attention',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket successfully escalated',
    type: TicketListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid escalation request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not assigned to this ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async escalateTicket(
    @Param('id') ticketId: string,
    @Req() req,
    @Body() body: EscalateTicketRequestDto,
  ) {
    const fromAgentId = req.user.id;
    const ticket = await this.ticketService.escalateTicket(
      ticketId,
      fromAgentId,
      body,
    );

    // Emit WebSocket updates
    this.ticketGateway.emitTicketUpdate(ticket, fromAgentId);
    this.ticketGateway.emitQueueUpdate(ticket, 'updated');

    return ticket;
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update ticket status',
    description: 'Changes the status of a ticket (RESOLVED or CLOSED)',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['RESOLVED', 'CLOSED'],
          example: 'RESOLVED',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated successfully',
    type: TicketListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Ticket not assigned to this agent',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Req() req,
    @Body() body: UpdateTicketStatusDto,
  ) {
    const accountId = req.user.id;
    const ticket = await this.ticketService.updateTicketStatus(
      ticketId,
      accountId,
      body.status,
    );

    // Emit WebSocket updates
    this.ticketGateway.emitTicketUpdate(ticket, accountId);
    this.ticketGateway.emitQueueUpdate(ticket, 'updated');

    return ticket;
  }

  @Get(':id/variables')
  @ApiOperation({
    summary: 'Get resolved variables for autocomplete',
    description:
      'Returns all variables with their current resolved values for the ticket applicant. Used by frontend for autocomplete when typing $',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of variables with resolved values',
    type: [VariableResolvedDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketVariables(@Param('id') id: string): Promise<VariableResolvedDto[]> {
    return this.getTicketVariablesUseCase.execute(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get ticket by ID',
    description:
      'Returns detailed information about a specific ticket with 360-degree data',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns ticket details with applicant profile, exam scores, and programs',
    type: TicketDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketById(@Param('id') ticketId: string) {
    return this.ticketService.getTicketDetails(ticketId);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get ticket messages history',
    description:
      'Returns paginated message history for a ticket. Messages are ordered from oldest to newest',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages per page (max 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor for pagination (message ID)',
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated message history',
    schema: {
      example: {
        items: [
          {
            id: 12345,
            ticketId: '123e4567-e89b-12d3-a456-426614174000',
            authorId: '123e4567-e89b-12d3-a456-426614174001',
            authorType: 'FROM_CUSTOMER',
            content: 'I need help with my application',
            status: 'SENT',
            createdAt: '2024-01-15T10:30:00Z',
            author: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
          },
        ],
        hasMore: true,
        nextCursor: '12344',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketHistory(
    @Param('id') ticketId: string,
    @Query('limit') limit: number = 50,
    @Query('cursor') cursor?: string,
  ) {
    return this.ticketService.getMessagesByTicket(ticketId, cursor, limit);
  }

  @Get(':id/messages/count')
  @ApiOperation({
    summary: 'Get total messages count',
    description: 'Returns the total number of messages in a ticket',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns message count',
    schema: {
      example: {
        count: 42,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicketMessagesCount(@Param('id') ticketId: string) {
    const count = await this.ticketService.getTicketMessagesCount(ticketId);
    return { count };
  }
}

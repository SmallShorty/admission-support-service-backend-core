import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../prisma/audit-log.service';
import {
  MessageType,
  TicketStatus,
  AccountRole,
  EscalationCause,
  AuditAction,
  AuditCategory,
  LogSeverity,
} from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

// ========== System Message Constants ==========
export const SYSTEM_MESSAGES = {
  TICKET_ASSIGNED: 'assigned',
  TICKET_ESCALATED: 'escalated',
} as const;

// ========== Domain Exceptions ==========
export class TicketNotFoundException extends NotFoundException {
  constructor(ticketId?: string) {
    super(ticketId ? `Ticket ${ticketId} not found` : 'Ticket not found');
  }
}

export class TicketNotAssignableException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedTicketAccessException extends ForbiddenException {
  constructor(message: string) {
    super(message);
  }
}

// ========== DTOs ==========
export interface SaveMessageDto {
  ticketId: string;
  authorId: string;
  content: string;
  authorType: MessageType;
}

export interface EscalateTicketDto {
  toAgentId: string;
  cause: EscalationCause;
  causeComment?: string;
}

export interface TicketFiltersDto {
  status?: TicketStatus;
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export interface TicketListResponse {
  id: string;
  applicant: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
  };
  operator: {
    id: string | null;
  };
  category: string | null;
  status: TicketStatus;
  priorityValue: number | null;
  createdAt: string;
  lastMessageAt: string;
  firstApplicantMessage: string | null;
}

export interface TicketDetailResponse extends TicketListResponse {
  noteText: string;
  intent: string | null;
  assignedAt: string | null;
  firstReplyAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  examScores?: Array<{
    subjectName: string;
    subjectCode?: string | null;
    score: number;
    type: string | null;
  }>;
  applicantPrograms?: Array<{
    programId: number;
    programCode: string;
    programName: string;
    studyForm: string;
    admissionType: string;
    priority: number;
  }>;
  applicantSnils?: string;
  applicantHasBvi?: boolean;
  applicantHasSpecialQuota?: boolean;
  applicantHasSeparateQuota?: boolean;
  applicantHasTargetQuota?: boolean;
  applicantHasPriorityRight?: boolean;
  applicantOriginalDocumentReceived?: boolean;
  applicantOriginalDocumentReceivedAt?: string;
}

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  // Reusable select fields for consistent data fetching
  private readonly applicantSelectFields = {
    id: true,
    firstName: true,
    lastName: true,
    middleName: true,
    email: true,
  };

  private readonly agentSelectFields = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  };

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  // ========== Helper Methods ==========

  /**
   * Normalizes pagination parameters with safe defaults
   */
  private normalizePagination(
    limit?: number,
    offset?: number,
  ): { take: number; skip: number } {
    const take = Math.min(Math.abs(Number(limit || 50)), 100);
    const skip = Math.max(0, Number(offset || 0));
    return { take, skip };
  }

  /**
   * Creates a standardized paginated response
   */
  private createPaginatedResponse<T>(
    items: T[],
    total: number,
    skip: number,
    take: number,
  ): PaginatedResult<T> {
    return {
      items,
      total,
      hasMore: skip + items.length < total,
      offset: skip,
      limit: take,
    };
  }

  /**
   * Validates that the user has Admin or Supervisor role
   */
  private validateAdminOrSupervisor(role: AccountRole | null): void {
    if (role !== AccountRole.ADMIN && role !== AccountRole.SUPERVISOR) {
      try {
        void this.auditLogService.log({
          action: AuditAction.TICKET_ACCESS_FORBIDDEN,
          category: AuditCategory.SECURITY,
          severity: LogSeverity.ERROR,
          metadata: {
            reason: 'Admin or Supervisor role required',
            attemptedAction: 'getAllQueue',
          },
        });
      } catch {}
      throw new ForbiddenException(
        'Access denied. Admin or Supervisor role required.',
      );
    }
  }

  /**
   * Validates that an agent exists and can take tickets
   */
  private async validateAgentCanTakeTicket(agentId: string): Promise<void> {
    const agent = await this.prisma.account.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, status: true },
    });

    if (!agent) {
      throw new BadRequestException(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new BadRequestException(`Agent ${agentId} is not active`);
    }

    // Check if role exists and is allowed
    if (!agent.role) {
      throw new BadRequestException('Agent must have a role assigned');
    }

    const allowedRoles: AccountRole[] = [
      AccountRole.OPERATOR,
      AccountRole.SUPERVISOR,
      AccountRole.ADMIN,
    ];
    if (!allowedRoles.includes(agent.role)) {
      throw new BadRequestException(
        'Agent must be OPERATOR, SUPERVISOR, or ADMIN',
      );
    }
  }

  /**
   * Validates that a target agent exists for escalation
   */
  private async validateTargetAgentForEscalation(
    agentId: string,
  ): Promise<void> {
    const agent = await this.prisma.account.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, status: true },
    });

    if (!agent) {
      throw new BadRequestException(`Target agent ${agentId} not found`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new BadRequestException(`Target agent ${agentId} is not active`);
    }

    // Check if role exists and is allowed for escalation
    if (!agent.role) {
      throw new BadRequestException('Target agent must have a role assigned');
    }

    const allowedRoles: AccountRole[] = [
      AccountRole.SUPERVISOR,
      AccountRole.ADMIN,
    ];
    if (!allowedRoles.includes(agent.role)) {
      throw new BadRequestException('Target agent must be SUPERVISOR or ADMIN');
    }
  }

  /**
   * Formats full name from account fields
   */
  private getFullName(account: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
  }): string {
    const parts = [
      account.lastName,
      account.firstName,
      account.middleName,
    ].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Transforms a ticket entity to TicketListResponse format
   */
  private toTicketListResponse(ticket: any): TicketListResponse {
    return {
      id: ticket.id,
      applicant: {
        id: ticket.applicant.id,
        name: this.getFullName(ticket.applicant),
        firstName: ticket.applicant.firstName,
        lastName: ticket.applicant.lastName,
        middleName: ticket.applicant.middleName || undefined,
        email: ticket.applicant.email || '',
      },
      operator: {
        id: ticket.agentId || null,
      },
      category: ticket.intent,
      status: ticket.status,
      priorityValue: ticket.priority,
      createdAt: ticket.createdAt?.toISOString() || new Date().toISOString(),
      lastMessageAt:
        ticket.lastMessageAt?.toISOString() ||
        ticket.createdAt?.toISOString() ||
        new Date().toISOString(),
      firstApplicantMessage: ticket.messages?.[0]?.content ?? null,
    };
  }

  // ========== WebSocket Connection Management ==========

  async addConnection(accountId: string, socketId: string) {
    this.logger.log(
      `Adding WebSocket connection for account ${accountId}, socket ${socketId}`,
    );
    return this.prisma.userConnection.create({
      data: { accountId, socketId },
    });
  }

  async removeConnection(socketId: string) {
    this.logger.log(`Removing WebSocket connection for socket ${socketId}`);
    return this.prisma.userConnection.deleteMany({
      where: { socketId },
    });
  }

  // ========== Message Management ==========

  async saveMessage(data: SaveMessageDto) {
    this.logger.log(
      `Saving message for ticket ${data.ticketId} from author ${data.authorId}`,
    );

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the message
        const message = await tx.ticketMessage.create({
          data: {
            ticketId: data.ticketId,
            authorId: data.authorId,
            authorType: data.authorType,
            content: data.content,
            status: 'SENT',
          },
        });
        this.logger.debug(`Message created with ID: ${message.id}`);

        // Update ticket timestamps
        await tx.ticket.update({
          where: { id: data.ticketId },
          data: {
            updatedAt: new Date(),
            lastMessageAt: new Date(),
          },
        });

        // Set firstReplyAt only once — when it has never been set before
        if (data.authorType === MessageType.FROM_AGENT) {
          await tx.ticket.updateMany({
            where: { id: data.ticketId, firstReplyAt: null },
            data: { firstReplyAt: new Date() },
          });
        }
        this.logger.debug(`Ticket ${data.ticketId} timestamps updated`);

        return message;
      });

      this.logger.log(`Message saved successfully for ticket ${data.ticketId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to save message for ticket ${data.ticketId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getMessagesByTicket(
    ticketId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    this.logger.log(
      `Fetching messages for ticket ${ticketId}, cursor: ${cursor}, limit: ${limit}`,
    );

    const take = Math.min(Math.abs(Number(limit)), 100);

    const where: Prisma.TicketMessageWhereInput = { ticketId };

    // Cursor-based pagination using message ID
    if (cursor && !isNaN(Number(cursor))) {
      where.id = { lt: BigInt(cursor) };
    }

    const messages = await this.prisma.ticketMessage.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: this.applicantSelectFields,
        },
      },
    });

    const hasMore = messages.length === take;
    const nextCursor =
      hasMore && messages.length > 0
        ? messages[messages.length - 1].id.toString()
        : null;

    // Return messages in chronological order (oldest first)
    return {
      items: messages.reverse(),
      hasMore,
      nextCursor,
    };
  }

  async markMessagesRead(
    ticketId: string,
    messageIds: number[],
  ): Promise<void> {
    await this.prisma.ticketMessage.updateMany({
      where: {
        id: { in: messageIds.map(BigInt) },
        ticketId,
        status: { not: 'SEEN' },
      },
      data: {
        status: 'SEEN',
        seenAt: new Date(),
      },
    });
  }

  async getTicketMessagesCount(ticketId: string): Promise<number> {
    this.logger.log(`Getting message count for ticket ${ticketId}`);
    return this.prisma.ticketMessage.count({
      where: { ticketId },
    });
  }

  // ========== Ticket Queries ==========

  async getMyTickets(accountId: string) {
    this.logger.log(`Getting active tickets for agent ${accountId}`);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        agentId: accountId,
        status: {
          in: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED],
        },
      },
      include: {
        applicant: {
          select: this.applicantSelectFields,
        },
        messages: {
          where: { authorType: MessageType.FROM_CUSTOMER },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });

    return tickets.map((ticket) => this.toTicketListResponse(ticket));
  }

  async getAvailableQueue(
    accountId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    this.logger.log(`Getting available queue for agent ${accountId}`);

    const { take, skip } = this.normalizePagination(limit, offset);

    // Parallel queries for better performance
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where: {
          status: TicketStatus.NEW,
          agentId: null,
        },
        include: {
          applicant: {
            select: this.applicantSelectFields,
          },
          messages: {
            where: { authorType: MessageType.FROM_CUSTOMER },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { content: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take,
        skip,
      }),
      this.prisma.ticket.count({
        where: {
          status: TicketStatus.NEW,
          agentId: null,
        },
      }),
    ]);

    return this.createPaginatedResponse(
      tickets.map((ticket) => this.toTicketListResponse(ticket)),
      total,
      skip,
      take,
    );
  }

  async getAllQueue(
    accountRole: AccountRole | null,
    limit: number = 50,
    offset: number = 0,
    status?: TicketStatus[],
    agentId?: string,
  ) {
    this.logger.log(`Getting all queue for role ${accountRole}`);

    // Role validation
    this.validateAdminOrSupervisor(accountRole);

    const { take, skip } = this.normalizePagination(limit, offset);

    // Validate agent exists if filtering by agentId
    if (agentId) {
      await this.validateAgentCanTakeTicket(agentId);
    }

    const where: Prisma.TicketWhereInput = {};

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (agentId) {
      where.agentId = agentId;
    }

    // Parallel queries for better performance
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          applicant: {
            select: this.applicantSelectFields,
          },
          agent: {
            select: this.agentSelectFields,
          },
          messages: {
            where: { authorType: MessageType.FROM_CUSTOMER },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { content: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take,
        skip,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return this.createPaginatedResponse(
      tickets.map((ticket) => this.toTicketListResponse(ticket)),
      total,
      skip,
      take,
    );
  }

  async getTicketsPaginated(
    accountId: string,
    accountRole: AccountRole | null,
    filters: TicketFiltersDto,
  ): Promise<PaginatedResult<TicketListResponse>> {
    this.logger.log(
      `Getting paginated tickets for account ${accountId}, role ${accountRole}`,
    );

    const { take, skip } = this.normalizePagination(
      filters.limit,
      filters.offset,
    );

    const where: Prisma.TicketWhereInput = {};

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Role-based access control
    if (accountRole === AccountRole.OPERATOR) {
      // Operators see their own tickets, except NEW tickets which are unassigned
      if (filters.status !== TicketStatus.NEW) {
        where.agentId = accountId;
      }
    } else if (
      accountRole === AccountRole.ADMIN ||
      accountRole === AccountRole.SUPERVISOR
    ) {
      // Admins and supervisors can filter by agentId
      if (filters.agentId) {
        where.agentId = filters.agentId;
      }
    }

    // Parallel queries for better performance
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          applicant: {
            select: this.applicantSelectFields,
          },
          agent: {
            select: this.agentSelectFields,
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take,
        skip,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return this.createPaginatedResponse(
      tickets.map((ticket) => this.toTicketListResponse(ticket)),
      total,
      skip,
      take,
    );
  }

  async getTicketCounts(): Promise<Record<TicketStatus, number>> {
    this.logger.log('Getting ticket counts by status');

    const counts = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Initialize all statuses with 0
    const result: Partial<Record<TicketStatus, number>> = {};
    for (const status of Object.values(TicketStatus)) {
      result[status] = 0;
    }

    // Fill in actual counts
    for (const { status, _count } of counts) {
      result[status] = _count.status;
    }

    return result as Record<TicketStatus, number>;
  }

  async getTicketById(ticketId: string): Promise<TicketListResponse> {
    this.logger.log(`Getting ticket by ID: ${ticketId}`);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        applicant: {
          select: this.applicantSelectFields,
        },
        agent: {
          select: this.agentSelectFields,
        },
      },
    });

    if (!ticket) {
      throw new TicketNotFoundException(ticketId);
    }

    return this.toTicketListResponse(ticket);
  }

  // TODO Refactor
  async getTicketDetails(ticketId: string): Promise<TicketDetailResponse> {
    this.logger.log(`Getting detailed ticket info for ${ticketId}`);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        applicant: {
          select: {
            ...this.applicantSelectFields,
            applicant: {
              include: {
                examScores: true,
                applicantPrograms: true,
              },
            },
          },
        },
        agent: {
          select: this.agentSelectFields,
        },
        messages: {
          where: { authorType: MessageType.FROM_CUSTOMER },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    if (!ticket) {
      throw new TicketNotFoundException(ticketId);
    }

    // Handle the nested structure correctly
    const applicantAccount = ticket.applicant;
    const applicantData = (ticket.applicant as any).applicant;

    const baseResponse = this.toTicketListResponse({
      ...ticket,
      applicant: applicantAccount,
    });

    return {
      ...baseResponse,
      noteText: '',
      intent: ticket.intent,
      assignedAt: ticket.assignedAt?.toISOString() || null,
      firstReplyAt: ticket.firstReplyAt?.toISOString() || null,
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      closedAt: ticket.closedAt?.toISOString() || null,
      updatedAt: ticket.updatedAt?.toISOString() || new Date().toISOString(),
      examScores: applicantData?.examScores?.map((score: any) => ({
        subjectName: score.subjectName,
        subjectCode: score.subjectCode,
        score: score.score,
        type: score.type,
      })),
      applicantPrograms: applicantData?.applicantPrograms?.map(
        (program: any) => ({
          programId: program.programId,
          programCode: program.programCode,
          programName: program.programName,
          studyForm: program.studyForm,
          admissionType: program.admissionType,
          priority: program.priority,
        }),
      ),
      applicantSnils: applicantData?.snils || undefined,
      applicantHasBvi: applicantData?.hasBvi,
      applicantHasSpecialQuota: applicantData?.hasSpecialQuota,
      applicantHasSeparateQuota: applicantData?.hasSeparateQuota,
      applicantHasTargetQuota: applicantData?.hasTargetQuota,
      applicantHasPriorityRight: applicantData?.hasPriorityRight,
      applicantOriginalDocumentReceived:
        applicantData?.originalDocumentReceived,
      applicantOriginalDocumentReceivedAt:
        applicantData?.originalDocumentReceivedAt?.toISOString() || undefined,
    };
  }

  // ========== Ticket Mutations ==========

  async takeTicket(ticketId: string, accountId: string) {
    this.logger.log(`Agent ${accountId} attempting to take ticket ${ticketId}`);

    // Validate agent can take tickets
    await this.validateAgentCanTakeTicket(accountId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new TicketNotFoundException(ticketId);
      }

      if (ticket.status !== TicketStatus.NEW) {
        throw new TicketNotAssignableException(
          `Ticket ${ticketId} has status ${ticket.status}, expected NEW`,
        );
      }

      if (ticket.agentId !== null) {
        throw new TicketNotAssignableException(
          `Ticket ${ticketId} is already assigned to agent ${ticket.agentId}`,
        );
      }

      const now = new Date();

      const [updatedTicket, systemMessage] = await Promise.all([
        tx.ticket.update({
          where: { id: ticketId },
          data: {
            agentId: accountId,
            status: TicketStatus.IN_PROGRESS,
            assignedAt: now,
            updatedAt: now,
            lastMessageAt: now,
          },
          include: {
            applicant: {
              select: this.applicantSelectFields,
            },
          },
        }),
        tx.ticketMessage.create({
          data: {
            ticketId,
            authorId: accountId,
            authorType: MessageType.SYSTEM,
            content: SYSTEM_MESSAGES.TICKET_ASSIGNED,
            status: 'SENT',
          },
        }),
      ]);

      this.logger.log(
        `Ticket ${ticketId} successfully taken by agent ${accountId}`,
      );
      return {
        ticket: this.toTicketListResponse(updatedTicket),
        systemMessage,
      };
    });
  }

  async escalateTicket(
    ticketId: string,
    fromAgentId: string,
    dto: EscalateTicketDto,
  ) {
    this.logger.log(
      `Escalating ticket ${ticketId} from ${fromAgentId} to ${dto.toAgentId}`,
    );

    // Validate target agent exists and can receive escalation
    await this.validateTargetAgentForEscalation(dto.toAgentId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new TicketNotFoundException(ticketId);
      }

      if (ticket.agentId !== fromAgentId) {
        try {
          await this.auditLogService.log({
            action: AuditAction.TICKET_ESCALATION_FORBIDDEN,
            category: AuditCategory.SECURITY,
            severity: LogSeverity.ERROR,
            targetId: ticketId,
            targetType: 'Ticket',
            metadata: {
              ticketId,
              fromAgentId,
              reason: 'Agent not assigned to ticket',
            },
          });
        } catch {}
        throw new UnauthorizedTicketAccessException(
          `Agent ${fromAgentId} is not assigned to ticket ${ticketId}`,
        );
      }

      const previousStatus = ticket.status;

      // Create escalation audit record
      await tx.escalationTicketAudit.create({
        data: {
          ticketId,
          fromAgentId,
          toAgentId: dto.toAgentId,
          cause: dto.cause,
          causeComment: dto.causeComment,
          escalatedAt: new Date(),
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: fromAgentId,
          authorType: MessageType.SYSTEM,
          content: SYSTEM_MESSAGES.TICKET_ESCALATED,
          status: 'SENT',
        },
      });

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          agentId: dto.toAgentId,
          status: TicketStatus.ESCALATED,
          updatedAt: new Date(),
        },
        include: {
          applicant: {
            select: this.applicantSelectFields,
          },
        },
      });

      this.logger.log(
        `Ticket ${ticketId} successfully escalated to ${dto.toAgentId}`,
      );
      return {
        ticket: this.toTicketListResponse(updatedTicket),
        previousStatus,
      };
    });
  }

  async updateTicketStatus(
    ticketId: string,
    accountId: string,
    status: TicketStatus,
  ) {
    this.logger.log(
      `Updating ticket ${ticketId} status to ${status} by agent ${accountId}`,
    );

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new TicketNotFoundException(ticketId);
      }

      if (ticket.agentId !== accountId) {
        try {
          await this.auditLogService.log({
            action: AuditAction.TICKET_ACCESS_FORBIDDEN,
            category: AuditCategory.SECURITY,
            severity: LogSeverity.ERROR,
            targetId: ticketId,
            targetType: 'Ticket',
            metadata: {
              ticketId,
              reason: 'Agent not assigned to ticket for status update',
              attemptedAction: 'updateTicketStatus',
            },
          });
        } catch {}
        throw new UnauthorizedTicketAccessException(
          `Agent ${accountId} is not assigned to ticket ${ticketId}`,
        );
      }

      const previousStatus = ticket.status;

      const data: Prisma.TicketUpdateInput = {
        status,
        updatedAt: new Date(),
      };

      if (status === TicketStatus.RESOLVED) {
        data.resolvedAt = new Date();
      } else if (status === TicketStatus.CLOSED) {
        data.closedAt = new Date();
      }

      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data,
        include: {
          applicant: {
            select: this.applicantSelectFields,
          },
        },
      });

      this.logger.log(`Ticket ${ticketId} status updated to ${status}`);
      return {
        ticket: this.toTicketListResponse(updatedTicket),
        previousStatus,
      };
    });
  }
}

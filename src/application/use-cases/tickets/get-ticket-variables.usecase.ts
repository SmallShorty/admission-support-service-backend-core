import { Injectable } from '@nestjs/common';
import { VariableResolvedDto } from 'src/application/dto/tickets';
import { TicketService } from 'src/infrastructure/tickets/ticket.service';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import {
  buildApplicantContext,
  formatVariableValue,
} from 'src/infrastructure/tickets/variable-context.builder';

@Injectable()
export class GetTicketVariablesUseCase {
  constructor(
    private readonly ticketService: TicketService,
    private readonly dynamicVariableService: DynamicVariableService,
  ) {}

  /**
   * Fetches all variables with their resolved values for a ticket's applicant.
   * Used by the autocomplete endpoint. Never throws — fallbackText is used for null values.
   */
  async execute(ticketId: string): Promise<VariableResolvedDto[]> {
    const [detail, variables] = await Promise.all([
      this.ticketService.getTicketDetails(ticketId),
      this.dynamicVariableService.findAll(),
    ]);

    const context = buildApplicantContext(detail);

    return variables.map((variable) => ({
      name: variable.name,
      description: variable.description ?? '',
      resolvedValue:
        formatVariableValue(context[variable.sourceField]) ??
        variable.fallbackText,
    }));
  }
}

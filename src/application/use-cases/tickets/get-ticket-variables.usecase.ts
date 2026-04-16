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
   * Fetches only variables that have actual resolved values for the ticket's applicant.
   * Variables with no data (null resolved value) are excluded from the result.
   */
  async execute(ticketId: string): Promise<VariableResolvedDto[]> {
    const [detail, variables] = await Promise.all([
      this.ticketService.getTicketDetails(ticketId),
      this.dynamicVariableService.findAll(),
    ]);

    const context = buildApplicantContext(detail);

    return variables
      .filter(
        (variable) =>
          formatVariableValue(context[variable.sourceField]) !== null,
      )
      .map((variable) => ({
        name: variable.name,
        description: variable.description ?? '',
        resolvedValue: formatVariableValue(
          context[variable.sourceField],
        ) as string,
      }));
  }
}

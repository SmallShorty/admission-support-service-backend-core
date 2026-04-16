import { Injectable, BadRequestException } from '@nestjs/common';
import { DynamicVariable } from 'generated/prisma/client';
import { MessageType } from 'generated/prisma/enums';
import { TicketService, TicketDetailResponse } from 'src/infrastructure/tickets/ticket.service';
import { DynamicVariableService } from 'src/infrastructure/prisma/dynamic-variable.service';
import {
  buildApplicantContext,
  formatVariableValue,
} from 'src/infrastructure/tickets/variable-context.builder';

@Injectable()
export class ResolveVariablesUseCase {
  constructor(
    private readonly ticketService: TicketService,
    private readonly dynamicVariableService: DynamicVariableService,
  ) {}

  /**
   * Resolves all $variable tokens in content against applicant profile data.
   * Throws BadRequestException if any variable resolves to null.
   * Only resolves for FROM_AGENT messages — other types are returned unchanged.
   */
  async resolveContent(
    ticketId: string,
    content: string,
    authorType: MessageType,
  ): Promise<string> {
    // Skip resolution for non-agent messages
    if (authorType !== MessageType.FROM_AGENT) {
      return content;
    }

    const [detail, variables] = await Promise.all([
      this.ticketService.getTicketDetails(ticketId),
      this.dynamicVariableService.findAll(),
    ]);

    const context = buildApplicantContext(detail);
    const { resolved, missingVariables } = this.substitute(
      content,
      variables,
      context,
    );

    if (missingVariables.length > 0) {
      throw new BadRequestException({
        code: 'MISSING_VARIABLES',
        missingVariables,
        message: `Не удалось подставить переменные: ${missingVariables.join(', ')}`,
      });
    }

    return resolved;
  }

  /**
   * Performs the actual variable substitution.
   * Returns both the resolved content and a list of missing variables.
   */
  private substitute(
    content: string,
    variables: DynamicVariable[],
    context: Record<string, unknown>,
  ): { resolved: string; missingVariables: string[] } {
    const missingVariables: string[] = [];

    // Step 1: Protect escaped $$name → sentinel \x00name (null char)
    let result = content.replace(/\$\$([а-яёa-z_0-9]+)/gi, '\x00$1');

    // Step 2: Replace $name tokens (case-insensitive variable name matching)
    result = result.replace(/\$([а-яёa-z_0-9]+)/gi, (match, rawName) => {
      const nameLower = rawName.toLowerCase();

      // Find matching variable (case-insensitive)
      const variable = variables.find((v) => v.name.toLowerCase() === nameLower);

      if (!variable) {
        // Unknown variable — leave unchanged
        return match;
      }

      const raw = context[variable.sourceField];
      const formatted = formatVariableValue(raw);

      if (formatted === null) {
        // Missing data — collect error
        missingVariables.push(variable.name);
        return match; // Return placeholder, will error anyway
      }

      return formatted;
    });

    // Step 3: Restore sentinels → literal $name
    result = result.replace(/\x00([а-яёa-z_0-9]+)/g, '$$$1');

    return { resolved: result, missingVariables };
  }
}

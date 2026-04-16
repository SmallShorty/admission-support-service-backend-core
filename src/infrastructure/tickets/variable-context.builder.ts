import { TicketDetailResponse } from 'src/infrastructure/tickets/ticket.service';

/**
 * Builds a flat context object with all applicant data resolved by sourceField keys.
 * Converts complex structures (programs, exam scores) into a simple key-value map.
 */
export function buildApplicantContext(
  detail: TicketDetailResponse,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // Account fields
  const fullName = [
    detail.applicant.lastName,
    detail.applicant.firstName,
    detail.applicant.middleName,
  ]
    .filter(Boolean)
    .join(' ');
  context['account.fullName'] = fullName;
  context['account.firstName'] = detail.applicant.firstName;
  context['account.lastName'] = detail.applicant.lastName;
  context['account.middleName'] = detail.applicant.middleName || null;
  context['account.email'] = detail.applicant.email;

  // Applicant fields (profile)
  context['applicant.snils'] = detail.applicantSnils || null;
  context['applicant.hasBvi'] = detail.applicantHasBvi || null;
  context['applicant.hasSpecialQuota'] = detail.applicantHasSpecialQuota || null;
  context['applicant.hasSeparateQuota'] =
    detail.applicantHasSeparateQuota || null;
  context['applicant.hasTargetQuota'] = detail.applicantHasTargetQuota || null;
  context['applicant.hasPriorityRight'] =
    detail.applicantHasPriorityRight || null;
  context['applicant.originalDocumentReceived'] =
    detail.applicantOriginalDocumentReceived || null;
  context['applicant.originalDocumentReceivedAt'] =
    detail.applicantOriginalDocumentReceivedAt || null;

  // Program fields (sorted by priority asc)
  if (detail.applicantPrograms && detail.applicantPrograms.length > 0) {
    const sorted = detail.applicantPrograms.sort((a, b) => a.priority - b.priority);
    if (sorted[0]) {
      context['applicant.programs.first.programCode'] = sorted[0].programCode;
      context['applicant.programs.first.studyForm'] = sorted[0].studyForm;
      context['applicant.programs.first.admissionType'] = sorted[0].admissionType;
    }
    if (sorted[1]) {
      context['applicant.programs.second.programCode'] = sorted[1].programCode;
      context['applicant.programs.second.studyForm'] = sorted[1].studyForm;
      context['applicant.programs.second.admissionType'] = sorted[1].admissionType;
    }
    context['applicant.programs.count'] = sorted.length;
  } else {
    context['applicant.programs.count'] = 0;
  }

  // Exam scores
  if (detail.examScores && detail.examScores.length > 0) {
    let totalScore = 0;
    for (const exam of detail.examScores) {
      const key = `applicant.exams.${exam.subjectName}.score`;
      context[key] = exam.score;
      totalScore += exam.score;
    }
    context['applicant.exams.total'] = totalScore;
  } else {
    context['applicant.exams.total'] = 0;
  }

  return context;
}

/**
 * Formats a raw value to a string suitable for message substitution.
 * Returns null if value is null/undefined (caller should use fallbackText).
 */
export function formatVariableValue(raw: unknown): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw === 'boolean') {
    return raw ? 'Да' : 'Нет';
  }

  if (raw instanceof Date) {
    return raw.toLocaleDateString('ru-RU');
  }

  if (typeof raw === 'string' && raw.includes('T')) {
    // ISO string — try to parse as Date
    try {
      const date = new Date(raw);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
    } catch {
      // Fall through to String conversion
    }
  }

  return String(raw);
}

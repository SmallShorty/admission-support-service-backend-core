// prisma/seed-analytics.ts
// Run with: npx ts-node --project tsconfig.json -r tsconfig-paths/register prisma/seed-analytics.ts
//
// Requires the main seed (seed.ts) to have been run first — account IDs must already exist.
// Populates analytics-relevant data only:
//   - Tickets with assignedAt / firstReplyAt / resolvedAt / satisfactionScore
//   - AnalyticsSnapshot records (7 days, global + per operator)
//
// All timestamps use Moscow work hours (09:00–18:00 MSK = 06:00–15:00 UTC).

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TicketStatus,
  AdmissionIntentCategory,
  SatisfactionScore,
} from 'generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Account IDs — must match those created by seed.ts
// ---------------------------------------------------------------------------
const OPERATOR1_ID = '33333333-3333-4333-8333-333333333333';
const OPERATOR2_ID = '44444444-4444-4444-8444-444444444444';
const OPERATOR3_ID = '88888888-8888-4888-8888-888888888888';

const APPLICANT1_ID = '55555555-5555-4555-8555-555555555555';
const APPLICANT2_ID = '66666666-6666-4666-8666-666666666666';
const APPLICANT3_ID = '77777777-7777-4777-8777-777777777777';
const APPLICANT4_ID = '99999999-9999-4999-9999-999999999999';

// ---------------------------------------------------------------------------
// Date helpers — all times expressed as Moscow offset (UTC+3)
// MSK 09:00 = UTC 06:00, MSK 18:00 = UTC 15:00
// ---------------------------------------------------------------------------
const TODAY_MSK = new Date('2026-04-17T00:00:00+03:00');

/** Return a Date `days` days before TODAY_MSK at the given Moscow hour:minute */
const msk = (days: number, hourMsk: number, minuteMsk = 0): Date => {
  const d = new Date(TODAY_MSK);
  d.setDate(d.getDate() - days);
  d.setHours(hourMsk - 3, minuteMsk, 0, 0); // convert to UTC by subtracting 3h
  return d;
};

// ---------------------------------------------------------------------------
// Ticket specs
// ---------------------------------------------------------------------------
type TicketSpec = {
  id: string;
  applicantId: string;
  agentId: string;
  status: TicketStatus;
  intent: AdmissionIntentCategory;
  noteText: string;
  createdAt: Date;
  assignedAt: Date;
  firstReplyAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  satisfactionScore?: SatisfactionScore;
};

const tickets: TicketSpec[] = [
  // ============================================================
  // Day 0 — Today (2026-04-17)
  // ============================================================
  {
    id: 'a1000001-0000-4000-8000-000000000001',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Не приходит подтверждение о приёме документов',
    createdAt: msk(0, 9, 0),
    assignedAt: msk(0, 9, 7),
    firstReplyAt: msk(0, 9, 15),
    resolvedAt: msk(0, 10, 40),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000002-0000-4000-8000-000000000002',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.STATUS_VERIFICATION,
    noteText: 'Когда обновится статус заявления?',
    createdAt: msk(0, 9, 30),
    assignedAt: msk(0, 9, 38),
    firstReplyAt: msk(0, 9, 50),
    resolvedAt: msk(0, 11, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000003-0000-4000-8000-000000000003',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.SCORES_COMPETITION,
    noteText: 'Уточните проходной балл на программу 09.03.01',
    createdAt: msk(0, 10, 0),
    assignedAt: msk(0, 10, 10),
    firstReplyAt: msk(0, 10, 22),
    resolvedAt: msk(0, 12, 15),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000004-0000-4000-8000-000000000004',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
    noteText: 'Не работает форма оплаты договора',
    createdAt: msk(0, 11, 0),
    assignedAt: msk(0, 11, 12),
    firstReplyAt: msk(0, 11, 25),
    resolvedAt: msk(0, 13, 30),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },
  {
    id: 'a1000005-0000-4000-8000-000000000005',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.IN_PROGRESS,
    intent: AdmissionIntentCategory.ENROLLMENT,
    noteText: 'Вопрос по приказу о зачислении',
    createdAt: msk(0, 12, 0),
    assignedAt: msk(0, 12, 15),
    firstReplyAt: msk(0, 12, 30),
  },
  {
    id: 'a1000006-0000-4000-8000-000000000006',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.IN_PROGRESS,
    intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
    noteText: 'Ошибка при входе в личный кабинет',
    createdAt: msk(0, 13, 0),
    assignedAt: msk(0, 13, 10),
    firstReplyAt: msk(0, 13, 22),
  },
  {
    id: 'a1000007-0000-4000-8000-000000000007',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.IN_PROGRESS,
    intent: AdmissionIntentCategory.DORMITORY_HOUSING,
    noteText: 'Нужна информация по общежитиям',
    createdAt: msk(0, 14, 0),
    assignedAt: msk(0, 14, 18),
  },
  {
    id: 'a1000008-0000-4000-8000-000000000008',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.IN_PROGRESS,
    intent: AdmissionIntentCategory.PROGRAM_CONSULTATION,
    noteText: 'Хочу поменять специальность первого приоритета',
    createdAt: msk(0, 15, 0),
    assignedAt: msk(0, 15, 12),
  },

  // ============================================================
  // Day 1 — Yesterday
  // ============================================================
  {
    id: 'a1000009-0000-4000-8000-000000000009',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Как загрузить медицинскую справку',
    createdAt: msk(1, 9, 0),
    assignedAt: msk(1, 9, 10),
    firstReplyAt: msk(1, 9, 22),
    resolvedAt: msk(1, 11, 0),
    closedAt: msk(1, 12, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000010-0000-4000-8000-000000000010',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.GENERAL_INFO,
    noteText: 'Когда заканчивается приём документов?',
    createdAt: msk(1, 10, 0),
    assignedAt: msk(1, 10, 6),
    firstReplyAt: msk(1, 10, 14),
    resolvedAt: msk(1, 10, 50),
    closedAt: msk(1, 11, 45),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000011-0000-4000-8000-000000000011',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.SCORES_COMPETITION,
    noteText: 'Какой проходной балл в 2025 году?',
    createdAt: msk(1, 11, 0),
    assignedAt: msk(1, 11, 18),
    firstReplyAt: msk(1, 11, 35),
    resolvedAt: msk(1, 13, 0),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000012-0000-4000-8000-000000000012',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
    noteText: 'Не отображаются загруженные файлы',
    createdAt: msk(1, 12, 0),
    assignedAt: msk(1, 12, 22),
    firstReplyAt: msk(1, 12, 40),
    resolvedAt: msk(1, 14, 30),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },
  {
    id: 'a1000013-0000-4000-8000-000000000013',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.ENROLLMENT,
    noteText: 'В каком приказе моя фамилия?',
    createdAt: msk(1, 13, 0),
    assignedAt: msk(1, 13, 12),
    firstReplyAt: msk(1, 13, 25),
    resolvedAt: msk(1, 15, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000014-0000-4000-8000-000000000014',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
    noteText: 'Вопрос по реквизитам для оплаты',
    createdAt: msk(1, 14, 0),
    assignedAt: msk(1, 14, 20),
    firstReplyAt: msk(1, 14, 35),
    resolvedAt: msk(1, 16, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000015-0000-4000-8000-000000000015',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.IN_PROGRESS,
    intent: AdmissionIntentCategory.DORMITORY_HOUSING,
    noteText: 'Подать заявку на общежитие',
    createdAt: msk(1, 15, 0),
    assignedAt: msk(1, 15, 18),
  },

  // ============================================================
  // Day 2
  // ============================================================
  {
    id: 'a1000016-0000-4000-8000-000000000016',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Загрузить аттестат в отсканированном виде',
    createdAt: msk(2, 9, 30),
    assignedAt: msk(2, 9, 42),
    firstReplyAt: msk(2, 9, 55),
    resolvedAt: msk(2, 11, 30),
    closedAt: msk(2, 12, 30),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000017-0000-4000-8000-000000000017',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.STATUS_VERIFICATION,
    noteText: 'Статус заявления застрял в "Проверке"',
    createdAt: msk(2, 10, 0),
    assignedAt: msk(2, 10, 12),
    firstReplyAt: msk(2, 10, 28),
    resolvedAt: msk(2, 12, 0),
    closedAt: msk(2, 13, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000018-0000-4000-8000-000000000018',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.GENERAL_INFO,
    noteText: 'Какие документы нужны для целевой квоты?',
    createdAt: msk(2, 11, 0),
    assignedAt: msk(2, 11, 14),
    firstReplyAt: msk(2, 11, 25),
    resolvedAt: msk(2, 13, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000019-0000-4000-8000-000000000019',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PROGRAM_CONSULTATION,
    noteText: 'Сравнение программ по информатике',
    createdAt: msk(2, 12, 0),
    assignedAt: msk(2, 12, 22),
    firstReplyAt: msk(2, 12, 38),
    resolvedAt: msk(2, 14, 0),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000020-0000-4000-8000-000000000020',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
    noteText: 'Забыл пароль от личного кабинета',
    createdAt: msk(2, 13, 0),
    assignedAt: msk(2, 13, 8),
    firstReplyAt: msk(2, 13, 16),
    resolvedAt: msk(2, 14, 0),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },
  {
    id: 'a1000021-0000-4000-8000-000000000021',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.DEADLINES_TIMELINES,
    noteText: 'До какого числа нужно сдать оригинал аттестата?',
    createdAt: msk(2, 15, 0),
    assignedAt: msk(2, 15, 22),
    firstReplyAt: msk(2, 15, 38),
    resolvedAt: msk(2, 17, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },

  // ============================================================
  // Day 3
  // ============================================================
  {
    id: 'a1000022-0000-4000-8000-000000000022',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Ошибка при отправке пакета документов',
    createdAt: msk(3, 9, 0),
    assignedAt: msk(3, 9, 12),
    firstReplyAt: msk(3, 9, 28),
    resolvedAt: msk(3, 11, 0),
    closedAt: msk(3, 12, 30),
    satisfactionScore: SatisfactionScore.POOR,
  },
  {
    id: 'a1000023-0000-4000-8000-000000000023',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.SCORES_COMPETITION,
    noteText: 'Можно ли улучшить позицию в конкурсных списках?',
    createdAt: msk(3, 10, 0),
    assignedAt: msk(3, 10, 18),
    firstReplyAt: msk(3, 10, 35),
    resolvedAt: msk(3, 12, 30),
    closedAt: msk(3, 13, 30),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000024-0000-4000-8000-000000000024',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.ENROLLMENT,
    noteText: 'Когда выйдет приказ о зачислении на бюджет?',
    createdAt: msk(3, 11, 30),
    assignedAt: msk(3, 11, 42),
    firstReplyAt: msk(3, 12, 0),
    resolvedAt: msk(3, 13, 30),
    closedAt: msk(3, 14, 30),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000025-0000-4000-8000-000000000025',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
    noteText: 'Нужен счёт на оплату первого курса',
    createdAt: msk(3, 12, 0),
    assignedAt: msk(3, 12, 10),
    firstReplyAt: msk(3, 12, 24),
    resolvedAt: msk(3, 14, 0),
    closedAt: msk(3, 15, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000026-0000-4000-8000-000000000026',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
    noteText: 'Сайт недоступен с мобильного устройства',
    createdAt: msk(3, 14, 0),
    assignedAt: msk(3, 14, 20),
    firstReplyAt: msk(3, 14, 35),
    resolvedAt: msk(3, 16, 0),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },

  // ============================================================
  // Day 4
  // ============================================================
  {
    id: 'a1000027-0000-4000-8000-000000000027',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Система не принимает СНИЛС',
    createdAt: msk(4, 9, 0),
    assignedAt: msk(4, 9, 18),
    firstReplyAt: msk(4, 9, 32),
    resolvedAt: msk(4, 11, 0),
    closedAt: msk(4, 12, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000028-0000-4000-8000-000000000028',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.GENERAL_INFO,
    noteText: 'Информация о форме очного обучения',
    createdAt: msk(4, 10, 0),
    assignedAt: msk(4, 10, 14),
    firstReplyAt: msk(4, 10, 24),
    resolvedAt: msk(4, 11, 30),
    closedAt: msk(4, 12, 30),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000029-0000-4000-8000-000000000029',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.STATUS_VERIFICATION,
    noteText: 'Заявление зависло на проверке 5 дней',
    createdAt: msk(4, 11, 0),
    assignedAt: msk(4, 11, 24),
    firstReplyAt: msk(4, 11, 42),
    resolvedAt: msk(4, 13, 30),
    closedAt: msk(4, 14, 30),
    satisfactionScore: SatisfactionScore.POOR,
  },
  {
    id: 'a1000030-0000-4000-8000-000000000030',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PROGRAM_CONSULTATION,
    noteText: 'Возможно ли перевестись между программами?',
    createdAt: msk(4, 12, 0),
    assignedAt: msk(4, 12, 12),
    firstReplyAt: msk(4, 12, 27),
    resolvedAt: msk(4, 14, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000031-0000-4000-8000-000000000031',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.DEADLINES_TIMELINES,
    noteText: 'Когда последний день подачи заявлений?',
    createdAt: msk(4, 13, 0),
    assignedAt: msk(4, 13, 6),
    firstReplyAt: msk(4, 13, 14),
    resolvedAt: msk(4, 14, 0),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000032-0000-4000-8000-000000000032',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.DORMITORY_HOUSING,
    noteText: 'Как подать заявку на место в общежитии?',
    createdAt: msk(4, 14, 30),
    assignedAt: msk(4, 14, 42),
    firstReplyAt: msk(4, 14, 55),
    resolvedAt: msk(4, 16, 30),
    satisfactionScore: SatisfactionScore.GOOD,
  },

  // ============================================================
  // Day 5
  // ============================================================
  {
    id: 'a1000033-0000-4000-8000-000000000033',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.SCORES_COMPETITION,
    noteText: 'Как узнать своё место в конкурсном списке?',
    createdAt: msk(5, 9, 0),
    assignedAt: msk(5, 9, 12),
    firstReplyAt: msk(5, 9, 22),
    resolvedAt: msk(5, 10, 30),
    closedAt: msk(5, 11, 30),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000034-0000-4000-8000-000000000034',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
    noteText: 'Не работает загрузка фото',
    createdAt: msk(5, 10, 30),
    assignedAt: msk(5, 10, 42),
    firstReplyAt: msk(5, 10, 58),
    resolvedAt: msk(5, 12, 30),
    closedAt: msk(5, 13, 30),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000035-0000-4000-8000-000000000035',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Как исправить ошибку в загруженном документе?',
    createdAt: msk(5, 12, 0),
    assignedAt: msk(5, 12, 18),
    firstReplyAt: msk(5, 12, 35),
    resolvedAt: msk(5, 14, 0),
    closedAt: msk(5, 15, 0),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },
  {
    id: 'a1000036-0000-4000-8000-000000000036',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.ENROLLMENT,
    noteText: 'Нужно подтверждение о зачислении для работодателя',
    createdAt: msk(5, 13, 0),
    assignedAt: msk(5, 13, 22),
    firstReplyAt: msk(5, 13, 40),
    resolvedAt: msk(5, 15, 30),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000037-0000-4000-8000-000000000037',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
    noteText: 'Возврат оплаты при отказе от поступления',
    createdAt: msk(5, 14, 0),
    assignedAt: msk(5, 14, 15),
    firstReplyAt: msk(5, 14, 30),
    resolvedAt: msk(5, 16, 0),
    satisfactionScore: SatisfactionScore.AVERAGE,
  },

  // ============================================================
  // Day 6
  // ============================================================
  {
    id: 'a1000038-0000-4000-8000-000000000038',
    applicantId: APPLICANT2_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.GENERAL_INFO,
    noteText: 'Информация о льготах при поступлении',
    createdAt: msk(6, 9, 0),
    assignedAt: msk(6, 9, 10),
    firstReplyAt: msk(6, 9, 18),
    resolvedAt: msk(6, 10, 0),
    closedAt: msk(6, 11, 0),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000039-0000-4000-8000-000000000039',
    applicantId: APPLICANT3_ID,
    agentId: OPERATOR3_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.STATUS_VERIFICATION,
    noteText: 'Нужна справка о рассмотрении заявления',
    createdAt: msk(6, 11, 0),
    assignedAt: msk(6, 11, 12),
    firstReplyAt: msk(6, 11, 26),
    resolvedAt: msk(6, 13, 0),
    closedAt: msk(6, 14, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
  {
    id: 'a1000040-0000-4000-8000-000000000040',
    applicantId: APPLICANT4_ID,
    agentId: OPERATOR1_ID,
    status: TicketStatus.CLOSED,
    intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
    noteText: 'Какой формат файлов допустим для загрузки?',
    createdAt: msk(6, 12, 30),
    assignedAt: msk(6, 12, 42),
    firstReplyAt: msk(6, 12, 52),
    resolvedAt: msk(6, 13, 30),
    closedAt: msk(6, 14, 30),
    satisfactionScore: SatisfactionScore.EXCELLENT,
  },
  {
    id: 'a1000041-0000-4000-8000-000000000041',
    applicantId: APPLICANT1_ID,
    agentId: OPERATOR2_ID,
    status: TicketStatus.RESOLVED,
    intent: AdmissionIntentCategory.PROGRAM_CONSULTATION,
    noteText: 'Есть ли программы на вечерней форме?',
    createdAt: msk(6, 14, 0),
    assignedAt: msk(6, 14, 22),
    firstReplyAt: msk(6, 14, 38),
    resolvedAt: msk(6, 16, 0),
    satisfactionScore: SatisfactionScore.GOOD,
  },
];

// ---------------------------------------------------------------------------
// Analytics snapshot specs
// Snapshots are written at 18:30 MSK (15:30 UTC) — end of work day.
// Metrics: total_requests | avg_rt (seconds) | csat_score (1-5)
// ---------------------------------------------------------------------------
type SnapshotSpec = {
  metricName: string;
  value: number;
  agentId: string | null;
  timestamp: Date;
};

const snapshots: SnapshotSpec[] = [];

const dailyGlobal: {
  day: number;
  total: number;
  avgRt: number;
  csat: number;
}[] = [
  { day: 6, total: 4,  avgRt: 5040,  csat: 4.5 },
  { day: 5, total: 5,  avgRt: 5760,  csat: 3.8 },
  { day: 4, total: 6,  avgRt: 4680,  csat: 4.2 },
  { day: 3, total: 5,  avgRt: 5400,  csat: 3.8 },
  { day: 2, total: 6,  avgRt: 4920,  csat: 4.2 },
  { day: 1, total: 7,  avgRt: 4320,  csat: 4.3 },
  { day: 0, total: 8,  avgRt: 4560,  csat: 4.0 },
];

for (const row of dailyGlobal) {
  const ts = msk(row.day, 18, 30);
  snapshots.push({ metricName: 'total_requests', value: row.total,  agentId: null, timestamp: ts });
  snapshots.push({ metricName: 'avg_rt',         value: row.avgRt,  agentId: null, timestamp: ts });
  snapshots.push({ metricName: 'csat_score',     value: row.csat,   agentId: null, timestamp: ts });
}

const perAgent: {
  agentId: string;
  days: { day: number; total: number; avgRt: number; csat: number }[];
}[] = [
  {
    agentId: OPERATOR1_ID,
    days: [
      { day: 6, total: 1, avgRt: 4200, csat: 4.5 },
      { day: 5, total: 2, avgRt: 5040, csat: 4.0 },
      { day: 4, total: 2, avgRt: 4080, csat: 4.5 },
      { day: 3, total: 2, avgRt: 5400, csat: 3.5 },
      { day: 2, total: 2, avgRt: 4560, csat: 4.0 },
      { day: 1, total: 2, avgRt: 3840, csat: 4.5 },
      { day: 0, total: 3, avgRt: 4080, csat: 4.3 },
    ],
  },
  {
    agentId: OPERATOR2_ID,
    days: [
      { day: 6, total: 2, avgRt: 5760, csat: 4.5 },
      { day: 5, total: 1, avgRt: 7200, csat: 3.0 },
      { day: 4, total: 2, avgRt: 5280, csat: 4.0 },
      { day: 3, total: 2, avgRt: 4920, csat: 4.0 },
      { day: 2, total: 2, avgRt: 5160, csat: 4.0 },
      { day: 1, total: 2, avgRt: 4800, csat: 4.5 },
      { day: 0, total: 3, avgRt: 5280, csat: 3.7 },
    ],
  },
  {
    agentId: OPERATOR3_ID,
    days: [
      { day: 6, total: 1, avgRt: 6000, csat: 4.0 },
      { day: 5, total: 2, avgRt: 5640, csat: 4.0 },
      { day: 4, total: 2, avgRt: 4680, csat: 4.0 },
      { day: 3, total: 1, avgRt: 6120, csat: 4.5 },
      { day: 2, total: 2, avgRt: 4800, csat: 4.0 },
      { day: 1, total: 3, avgRt: 4080, csat: 4.0 },
      { day: 0, total: 2, avgRt: 4200, csat: 3.5 },
    ],
  },
];

for (const agent of perAgent) {
  for (const row of agent.days) {
    const ts = msk(row.day, 18, 30);
    snapshots.push({ metricName: 'total_requests', value: row.total,  agentId: agent.agentId, timestamp: ts });
    snapshots.push({ metricName: 'avg_rt',         value: row.avgRt,  agentId: agent.agentId, timestamp: ts });
    snapshots.push({ metricName: 'csat_score',     value: row.csat,   agentId: agent.agentId, timestamp: ts });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('📈 Seeding analytics data...');
  console.log(
    '   Requires main seed (seed.ts) to have been run first.\n',
  );

  // Clean only analytics-owned data so the main seed is unaffected
  console.log('🧹 Cleaning existing analytics data...');

  // Delete only the tickets this file owns (ids starting with a1000...)
  const analyticsIds = tickets.map((t) => t.id);
  await prisma.ticket.deleteMany({ where: { id: { in: analyticsIds } } });
  await prisma.analyticsSnapshot.deleteMany();

  console.log('✅ Cleaned\n');

  // ── Tickets ────────────────────────────────────────────────────────────────
  console.log(`📋 Creating ${tickets.length} tickets...`);
  for (const t of tickets) {
    await prisma.ticket.create({
      data: {
        id: t.id,
        applicantId: t.applicantId,
        agentId: t.agentId,
        status: t.status,
        priority: 5,
        intent: t.intent,
        noteText: t.noteText,
        createdAt: t.createdAt,
        assignedAt: t.assignedAt,
        firstReplyAt: t.firstReplyAt ?? null,
        resolvedAt: t.resolvedAt ?? null,
        closedAt: t.closedAt ?? null,
        satisfactionScore: t.satisfactionScore ?? null,
        updatedAt: t.resolvedAt ?? t.assignedAt,
        lastMessageAt: t.resolvedAt ?? t.assignedAt,
      },
    });
  }
  console.log('✅ Tickets created\n');

  // ── Snapshots ──────────────────────────────────────────────────────────────
  console.log(`📊 Creating ${snapshots.length} analytics snapshots...`);
  await prisma.analyticsSnapshot.createMany({
    data: snapshots.map((s) => ({
      metricName: s.metricName,
      value: s.value,
      agentId: s.agentId,
      timestamp: s.timestamp,
    })),
  });
  console.log('✅ Snapshots created\n');

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('=================================');
  console.log('✅ Analytics seed completed!');
  console.log('=================================');
  console.log(`  🎫 Tickets inserted : ${tickets.length} (7 days, MSK 09-18)`);
  console.log(`  📈 Snapshots inserted: ${snapshots.length} (global + 3 operators × 7 days × 3 metrics)`);
  console.log('\n  Ticket breakdown by day:');
  for (let d = 6; d >= 0; d--) {
    const count = tickets.filter((t) => {
      const diff = Math.round(
        (TODAY_MSK.getTime() - t.createdAt.getTime()) / 86_400_000,
      );
      return diff === d;
    }).length;
    const label = d === 0 ? 'Today      ' : `${d} day(s) ago`;
    console.log(`    ${label}: ${count} tickets`);
  }
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding analytics data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

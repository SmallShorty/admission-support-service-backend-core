// prisma/seed.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  PrismaClient,
  TicketStatus,
  AdmissionIntentCategory,
  ExamType,
  StudyForm,
  AdmissionType,
  SatisfactionScore,
} from 'generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number, hours = 0, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - minutes);
  d.setSeconds(0, 0);
  return d;
}

const applicantNames = [
  {
    firstName: 'Алексей',
    lastName: 'Иванов',
    middleName: 'Дмитриевич',
    email: 'alexey.ivanov@example.com',
  },
  {
    firstName: 'Мария',
    lastName: 'Петрова',
    middleName: 'Андреевна',
    email: 'maria.petrova@example.com',
  },
  {
    firstName: 'Дмитрий',
    lastName: 'Соколов',
    middleName: 'Павлович',
    email: 'dmitry.sokolov@example.com',
  },
  {
    firstName: 'Ольга',
    lastName: 'Козлова',
    middleName: 'Игоревна',
    email: 'olga.kozlova@example.com',
  },
  {
    firstName: 'Сергей',
    lastName: 'Морозов',
    middleName: 'Владимирович',
    email: 'sergey.morozov@example.com',
  },
  {
    firstName: 'Елена',
    lastName: 'Лебедева',
    middleName: 'Сергеевна',
    email: 'elena.lebedeva@example.com',
  },
  {
    firstName: 'Павел',
    lastName: 'Волков',
    middleName: 'Иванович',
    email: 'pavel.volkov@example.com',
  },
  {
    firstName: 'Анна',
    lastName: 'Соответствующая',
    middleName: 'Петровна',
    email: 'anna.sotvetsv@example.com',
  },
  {
    firstName: 'Иван',
    lastName: 'Смирнов',
    middleName: 'Алексеевич',
    email: 'ivan.smirnov@example.com',
  },
  {
    firstName: 'Виктория',
    lastName: 'Федорова',
    middleName: 'Николаевна',
    email: 'victoria.fedorova@example.com',
  },
  {
    firstName: 'Константин',
    lastName: 'Лавров',
    middleName: 'Сергеевич',
    email: 'konstantin.lavrov@example.com',
  },
  {
    firstName: 'Наталья',
    lastName: 'Архипова',
    middleName: 'Вячеславовна',
    email: 'natalya.arkhipova@example.com',
  },
  {
    firstName: 'Андрей',
    lastName: 'Казаков',
    middleName: 'Геннадьевич',
    email: 'andrey.kazakov@example.com',
  },
  {
    firstName: 'Люба',
    lastName: 'Орлова',
    middleName: 'Максимовна',
    email: 'luba.orlova@example.com',
  },
  {
    firstName: 'Михаил',
    lastName: 'Гордеев',
    middleName: 'Юрьевич',
    email: 'mikhail.gordeev@example.com',
  },
];

const intents = [
  AdmissionIntentCategory.TECHNICAL_ISSUES,
  AdmissionIntentCategory.DEADLINES_TIMELINES,
  AdmissionIntentCategory.DOCUMENT_SUBMISSION,
  AdmissionIntentCategory.STATUS_VERIFICATION,
  AdmissionIntentCategory.SCORES_COMPETITION,
  AdmissionIntentCategory.PAYMENTS_CONTRACTS,
  AdmissionIntentCategory.ENROLLMENT,
  AdmissionIntentCategory.DORMITORY_HOUSING,
  AdmissionIntentCategory.STUDIES_SCHEDULE,
  AdmissionIntentCategory.EVENTS,
  AdmissionIntentCategory.GENERAL_INFO,
  AdmissionIntentCategory.PROGRAM_CONSULTATION,
];

const supportTexts = {
  [AdmissionIntentCategory.TECHNICAL_ISSUES]:
    'Не могу зайти в личный кабинет, система выдает ошибку 500',
  [AdmissionIntentCategory.DEADLINES_TIMELINES]:
    'Когда закончится приём документов?',
  [AdmissionIntentCategory.DOCUMENT_SUBMISSION]:
    'Не могу загрузить скан паспорта, ошибка при загрузке',
  [AdmissionIntentCategory.STATUS_VERIFICATION]:
    'Как узнать статус рассмотрения моих документов?',
  [AdmissionIntentCategory.SCORES_COMPETITION]:
    'Какие баллы нужны для поступления?',
  [AdmissionIntentCategory.PAYMENTS_CONTRACTS]:
    'Какова стоимость обучения на платном отделении?',
  [AdmissionIntentCategory.ENROLLMENT]: 'Когда начинается обучение?',
  [AdmissionIntentCategory.DORMITORY_HOUSING]:
    'Можно ли получить место в общежитии?',
  [AdmissionIntentCategory.STUDIES_SCHEDULE]:
    'Какое расписание занятий на первом курсе?',
  [AdmissionIntentCategory.EVENTS]: 'Когда проводится день открытых дверей?',
  [AdmissionIntentCategory.GENERAL_INFO]:
    'Какие документы нужны для поступления?',
  [AdmissionIntentCategory.PROGRAM_CONSULTATION]:
    'Расскажите подробнее о программе обучения',
};

const agentResponses = [
  'Здравствуйте! Спасибо за обращение. Я помогу вам разобраться с этой проблемой.',
  'Добрый день! Проверю информацию и скоро вам отвечу.',
  'Здравствуйте! Вот ответ на ваш вопрос:',
  'Спасибо за вопрос. Полезная информация:',
];

async function main() {
  console.log('🌱 Start seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.ticketMessage.deleteMany();
  await prisma.escalationTicketAudit.deleteMany();
  await prisma.userConnection.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.applicantProgram.deleteMany();
  await prisma.examScore.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.dynamicVariable.deleteMany();
  await prisma.template.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.account.deleteMany();

  console.log('✅ Cleaned existing data');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('admin', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);

  // ========== Create Staff ==========

  const admin = await prisma.account.create({
    data: {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'admin@admin.com',
      firstName: 'Мокроусова',
      lastName: 'Лариса',
      middleName: 'Викторовна',
      role: 'ADMIN',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });
  console.log('👑 Created admin:', admin.email);

  const supervisor = await prisma.account.create({
    data: {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'supervisor@example.com',
      firstName: 'Елена',
      lastName: 'Смирнова',
      middleName: 'Александровна',
      role: 'SUPERVISOR',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });
  console.log('👔 Created supervisor:', supervisor.email);

  const operatorNames = [
    { firstName: 'Иван', lastName: 'Петров', middleName: 'Сергеевич' },
    { firstName: 'Анна', lastName: 'Сидорова', middleName: 'Владимировна' },
    { firstName: 'Михаил', lastName: 'Кузнецов', middleName: 'Алексеевич' },
    { firstName: 'Наталья', lastName: 'Орлова', middleName: 'Игоревна' },
    { firstName: 'Павел', lastName: 'Волков', middleName: 'Иванович' },
  ];

  const operators: (typeof admin)[] = [];
  for (let i = 0; i < operatorNames.length; i++) {
    const op = await prisma.account.create({
      data: {
        id: uuidv4(),
        email: `operator${i + 1}@example.com`,
        firstName: operatorNames[i].firstName,
        lastName: operatorNames[i].lastName,
        middleName: operatorNames[i].middleName,
        role: 'OPERATOR',
        authProvider: 'INTERNAL',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      },
    });
    operators.push(op);
  }
  console.log(`👨‍💼 Created ${operators.length} operators`);

  // ========== Create Applicants ==========

  const applicants: (typeof admin)[] = [];
  for (let i = 0; i < applicantNames.length; i++) {
    const applicantAccount = await prisma.account.create({
      data: {
        id: uuidv4(),
        email: applicantNames[i].email,
        firstName: applicantNames[i].firstName,
        lastName: applicantNames[i].lastName,
        middleName: applicantNames[i].middleName,
        role: 'APPLICANT',
        authProvider: 'INTERNAL',
        status: 'ACTIVE',
        passwordHash: hashedUserPassword,
      },
    });

    await prisma.applicant.create({
      data: {
        id: applicantAccount.id,
        snils: `${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
        hasBvi: Math.random() < 0.1,
        hasSpecialQuota: Math.random() < 0.15,
        hasSeparateQuota: Math.random() < 0.1,
        hasTargetQuota: Math.random() < 0.2,
        hasPriorityRight: Math.random() < 0.15,
        originalDocumentReceived: Math.random() < 0.8,
        originalDocumentReceivedAt:
          Math.random() < 0.8 ? daysAgo(Math.floor(Math.random() * 20)) : null,
      },
    });

    applicants.push(applicantAccount);

    // Create exam scores
    const examSubjects = [
      'Русский язык',
      'Математика',
      'Физика',
      'Информатика',
      'Обществознание',
    ];
    for (let j = 0; j < 3; j++) {
      await prisma.examScore.create({
        data: {
          applicantId: applicantAccount.id,
          subjectName: examSubjects[j],
          score: 50 + Math.floor(Math.random() * 50),
          type: Math.random() < 0.7 ? ExamType.EGE : ExamType.INTERNAL,
        },
      });
    }

    // Create programs
    for (let j = 1; j <= (Math.random() < 0.7 ? 2 : 1); j++) {
      await prisma.applicantProgram.create({
        data: {
          applicantId: applicantAccount.id,
          programId: 100 * i + j,
          programCode: `${String(Math.floor(Math.random() * 99)).padStart(2, '0')}.${String(Math.floor(Math.random() * 9) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 9) + 1).padStart(2, '0')}`,
          studyForm:
            Math.random() < 0.8 ? StudyForm.FULL_TIME : StudyForm.PART_TIME,
          admissionType: [
            AdmissionType.BUDGET_COMPETITIVE,
            AdmissionType.PAID,
            AdmissionType.BUDGET_SPECIAL_QUOTA,
            AdmissionType.TARGET,
          ][Math.floor(Math.random() * 4)],
          priority: j,
        },
      });
    }
  }

  console.log(
    `📚 Created ${applicants.length} applicants with profiles and exam scores`,
  );

  // ========== Create ~45 Tickets with varied statuses ==========

  let ticketCounter = 0;

  // NEW tickets (10)
  for (let i = 0; i < 10; i++) {
    const applicant = applicants[Math.floor(Math.random() * applicants.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const daysOld = Math.floor(Math.random() * 5);

    const ticket = await prisma.ticket.create({
      data: {
        id: uuidv4(),
        applicantId: applicant.id,
        agentId: null,
        status: TicketStatus.NEW,
        priority: Math.floor(Math.random() * 10) + 1,
        intent,
        noteText: supportTexts[intent],
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        updatedAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        lastMessageAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
      },
    });

    // First message from applicant
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: applicant.id,
        authorType: 'FROM_CUSTOMER',
        content: supportTexts[intent],
        status: 'SENT',
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
      },
    });

    ticketCounter++;
  }
  console.log(`🆕 Created ${ticketCounter} NEW tickets`);

  // IN_PROGRESS tickets (15)
  let inProgressCount = 0;
  for (let i = 0; i < 15; i++) {
    const applicant = applicants[Math.floor(Math.random() * applicants.length)];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const daysOld = Math.floor(Math.random() * 7) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        id: uuidv4(),
        applicantId: applicant.id,
        agentId: operator.id,
        status: TicketStatus.IN_PROGRESS,
        priority: Math.floor(Math.random() * 10) + 1,
        intent,
        noteText: supportTexts[intent],
        assignedAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        updatedAt: daysAgo(0, Math.floor(Math.random() * 24)),
        lastMessageAt: daysAgo(0, Math.floor(Math.random() * 24)),
      },
    });

    // First message from applicant
    const applicantMsgTime = daysAgo(daysOld, Math.floor(Math.random() * 24));
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: applicant.id,
        authorType: 'FROM_CUSTOMER',
        content: supportTexts[intent],
        status: 'SENT',
        createdAt: applicantMsgTime,
      },
    });

    // Agent response
    const agentMsgTime = daysAgo(daysOld - 1, Math.floor(Math.random() * 20));
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: operator.id,
        authorType: 'FROM_AGENT',
        content:
          agentResponses[Math.floor(Math.random() * agentResponses.length)],
        status: 'DELIVERED',
        deliveredAt: agentMsgTime,
        createdAt: agentMsgTime,
      },
    });

    // Possible follow-up messages
    if (Math.random() < 0.6) {
      const followupTime = daysAgo(
        Math.floor(Math.random() * (daysOld - 1)),
        Math.floor(Math.random() * 24),
      );
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: applicant.id,
          authorType: 'FROM_CUSTOMER',
          content: 'Спасибо за информацию!',
          status: 'SENT',
          createdAt: followupTime,
        },
      });
    }

    inProgressCount++;
  }
  console.log(`🔄 Created ${inProgressCount} IN_PROGRESS tickets`);

  // RESOLVED tickets (12)
  let resolvedCount = 0;
  for (let i = 0; i < 12; i++) {
    const applicant = applicants[Math.floor(Math.random() * applicants.length)];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const daysOld = Math.floor(Math.random() * 15) + 3;

    const ticket = await prisma.ticket.create({
      data: {
        id: uuidv4(),
        applicantId: applicant.id,
        agentId: operator.id,
        status: TicketStatus.RESOLVED,
        priority: Math.floor(Math.random() * 10) + 1,
        intent,
        noteText: supportTexts[intent],
        satisfactionScore: [
          SatisfactionScore.EXCELLENT,
          SatisfactionScore.GOOD,
          SatisfactionScore.AVERAGE,
        ][Math.floor(Math.random() * 3)],
        assignedAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        resolvedAt: daysAgo(
          daysOld - Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 24),
        ),
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        updatedAt: daysAgo(
          daysOld - Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 24),
        ),
        lastMessageAt: daysAgo(
          daysOld - Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 24),
        ),
      },
    });

    // Message from applicant
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: applicant.id,
        authorType: 'FROM_CUSTOMER',
        content: supportTexts[intent],
        status: 'SENT',
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
      },
    });

    // Agent response
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: operator.id,
        authorType: 'FROM_AGENT',
        content:
          agentResponses[Math.floor(Math.random() * agentResponses.length)],
        status: 'SEEN',
        deliveredAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        seenAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        createdAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
      },
    });

    resolvedCount++;
  }
  console.log(`✅ Created ${resolvedCount} RESOLVED tickets`);

  // CLOSED tickets (8)
  let closedCount = 0;
  for (let i = 0; i < 8; i++) {
    const applicant = applicants[Math.floor(Math.random() * applicants.length)];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const daysOld = Math.floor(Math.random() * 20) + 5;

    const ticket = await prisma.ticket.create({
      data: {
        id: uuidv4(),
        applicantId: applicant.id,
        agentId: operator.id,
        status: TicketStatus.CLOSED,
        priority: Math.floor(Math.random() * 10) + 1,
        intent,
        noteText: supportTexts[intent],
        satisfactionScore: [
          SatisfactionScore.EXCELLENT,
          SatisfactionScore.GOOD,
        ][Math.floor(Math.random() * 2)],
        assignedAt: daysAgo(daysOld - 2, Math.floor(Math.random() * 20)),
        resolvedAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        closedAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        updatedAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
        lastMessageAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
      },
    });

    // Message from applicant
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: applicant.id,
        authorType: 'FROM_CUSTOMER',
        content: supportTexts[intent],
        status: 'SENT',
        createdAt: daysAgo(daysOld, Math.floor(Math.random() * 24)),
      },
    });

    // Agent response
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: operator.id,
        authorType: 'FROM_AGENT',
        content:
          agentResponses[Math.floor(Math.random() * agentResponses.length)],
        status: 'SEEN',
        deliveredAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        seenAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
        createdAt: daysAgo(daysOld - 1, Math.floor(Math.random() * 20)),
      },
    });

    closedCount++;
  }
  console.log(`🔒 Created ${closedCount} CLOSED tickets`);

  // ========== Create Dynamic Variables ==========

  const dynamicVariablesData = [
    {
      name: 'фио',
      description: 'Полное имя абитуриента (Фамилия Имя Отчество)',
      sourceField: 'account.fullName',
      fallbackText: 'Уважаемый абитуриент',
      isSystem: true,
    },
    {
      name: 'имя',
      description: 'Имя абитуриента',
      sourceField: 'account.firstName',
      fallbackText: 'Абитуриент',
      isSystem: true,
    },
    {
      name: 'фамилия',
      description: 'Фамилия абитуриента',
      sourceField: 'account.lastName',
      fallbackText: '—',
      isSystem: true,
    },
    {
      name: 'отчество',
      description: 'Отчество абитуриента',
      sourceField: 'account.middleName',
      fallbackText: '—',
      isSystem: true,
    },
    {
      name: 'email',
      description: 'Email абитуриента',
      sourceField: 'account.email',
      fallbackText: '—',
      isSystem: true,
    },
    {
      name: 'снилс',
      description: 'СНИЛС абитуриента',
      sourceField: 'applicant.snils',
      fallbackText: 'не указан',
      isSystem: true,
    },
    {
      name: 'льгота_бви',
      description: 'Право на поступление без вступительных испытаний',
      sourceField: 'applicant.hasBvi',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'льгота_особая',
      description: 'Особая квота',
      sourceField: 'applicant.hasSpecialQuota',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'льгота_отдельная',
      description: 'Отдельная квота',
      sourceField: 'applicant.hasSeparateQuota',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'льгота_целевая',
      description: 'Целевая квота',
      sourceField: 'applicant.hasTargetQuota',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'преимущественное_право',
      description: 'Преимущественное право зачисления',
      sourceField: 'applicant.hasPriorityRight',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'оригинал_сдан',
      description: 'Оригинал аттестата сдан',
      sourceField: 'applicant.originalDocumentReceived',
      fallbackText: 'нет',
      isSystem: true,
    },
    {
      name: 'оригинал_дата',
      description: 'Дата сдачи оригинала аттестата',
      sourceField: 'applicant.originalDocumentReceivedAt',
      fallbackText: 'не указана',
      isSystem: true,
    },
    {
      name: 'направление_1',
      description: 'Код программы первого приоритета',
      sourceField: 'applicant.programs.first.programCode',
      fallbackText: 'не выбрано',
      isSystem: true,
    },
    {
      name: 'форма_1',
      description: 'Форма обучения первого приоритета',
      sourceField: 'applicant.programs.first.studyForm',
      fallbackText: 'не указана',
      isSystem: true,
    },
    {
      name: 'основание_1',
      description: 'Основание поступления первого приоритета',
      sourceField: 'applicant.programs.first.admissionType',
      fallbackText: 'не указано',
      isSystem: true,
    },
    {
      name: 'направление_2',
      description: 'Код программы второго приоритета',
      sourceField: 'applicant.programs.second.programCode',
      fallbackText: 'не выбрано',
      isSystem: true,
    },
    {
      name: 'форма_2',
      description: 'Форма обучения второго приоритета',
      sourceField: 'applicant.programs.second.studyForm',
      fallbackText: 'не указана',
      isSystem: true,
    },
    {
      name: 'количество_программ',
      description: 'Количество выбранных программ',
      sourceField: 'applicant.programs.count',
      fallbackText: '0',
      isSystem: true,
    },
    {
      name: 'балл_русский',
      description: 'Балл ЕГЭ по русскому языку',
      sourceField: 'applicant.exams.Русский язык.score',
      fallbackText: 'нет данных',
      isSystem: true,
    },
    {
      name: 'балл_математика',
      description: 'Балл ЕГЭ по математике',
      sourceField: 'applicant.exams.Математика.score',
      fallbackText: 'нет данных',
      isSystem: true,
    },
    {
      name: 'балл_физика',
      description: 'Балл ЕГЭ/ВИ по физике',
      sourceField: 'applicant.exams.Физика.score',
      fallbackText: 'нет данных',
      isSystem: true,
    },
    {
      name: 'балл_информатика',
      description: 'Балл ЕГЭ/ВИ по информатике',
      sourceField: 'applicant.exams.Информатика и ИКТ.score',
      fallbackText: 'нет данных',
      isSystem: true,
    },
    {
      name: 'балл_общество',
      description: 'Балл ЕГЭ по обществознанию',
      sourceField: 'applicant.exams.Обществознание.score',
      fallbackText: 'нет данных',
      isSystem: true,
    },
  ];

  await prisma.dynamicVariable.createMany({
    data: dynamicVariablesData,
  });

  console.log(`📝 Created ${dynamicVariablesData.length} dynamic variables`);

  // ========== Final Statistics ==========

  const ticketsCount = await prisma.ticket.count();
  const messagesCount = await prisma.ticketMessage.count();
  const accountsCount = await prisma.account.count();
  const variablesCount = await prisma.dynamicVariable.count();

  console.log('\n=================================');
  console.log('✅ Seeding completed successfully!');
  console.log('=================================');

  console.log('\n📊 Database statistics:');
  console.log(`  👥 Accounts: ${accountsCount}`);
  console.log(`  📋 Tickets: ${ticketsCount}`);
  console.log(`  💬 Messages: ${messagesCount}`);
  console.log(`  📝 Dynamic variables: ${variablesCount}`);

  console.log('\n📋 Test accounts:');
  console.log('  👑 Admin:      admin@admin.com / admin');
  console.log('  👔 Supervisor: supervisor@example.com / admin');
  for (let i = 0; i < operators.length; i++) {
    console.log(`  👨‍💼 Operator${i + 1}:  operator${i + 1}@example.com / admin`);
  }
  for (let i = 0; i < Math.min(5, applicants.length); i++) {
    console.log(`  📚 Applicant${i + 1}: ${applicantNames[i].email} / user123`);
  }

  console.log('\n📋 Ticket distribution:');
  console.log(`  🆕 NEW: ${ticketCounter}`);
  console.log(`  🔄 IN_PROGRESS: ${inProgressCount}`);
  console.log(`  ✅ RESOLVED: ${resolvedCount}`);
  console.log(`  🔒 CLOSED: ${closedCount}`);
  console.log(`  ⚠️ ESCALATED: 0`);
  console.log('=================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

// ========== Helper: случайная дата в интервале (период 29 апр – 5 мая 2026) ==========
function randomDate(startDate: Date, endDate: Date): Date {
  const diff = endDate.getTime() - startDate.getTime();
  const randomDiff = Math.random() * diff;
  return new Date(startDate.getTime() + randomDiff);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateScore(): number {
  return randInt(70, 100);
}

// ========== Реальные программы бакалавриата ==========
interface Program {
  id: number;
  code: string;
  name: string;
  studyForm: StudyForm;
  requiredSubjects: string[];
}

const programsList: Program[] = [
  {
    id: 1,
    code: '09.03.01',
    name: 'Информатика и вычислительная техника',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 2,
    code: '09.03.01.01',
    name: 'Разработка программных комплексов (ТОП ИТ)',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 3,
    code: '09.03.02',
    name: 'Информационные системы и технологии',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 4,
    code: '09.03.02.01',
    name: 'Разработка и внедрение корпоративных информационных систем (ТОП ИТ)',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 5,
    code: '09.03.03.01',
    name: 'Прикладная информатика (математическое и компьютерное моделирование)',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 6,
    code: '09.03.03.02',
    name: 'Прикладная информатика (управление данными)',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 7,
    code: '09.03.04',
    name: 'Программная инженерия',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Информатика'],
  },
  {
    id: 8,
    code: '12.03.01',
    name: 'Приборостроение',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Физика', 'Математика'],
  },
  {
    id: 9,
    code: '15.03.01',
    name: 'Машиностроение',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 10,
    code: '15.03.01.01',
    name: 'Многоосевые металлообрабатывающие центры',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 11,
    code: '15.03.02',
    name: 'Технологические машины и оборудование',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 12,
    code: '15.03.04',
    name: 'Автоматизация технологических процессов',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 13,
    code: '15.03.05',
    name: 'Конструкторско-технологическое обеспечение машиностроения',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 14,
    code: '15.03.05.01',
    name: 'Высокопроизводительный металлообрабатывающий инструмент',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 15,
    code: '15.03.06',
    name: 'Мехатроника и робототехника',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 16,
    code: '15.05.01',
    name: 'Проектирование технологических машин',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 17,
    code: '20.03.01',
    name: 'Техносферная безопасность',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 18,
    code: '22.03.01',
    name: 'Материаловедение и технологии материалов',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Химия'],
  },
  {
    id: 19,
    code: '27.03.01',
    name: 'Стандартизация и метрология',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 20,
    code: '27.03.02',
    name: 'Управление качеством',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
  {
    id: 21,
    code: '27.03.04',
    name: 'Управление в технических системах',
    studyForm: StudyForm.FULL_TIME,
    requiredSubjects: ['Русский язык', 'Математика', 'Физика'],
  },
];

// ========== Категории обращений и тексты ==========
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

const supportTexts: Record<AdmissionIntentCategory, string> = {
  [AdmissionIntentCategory.TECHNICAL_ISSUES]:
    'Не могу зайти в личный кабинет, система выдаёт ошибку 500',
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

// Быстрые ответы агентов (для положительного SLA)
const fastAgentResponses = [
  'Здравствуйте! Спасибо за обращение. Вот ответ на ваш вопрос:',
  'Добрый день! Информирую вас:',
  'Здравствуйте! Согласно правилам приёма,',
  'Спасибо за вопрос. Сообщаю, что',
];

// Сложные вопросы для эскалации (длинные, нестандартные)
const complexIssues = [
  'У меня нестандартная ситуация: я закончил школу в другой стране, аттестат пока не прошёл нострификацию. Могу ли я подать документы?',
  'Мой СНИЛС не проходит проверку в системе, хотя данные верны. Говорят, ошибка в базе ПФР. Что делать?',
  'Я победитель всероссийской олимпиады по физике, но мой диплом ещё не загружен в реестр Минобрнауки. Как подтвердить льготу?',
  'У меня есть целевое направление от предприятия, но оно оформлено на другое направление подготовки. Можно ли перезаключить?',
  'Я проходил военную службу, есть ли у меня преимущество при зачислении? Нужно ли предоставлять дополнительные справки?',
  'Мои оригиналы документов были утеряны при пересылке. Восстановление через архив может занять месяц. Что мне делать?',
  'Я хочу поступить одновременно на две программы в рамках одной специальности. Возможно ли это? Как правильно подать заявления?',
];

// ========== Основная функция ==========
async function main() {
  console.log(
    '🌱 Seeding with POSITIVE support metrics, custom templates and integrations...',
  );

  // Очистка
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

  // Хеши паролей
  const hashedPassword = await bcrypt.hash('admin', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);

  // ========== 1. Сотрудники ==========
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

  const operatorNames = [
    { firstName: 'Иван', lastName: 'Петров', middleName: 'Сергеевич' },
    { firstName: 'Анна', lastName: 'Сидорова', middleName: 'Владимировна' },
    { firstName: 'Михаил', lastName: 'Кузнецов', middleName: 'Алексеевич' },
    { firstName: 'Наталья', lastName: 'Орлова', middleName: 'Игоревна' },
    { firstName: 'Павел', lastName: 'Волков', middleName: 'Иванович' },
    { firstName: 'Ольга', lastName: 'Морозова', middleName: 'Дмитриевна' },
  ];
  const operators: Awaited<ReturnType<typeof prisma.account.create>>[] = [];
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

  // ========== 2. Абитуриенты (30 человек) ==========
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
      lastName: 'Сотникова',
      middleName: 'Петровна',
      email: 'anna.sotnikova@example.com',
    },
    {
      firstName: 'Иван',
      lastName: 'Смирнов',
      middleName: 'Алексеевич',
      email: 'ivan.smirnov@example.com',
    },
    {
      firstName: 'Виктория',
      lastName: 'Фёдорова',
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
      firstName: 'Любовь',
      lastName: 'Орлова',
      middleName: 'Максимовна',
      email: 'lubov.orlova@example.com',
    },
    {
      firstName: 'Михаил',
      lastName: 'Гордеев',
      middleName: 'Юрьевич',
      email: 'mikhail.gordeev@example.com',
    },
    {
      firstName: 'Татьяна',
      lastName: 'Никитина',
      middleName: 'Сергеевна',
      email: 'tatiana.nikitina@example.com',
    },
    {
      firstName: 'Артём',
      lastName: 'Кузнецов',
      middleName: 'Андреевич',
      email: 'artem.kuznetsov@example.com',
    },
    {
      firstName: 'Екатерина',
      lastName: 'Васильева',
      middleName: 'Игоревна',
      email: 'ekaterina.vasilyeva@example.com',
    },
    {
      firstName: 'Денис',
      lastName: 'Павлов',
      middleName: 'Романович',
      email: 'denis.pavlov@example.com',
    },
    {
      firstName: 'Анастасия',
      lastName: 'Семёнова',
      middleName: 'Алексеевна',
      email: 'anastasia.semenova@example.com',
    },
    {
      firstName: 'Владислав',
      lastName: 'Егоров',
      middleName: 'Дмитриевич',
      email: 'vladislav.egorov@example.com',
    },
    {
      firstName: 'Юлия',
      lastName: 'Михайлова',
      middleName: 'Владимировна',
      email: 'yulia.mikhailova@example.com',
    },
    {
      firstName: 'Григорий',
      lastName: 'Тарасов',
      middleName: 'Иванович',
      email: 'grigory.tarasov@example.com',
    },
    {
      firstName: 'Дарья',
      lastName: 'Белова',
      middleName: 'Павловна',
      email: 'daria.belova@example.com',
    },
    {
      firstName: 'Никита',
      lastName: 'Комаров',
      middleName: 'Александрович',
      email: 'nikita.komarov@example.com',
    },
    {
      firstName: 'Полина',
      lastName: 'Крылова',
      middleName: 'Максимовна',
      email: 'polina.krylova@example.com',
    },
    {
      firstName: 'Максим',
      lastName: 'Гусев',
      middleName: 'Сергеевич',
      email: 'maxim.gusev@example.com',
    },
    {
      firstName: 'Арина',
      lastName: 'Зайцева',
      middleName: 'Денисовна',
      email: 'arina.zaytseva@example.com',
    },
    {
      firstName: 'Роман',
      lastName: 'Виноградов',
      middleName: 'Петрович',
      email: 'roman.vinogradov@example.com',
    },
    {
      firstName: 'Ксения',
      lastName: 'Борисова',
      middleName: 'Андреевна',
      email: 'ksenia.borisova@example.com',
    },
  ];

  const applicants: Awaited<ReturnType<typeof prisma.account.create>>[] = [];
  const startCampaign = new Date(2026, 3, 29); // 29 апреля 2026
  const endCampaign = new Date(2026, 4, 5); // 5 мая 2026

  for (const nameData of applicantNames) {
    const account = await prisma.account.create({
      data: {
        id: uuidv4(),
        email: nameData.email,
        firstName: nameData.firstName,
        lastName: nameData.lastName,
        middleName: nameData.middleName,
        role: 'APPLICANT',
        authProvider: 'INTERNAL',
        status: 'ACTIVE',
        passwordHash: hashedUserPassword,
      },
    });

    const snils = `${randInt(10000000000, 99999999999)}`;
    await prisma.applicant.create({
      data: {
        id: account.id,
        snils,
        hasBvi: Math.random() < 0.05,
        hasSpecialQuota: Math.random() < 0.1,
        hasSeparateQuota: Math.random() < 0.08,
        hasTargetQuota: Math.random() < 0.12,
        hasPriorityRight: Math.random() < 0.1,
        originalDocumentReceived: Math.random() < 0.85,
        originalDocumentReceivedAt:
          Math.random() < 0.85 ? randomDate(startCampaign, endCampaign) : null,
      },
    });

    // Выбор 1-3 программ и генерация баллов
    const programCount = randInt(1, 3);
    const shuffled = [...programsList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, programCount);
    const requiredSubjectsSet = new Set<string>();
    for (const prog of selected) {
      prog.requiredSubjects.forEach((s) => requiredSubjectsSet.add(s));
    }
    if (!requiredSubjectsSet.has('Русский язык'))
      requiredSubjectsSet.add('Русский язык');
    if (!requiredSubjectsSet.has('Математика'))
      requiredSubjectsSet.add('Математика');
    const examScoresData = Array.from(requiredSubjectsSet).map((sub) => ({
      applicantId: account.id,
      subjectName: sub,
      score: generateScore(),
      type: ExamType.EGE,
    }));
    await prisma.examScore.createMany({ data: examScoresData });

    for (let idx = 0; idx < selected.length; idx++) {
      const prog = selected[idx];
      let admissionType: AdmissionType = AdmissionType.BUDGET_COMPETITIVE;
      if (prog.id % 3 === 0) admissionType = AdmissionType.PAID;
      else if (prog.id % 5 === 0) admissionType = AdmissionType.TARGET;
      else if (prog.id % 7 === 0)
        admissionType = AdmissionType.BUDGET_SPECIAL_QUOTA;

      await prisma.applicantProgram.create({
        data: {
          applicantId: account.id,
          programId: prog.id,
          programCode: prog.code,
          programName: prog.name,
          studyForm: prog.studyForm,
          admissionType,
          priority: idx + 1,
        },
      });
    }
    applicants.push(account);
  }
  console.log(
    `📚 Created ${applicants.length} applicants with exam scores and program applications`,
  );

  // ========== 3. Тикеты с положительной статистикой ==========
  // Распределение: NEW (5%), IN_PROGRESS (15%), RESOLVED (40%), CLOSED (35%), ESCALATED (5%)
  // Всего ~100 тикетов, чтобы недельная статистика была ~75-80 – сделаем 95 тикетов.
  const distribution = [
    {
      status: TicketStatus.NEW,
      count: 5,
      hasAgent: false,
      hasResolution: false,
      hasClose: false,
      escalation: false,
    },
    {
      status: TicketStatus.IN_PROGRESS,
      count: 14,
      hasAgent: true,
      hasResolution: false,
      hasClose: false,
      escalation: false,
    },
    {
      status: TicketStatus.RESOLVED,
      count: 38,
      hasAgent: true,
      hasResolution: true,
      hasClose: false,
      escalation: false,
    },
    {
      status: TicketStatus.CLOSED,
      count: 33,
      hasAgent: true,
      hasResolution: true,
      hasClose: true,
      escalation: false,
    },
    {
      status: TicketStatus.ESCALATED,
      count: 5,
      hasAgent: true,
      hasResolution: true,
      hasClose: false,
      escalation: true,
    },
  ];

  let totalTickets = 0;
  for (const dist of distribution) {
    for (let i = 0; i < dist.count; i++) {
      const applicant =
        applicants[Math.floor(Math.random() * applicants.length)];
      // Для эскалированных используем сложные вопросы
      const isEscalated = dist.escalation;
      const intent = intents[Math.floor(Math.random() * intents.length)];
      const createdAt = randomDate(startCampaign, endCampaign);
      let assignedAt: Date | null = null;
      let firstReplyAt: Date | null = null;
      let resolvedAt: Date | null = null;
      let closedAt: Date | null = null;
      let lastMessageAt: Date | null = createdAt;
      let agentId: string | null = null;

      if (dist.hasAgent) {
        agentId = operators[Math.floor(Math.random() * operators.length)].id;
        // Назначение сразу, через 0-2 минуты
        assignedAt = new Date(createdAt.getTime() + randInt(0, 2) * 60 * 1000);
        // Первый ответ: от 1 до 12 минут (но для эскалации может быть чуть дольше, до 20)
        const replyDelay = isEscalated ? randInt(2, 20) : randInt(1, 10);
        firstReplyAt = new Date(assignedAt.getTime() + replyDelay * 60 * 1000);
      }
      if (dist.hasResolution) {
        const resolveDelay = isEscalated ? randInt(30, 90) : randInt(5, 35); // минуты
        resolvedAt = new Date(
          (firstReplyAt || assignedAt || createdAt).getTime() +
            resolveDelay * 60 * 1000,
        );
        lastMessageAt = resolvedAt;
      }
      if (dist.hasClose) {
        closedAt = new Date(
          (resolvedAt || createdAt).getTime() + randInt(2, 20) * 60 * 1000,
        );
        lastMessageAt = closedAt;
      }

      const ticket = await prisma.ticket.create({
        data: {
          id: uuidv4(),
          applicantId: applicant.id,
          agentId,
          status: dist.status,
          priority: isEscalated ? randInt(8, 10) : randInt(1, 7),
          intent,
          noteText:
            isEscalated && Math.random() < 0.7
              ? complexIssues[Math.floor(Math.random() * complexIssues.length)]
              : supportTexts[intent],
          assignedAt,
          firstReplyAt,
          resolvedAt,
          closedAt,
          createdAt,
          updatedAt: lastMessageAt,
          lastMessageAt,
          satisfactionScore:
            dist.status === TicketStatus.RESOLVED ||
            dist.status === TicketStatus.CLOSED
              ? isEscalated
                ? [SatisfactionScore.GOOD, SatisfactionScore.EXCELLENT][
                    randInt(0, 1)
                  ]
                : [
                    SatisfactionScore.GOOD,
                    SatisfactionScore.EXCELLENT,
                    SatisfactionScore.EXCELLENT,
                  ][randInt(0, 2)]
              : undefined,
        },
      });

      // Сообщение от абитуриента
      const customerMsgContent =
        isEscalated && Math.random() < 0.8
          ? complexIssues[Math.floor(Math.random() * complexIssues.length)]
          : supportTexts[intent];
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: applicant.id,
          authorType: 'FROM_CUSTOMER',
          content: customerMsgContent,
          status: 'SENT',
          createdAt: new Date(createdAt.getTime() + randInt(0, 5) * 60 * 1000),
        },
      });

      // Ответ агента, если есть
      if (agentId && firstReplyAt) {
        const responseText = isEscalated
          ? 'Здравствуйте! Ваш вопрос требует дополнительной проверки. Я передал его старшему специалисту. Ожидайте ответ в течение часа. Спасибо за понимание.'
          : fastAgentResponses[randInt(0, fastAgentResponses.length - 1)] +
            ' ' +
            (Math.random() > 0.5
              ? 'Вы можете отслеживать статус в личном кабинете.'
              : 'Если остались вопросы, пишите.');
        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            authorId: agentId,
            authorType: 'FROM_AGENT',
            content: responseText,
            status: 'DELIVERED',
            deliveredAt: firstReplyAt,
            seenAt: firstReplyAt,
            createdAt: firstReplyAt,
          },
        });
      }

      // Если эскалация, добавим запись в EscalationTicketAudit
      if (isEscalated && agentId) {
        const supervisorId = supervisor.id;
        await prisma.escalationTicketAudit.create({
          data: {
            ticketId: ticket.id,
            fromAgentId: agentId,
            toAgentId: supervisorId,
            cause: 'COMPLEX_ISSUE',
            causeComment:
              'Требуется дополнительная проверка документов или взаимодействие с другими отделами',
            escalatedAt:
              firstReplyAt || new Date(createdAt.getTime() + 5 * 60 * 1000),
            acceptedAt: new Date(
              (firstReplyAt || createdAt).getTime() +
                randInt(5, 30) * 60 * 1000,
            ),
          },
        });
      }

      totalTickets++;
    }
    console.log(
      `  ✅ Created ${dist.count} ${dist.status} tickets (positive SLA)`,
    );
  }
  console.log(`🎫 Total tickets created: ${totalTickets}`);

  // ========== 4. Динамические переменные (только три: фио, фи, почта) ==========
  const dynamicVariables = [
    {
      name: 'фио',
      description: 'Полное ФИО абитуриента',
      sourceField: 'account.fullName',
      fallbackText: 'Уважаемый абитуриент',
      isSystem: true,
    },
    {
      name: 'фи',
      description: 'Фамилия и имя абитуриента',
      sourceField: 'account.firstName', // источник будет комбинироваться через шаблон, но для простоты храним firstName
      fallbackText: 'Абитуриент',
      isSystem: true,
    },
    {
      name: 'почта',
      description: 'Email абитуриента',
      sourceField: 'account.email',
      fallbackText: 'email не указан',
      isSystem: true,
    },
  ];
  await prisma.dynamicVariable.createMany({ data: dynamicVariables });
  console.log(
    `📝 Created ${dynamicVariables.length} dynamic variables (фио, фи, почта)`,
  );

  // ========== 5. Шаблоны с переменными и примерами (вуз, адрес, бухгалтерия) ==========
  const templatesData = [
    {
      alias: 'welcome_general',
      title: 'Приветствие с информацией о вузе',
      category: AdmissionIntentCategory.GENERAL_INFO,
      content: {
        text: `Здравствуйте, {{фио}}! Вы обратились в **МГТУ «СТАНКИН»** (Московский государственный технологический университет «СТАНКИН»). Наш адрес: **Вадковский пер., 1, Москва, 127055**. Рады видеть вас среди абитуриентов!`,
      },
      isActive: true,
      createdBy: admin.id,
    },
    {
      alias: 'payment_contacts',
      title: 'Контакты бухгалтерии',
      category: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
      content: {
        text: `{{фио}}, по вопросам оплаты обучения обращайтесь в финансовый отдел МГТУ «СТАНКИН». Контакты: **Иванова Екатерина Дмитриевна**, главный бухгалтер. Телефон: **+7 (495) 123-45-67** (доб. 112). Время работы: пн–чт 09:00–18:00, пт 09:00–16:45, перерыв 13:00–13:45. Email: buh@stankin.ru.`,
      },
      isActive: true,
      createdBy: admin.id,
    },
    {
      alias: 'dormitory_info',
      title: 'Информация об общежитии',
      category: AdmissionIntentCategory.DORMITORY_HOUSING,
      content: {
        text: `Уважаемый {{фио}}, общежитие МГТУ «СТАНКИН» находится по адресу: ул. Прянишникова, 2А. Для заселения необходимо предоставить справку о состоянии здоровья и копию паспорта.`,
      },
      isActive: true,
      createdBy: admin.id,
    },
    {
      alias: 'exam_schedule',
      title: 'Расписание вступительных испытаний',
      category: AdmissionIntentCategory.STUDIES_SCHEDULE,
      content: {
        text: `{{фи}}, расписание экзаменов опубликовано на сайте → stankin.ru/abiturient. Ваши баллы: русский – {{балл_русский}}, математика – {{балл_математика}}.`,
      },
      isActive: true,
      createdBy: admin.id,
    },
  ];
  await prisma.template.createMany({ data: templatesData });
  console.log(
    `📄 Created ${templatesData.length} templates with variables and custom examples`,
  );

  // ========== 6. Интеграции и уведомления (без Telegram, только обновление списков и сбой оплаты) ==========
  const integrationListUpdate = await prisma.integration.create({
    data: {
      slug: 'list-update-event',
      name: 'Внешнее событие: обновление списков поступающих',
      eventType: 'INFORMATIONAL',
      theme: 'light',
      source: 'https://api.stankin.ru/webhook/list-update',
      content: {
        message: 'Списки поступающих обновлены. Проверьте свои позиции.',
        channel: 'internal',
      },
      isTypeEditable: false,
      isThemeEditable: true,
      isSourceEditable: false,
      isContentEditable: true,
      createdBy: admin.id,
    },
  });

  const integrationPaymentFailure = await prisma.integration.create({
    data: {
      slug: 'payment-failure-alert',
      name: 'Сбой оплаты при заключении договора',
      eventType: 'FAILURE',
      theme: 'dark',
      source: 'https://api.stankin.ru/webhook/payment-failure',
      content: {
        alert: 'Не удалось провести оплату. Ошибка шлюза.',
        severity: 'high',
      },
      isTypeEditable: false,
      isThemeEditable: false,
      isSourceEditable: false,
      isContentEditable: true,
      createdBy: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        integrationId: integrationListUpdate.id,
        payload: {
          eventType: 'INFORMATIONAL',
          message:
            'Списки рекомендованных к зачислению на бюджет обновлены 05.05.2026 в 15:00',
          timestamp: new Date().toISOString(),
        },
        status: 'SENT',
        sentAt: new Date(),
      },
      {
        integrationId: integrationListUpdate.id,
        payload: {
          eventType: 'INFORMATIONAL',
          message:
            'Дополнительный список поступающих по целевой квоте опубликован',
        },
        status: 'PENDING',
      },
      {
        integrationId: integrationPaymentFailure.id,
        payload: {
          eventType: 'FAILURE',
          error: 'Таймаут соединения с платежным шлюзом',
          orderId: 'ORDER-12345',
        },
        status: 'FAILED',
        error: 'Payment gateway timeout after 30s',
      },
      {
        integrationId: integrationPaymentFailure.id,
        payload: {
          eventType: 'FAILURE',
          error: 'Неверный формат ответа от банка',
          retryCount: 3,
        },
        status: 'SENT',
        sentAt: new Date(Date.now() - 1000 * 60 * 120),
      },
    ],
  });

  console.log(
    '🔗 Created 2 integrations (list-update, payment-failure) with notifications (no Telegram)',
  );

  // ========== 7. Итоговая статистика ==========
  const accountsCount = await prisma.account.count();
  const ticketsCount = await prisma.ticket.count();
  const messagesCount = await prisma.ticketMessage.count();
  const variablesCount = await prisma.dynamicVariable.count();
  const templatesCount = await prisma.template.count();

  // Быстрый расчёт среднего времени первого ответа для отладки (можно удалить)
  const ticketsWithFirstReply = await prisma.ticket.findMany({
    where: { firstReplyAt: { not: null }, createdAt: { not: null } },
    select: { createdAt: true, firstReplyAt: true },
  });
  let totalMinutes = 0;
  for (const t of ticketsWithFirstReply) {
    const diff = (t.firstReplyAt!.getTime() - t.createdAt!.getTime()) / 60000;
    totalMinutes += diff;
  }
  const avgFirstReplyMinutes = ticketsWithFirstReply.length
    ? (totalMinutes / ticketsWithFirstReply.length).toFixed(1)
    : 0;

  console.log('\n=================================');
  console.log('✅ Seeding completed successfully!');
  console.log('=================================');
  console.log(`📊 Database statistics:`);
  console.log(`  👥 Accounts: ${accountsCount}`);
  console.log(`  🎫 Tickets: ${ticketsCount}`);
  console.log(`  💬 Messages: ${messagesCount}`);
  console.log(`  📝 Dynamic variables: ${variablesCount} (фио, фи, почта)`);
  console.log(`  📄 Templates: ${templatesCount}`);
  console.log(
    `\n⏱️ Average first reply time: ~${avgFirstReplyMinutes} minutes (target <12 min) ✅`,
  );

  console.log('\n📋 Test accounts:');
  console.log('  👑 Admin:      admin@admin.com / admin');
  console.log('  👔 Supervisor: supervisor@example.com / admin');
  operators.forEach((op, idx) =>
    console.log(`  👨‍💼 Operator${idx + 1}:  ${op.email} / admin`),
  );
  applicants
    .slice(0, 5)
    .forEach((app, idx) =>
      console.log(`  📚 Applicant${idx + 1}: ${app.email} / user123`),
    );

  console.log('\n📊 Ticket distribution (positive SLA):');
  const statusCounts = await prisma.ticket.groupBy({
    by: ['status'],
    _count: true,
  });
  for (const sc of statusCounts) {
    console.log(`  ${sc.status}: ${sc._count}`);
  }
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

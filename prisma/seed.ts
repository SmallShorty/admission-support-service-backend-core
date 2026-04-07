// prisma/seed.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  TicketStatus,
  AdmissionIntentCategory,
  EscalationCause,
} from 'generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // Очистка существующих данных (в правильном порядке из-за внешних ключей)
  console.log('🧹 Cleaning existing data...');
  await prisma.ticketMessage.deleteMany();
  await prisma.escalationTicketAudit.deleteMany();
  await prisma.userConnection.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.applicantProgram.deleteMany();
  await prisma.examScore.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.account.deleteMany();

  console.log('✅ Cleaned existing data');

  // Хеширование паролей
  const hashedPassword = await bcrypt.hash('admin', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);

  // ========== Создание пользователей ==========

  // 1. Администратор
  const admin = await prisma.account.create({
    data: {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'admin@admin.com',
      firstName: 'Админ',
      lastName: 'Администраторов',
      middleName: 'Системович',
      role: 'ADMIN',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });
  console.log('👑 Created admin:', admin.email);

  // 2. Супервайзер (старший оператор)
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

  // 3. Операторы
  const operator1 = await prisma.account.create({
    data: {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'operator1@example.com',
      firstName: 'Иван',
      lastName: 'Петров',
      middleName: 'Сергеевич',
      role: 'OPERATOR',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });

  const operator2 = await prisma.account.create({
    data: {
      id: '44444444-4444-4444-8444-444444444444',
      email: 'operator2@example.com',
      firstName: 'Анна',
      lastName: 'Сидорова',
      middleName: 'Владимировна',
      role: 'OPERATOR',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });

  const operator3 = await prisma.account.create({
    data: {
      id: '88888888-8888-4888-8888-888888888888',
      email: 'operator3@example.com',
      firstName: 'Михаил',
      lastName: 'Кузнецов',
      middleName: 'Алексеевич',
      role: 'OPERATOR',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedPassword,
    },
  });

  console.log('👨‍💼 Created 3 operators');

  // 4. Абитуриенты (заявители) с расширенными данными
  const applicant1Account = await prisma.account.create({
    data: {
      id: '55555555-5555-4555-8555-555555555555',
      email: 'ivanov.alexey@example.com',
      firstName: 'Алексей',
      lastName: 'Иванов',
      middleName: 'Дмитриевич',
      role: 'APPLICANT',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedUserPassword,
    },
  });

  // Создаем Applicant профиль
  await prisma.applicant.create({
    data: {
      id: applicant1Account.id,
      snils: '12345678901',
      hasBvi: false,
      hasSpecialQuota: false,
      hasSeparateQuota: false,
      hasTargetQuota: false,
      hasPriorityRight: false,
      originalDocumentReceived: true,
      originalDocumentReceivedAt: new Date('2025-01-10T10:00:00Z'),
    },
  });

  const applicant2Account = await prisma.account.create({
    data: {
      id: '66666666-6666-4666-8666-666666666666',
      email: 'petrova.maria@example.com',
      firstName: 'Мария',
      lastName: 'Петрова',
      middleName: 'Андреевна',
      role: 'APPLICANT',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedUserPassword,
    },
  });

  await prisma.applicant.create({
    data: {
      id: applicant2Account.id,
      snils: '98765432101',
      hasBvi: false,
      hasSpecialQuota: true,
      hasSeparateQuota: false,
      hasTargetQuota: false,
      hasPriorityRight: false,
      originalDocumentReceived: false,
    },
  });

  const applicant3Account = await prisma.account.create({
    data: {
      id: '77777777-7777-4777-8777-777777777777',
      email: 'sokolov.dmitry@example.com',
      firstName: 'Дмитрий',
      lastName: 'Соколов',
      middleName: 'Павлович',
      role: 'APPLICANT',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedUserPassword,
    },
  });

  await prisma.applicant.create({
    data: {
      id: applicant3Account.id,
      snils: '55555555555',
      hasBvi: true,
      hasSpecialQuota: false,
      hasSeparateQuota: false,
      hasTargetQuota: false,
      hasPriorityRight: true,
      originalDocumentReceived: true,
      originalDocumentReceivedAt: new Date('2025-01-12T14:30:00Z'),
    },
  });

  const applicant4Account = await prisma.account.create({
    data: {
      id: '99999999-9999-4999-9999-999999999999',
      email: 'kozlova.olga@example.com',
      firstName: 'Ольга',
      lastName: 'Козлова',
      middleName: 'Игоревна',
      role: 'APPLICANT',
      authProvider: 'INTERNAL',
      status: 'ACTIVE',
      passwordHash: hashedUserPassword,
    },
  });

  await prisma.applicant.create({
    data: {
      id: applicant4Account.id,
      snils: '44444444444',
      hasBvi: false,
      hasSpecialQuota: false,
      hasSeparateQuota: false,
      hasTargetQuota: true,
      hasPriorityRight: false,
      originalDocumentReceived: false,
    },
  });

  console.log('📚 Created 4 applicants with profiles');

  // ========== Создание экзаменационных баллов ==========

  const examScoresData = [
    // Алексей Иванов
    {
      applicantId: applicant1Account.id,
      subjectName: 'Русский язык',
      score: 85,
      type: 'EGE',
    },
    {
      applicantId: applicant1Account.id,
      subjectName: 'Математика',
      score: 92,
      type: 'EGE',
    },
    {
      applicantId: applicant1Account.id,
      subjectName: 'Физика',
      score: 88,
      type: 'EGE',
    },
    {
      applicantId: applicant1Account.id,
      subjectName: 'Информатика',
      score: 78,
      type: 'INTERNAL',
    },

    // Мария Петрова
    {
      applicantId: applicant2Account.id,
      subjectName: 'Русский язык',
      score: 94,
      type: 'EGE',
    },
    {
      applicantId: applicant2Account.id,
      subjectName: 'Математика',
      score: 88,
      type: 'EGE',
    },
    {
      applicantId: applicant2Account.id,
      subjectName: 'Обществознание',
      score: 96,
      type: 'EGE',
    },
    {
      applicantId: applicant2Account.id,
      subjectName: 'Английский язык',
      score: 82,
      type: 'EGE',
    },

    // Дмитрий Соколов
    {
      applicantId: applicant3Account.id,
      subjectName: 'Русский язык',
      score: 76,
      type: 'EGE',
    },
    {
      applicantId: applicant3Account.id,
      subjectName: 'Математика',
      score: 84,
      type: 'EGE',
    },
    {
      applicantId: applicant3Account.id,
      subjectName: 'Физика',
      score: 79,
      type: 'INTERNAL',
    },

    // Ольга Козлова
    {
      applicantId: applicant4Account.id,
      subjectName: 'Русский язык',
      score: 91,
      type: 'EGE',
    },
    {
      applicantId: applicant4Account.id,
      subjectName: 'Математика',
      score: 87,
      type: 'EGE',
    },
    {
      applicantId: applicant4Account.id,
      subjectName: 'Биология',
      score: 93,
      type: 'EGE',
    },
    {
      applicantId: applicant4Account.id,
      subjectName: 'Химия',
      score: 89,
      type: 'INTERNAL',
    },
  ];

  for (const score of examScoresData) {
    await prisma.examScore.create({ data: score });
  }

  console.log('📊 Created exam scores');

  // ========== Создание программ абитуриентов ==========

  const applicantProgramsData = [
    // Алексей Иванов
    {
      applicantId: applicant1Account.id,
      programId: 101,
      programCode: '01.03.02',
      studyForm: 'FULL_TIME',
      admissionType: 'BUDGET_COMPETITIVE',
      priority: 1,
    },
    {
      applicantId: applicant1Account.id,
      programId: 102,
      programCode: '02.03.03',
      studyForm: 'FULL_TIME',
      admissionType: 'PAID',
      priority: 2,
    },

    // Мария Петрова
    {
      applicantId: applicant2Account.id,
      programId: 201,
      programCode: '38.03.01',
      studyForm: 'FULL_TIME',
      admissionType: 'BUDGET_SPECIAL_QUOTA',
      priority: 1,
    },
    {
      applicantId: applicant2Account.id,
      programId: 202,
      programCode: '38.03.02',
      studyForm: 'PART_TIME',
      admissionType: 'PAID',
      priority: 2,
    },

    // Дмитрий Соколов
    {
      applicantId: applicant3Account.id,
      programId: 301,
      programCode: '09.03.01',
      studyForm: 'FULL_TIME',
      admissionType: 'BUDGET_BVI',
      priority: 1,
    },
    {
      applicantId: applicant3Account.id,
      programId: 302,
      programCode: '09.03.04',
      studyForm: 'FULL_TIME',
      admissionType: 'BUDGET_COMPETITIVE',
      priority: 2,
    },

    // Ольга Козлова
    {
      applicantId: applicant4Account.id,
      programId: 401,
      programCode: '31.05.01',
      studyForm: 'FULL_TIME',
      admissionType: 'TARGET',
      priority: 1,
    },
  ];

  for (const program of applicantProgramsData) {
    await prisma.applicantProgram.create({ data: program });
  }

  console.log('🎓 Created applicant programs');

  // ========== Создание тикетов с lastMessageAt ==========

  // 1. NEW - тикеты в очереди (доступны для взятия)
  const newTicket1 = await prisma.ticket.create({
    data: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      applicantId: applicant1Account.id,
      agentId: null,
      status: TicketStatus.NEW,
      priority: 10,
      intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
      noteText:
        'Не могу загрузить скан паспорта. Система выдает ошибку "Файл поврежден"',
      createdAt: new Date('2025-01-15T10:30:00Z'),
      updatedAt: new Date('2025-01-15T10:30:00Z'),
      lastMessageAt: new Date('2025-01-15T10:30:00Z'),
    },
  });

  const newTicket2 = await prisma.ticket.create({
    data: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      applicantId: applicant2Account.id,
      agentId: null,
      status: TicketStatus.NEW,
      priority: 8,
      intent: AdmissionIntentCategory.STATUS_VERIFICATION,
      noteText: 'Когда появятся результаты вступительных испытаний?',
      createdAt: new Date('2025-01-15T09:15:00Z'),
      updatedAt: new Date('2025-01-15T09:15:00Z'),
      lastMessageAt: new Date('2025-01-15T09:15:00Z'),
    },
  });

  const newTicket3 = await prisma.ticket.create({
    data: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      applicantId: applicant3Account.id,
      agentId: null,
      status: TicketStatus.NEW,
      priority: 7,
      intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
      noteText: 'Не приходит письмо для подтверждения email',
      createdAt: new Date('2025-01-14T14:20:00Z'),
      updatedAt: new Date('2025-01-14T14:20:00Z'),
      lastMessageAt: new Date('2025-01-14T14:20:00Z'),
    },
  });

  const newTicket4 = await prisma.ticket.create({
    data: {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      applicantId: applicant4Account.id,
      agentId: null,
      status: TicketStatus.NEW,
      priority: 9,
      intent: AdmissionIntentCategory.PROGRAM_CONSULTATION,
      noteText: 'Хочу уточнить информацию о целевом обучении',
      createdAt: new Date('2025-01-15T08:00:00Z'),
      updatedAt: new Date('2025-01-15T08:00:00Z'),
      lastMessageAt: new Date('2025-01-15T08:00:00Z'),
    },
  });

  console.log('📋 Created 4 NEW tickets');

  // 2. IN_PROGRESS - тикеты в работе у операторов
  const inProgressTicket1 = await prisma.ticket.create({
    data: {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      applicantId: applicant1Account.id,
      agentId: operator1.id,
      status: TicketStatus.IN_PROGRESS,
      priority: 9,
      intent: AdmissionIntentCategory.ENROLLMENT,
      noteText: 'Вопрос по срокам зачисления',
      assignedAt: new Date('2025-01-14T10:00:00Z'),
      createdAt: new Date('2025-01-14T09:00:00Z'),
      updatedAt: new Date('2025-01-14T11:15:00Z'),
      lastMessageAt: new Date('2025-01-14T11:15:00Z'),
    },
  });

  const inProgressTicket2 = await prisma.ticket.create({
    data: {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      applicantId: applicant2Account.id,
      agentId: operator2.id,
      status: TicketStatus.IN_PROGRESS,
      priority: 6,
      intent: AdmissionIntentCategory.PAYMENTS_CONTRACTS,
      noteText: 'Проблема с оплатой обучения',
      assignedAt: new Date('2025-01-13T15:30:00Z'),
      createdAt: new Date('2025-01-13T14:00:00Z'),
      updatedAt: new Date('2025-01-14T16:45:00Z'),
      lastMessageAt: new Date('2025-01-14T16:45:00Z'),
    },
  });

  const inProgressTicket3 = await prisma.ticket.create({
    data: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      applicantId: applicant3Account.id,
      agentId: operator3.id,
      status: TicketStatus.IN_PROGRESS,
      priority: 7,
      intent: AdmissionIntentCategory.DORMITORY_HOUSING,
      noteText: 'Вопрос о предоставлении общежития',
      assignedAt: new Date('2025-01-14T13:00:00Z'),
      createdAt: new Date('2025-01-14T11:00:00Z'),
      updatedAt: new Date('2025-01-15T09:30:00Z'),
      lastMessageAt: new Date('2025-01-15T09:30:00Z'),
    },
  });

  console.log('🔄 Created 3 IN_PROGRESS tickets');

  // 3. ESCALATED - эскалированные тикеты
  const escalatedTicket = await prisma.ticket.create({
    data: {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      applicantId: applicant3Account.id,
      agentId: supervisor.id,
      status: TicketStatus.ESCALATED,
      priority: 10,
      intent: AdmissionIntentCategory.TECHNICAL_ISSUES,
      noteText: 'Серьезная техническая проблема с системой загрузки документов',
      assignedAt: new Date('2025-01-12T11:00:00Z'),
      createdAt: new Date('2025-01-12T10:00:00Z'),
      updatedAt: new Date('2025-01-12T11:30:00Z'),
      lastMessageAt: new Date('2025-01-12T11:30:00Z'),
    },
  });

  console.log('⚠️ Created 1 ESCALATED ticket');

  // 4. RESOLVED - решенные тикеты
  const resolvedTicket = await prisma.ticket.create({
    data: {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      applicantId: applicant1Account.id,
      agentId: operator1.id,
      status: TicketStatus.RESOLVED,
      priority: 5,
      intent: AdmissionIntentCategory.GENERAL_INFO,
      noteText: 'Вопрос по расписанию вступительных испытаний',
      assignedAt: new Date('2025-01-10T09:00:00Z'),
      resolvedAt: new Date('2025-01-10T16:00:00Z'),
      createdAt: new Date('2025-01-10T08:00:00Z'),
      updatedAt: new Date('2025-01-10T16:00:00Z'),
      lastMessageAt: new Date('2025-01-10T15:30:00Z'),
    },
  });

  console.log('✅ Created 1 RESOLVED ticket');

  // 5. CLOSED - закрытые тикеты
  const closedTicket = await prisma.ticket.create({
    data: {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
      applicantId: applicant2Account.id,
      agentId: operator2.id,
      status: TicketStatus.CLOSED,
      priority: 4,
      intent: AdmissionIntentCategory.DOCUMENT_SUBMISSION,
      noteText: 'Помощь с загрузкой документов',
      assignedAt: new Date('2025-01-09T10:00:00Z'),
      resolvedAt: new Date('2025-01-09T14:00:00Z'),
      closedAt: new Date('2025-01-09T15:00:00Z'),
      createdAt: new Date('2025-01-09T09:00:00Z'),
      updatedAt: new Date('2025-01-09T15:00:00Z'),
      lastMessageAt: new Date('2025-01-09T13:45:00Z'),
    },
  });

  console.log('🔒 Created 1 CLOSED ticket');

  // 6. AWAITING_FEEDBACK - ожидают обратной связи
  const awaitingFeedbackTicket = await prisma.ticket.create({
    data: {
      id: 'e5f6a7b8-c9d4-4e0f-1a2b-3c4d5e6f7a8b',
      applicantId: applicant4Account.id,
      agentId: operator3.id,
      status: TicketStatus.AWAITING_FEEDBACK,
      priority: 6,
      intent: AdmissionIntentCategory.SCORES_COMPETITION,
      noteText: 'Нужна консультация по проходным баллам',
      assignedAt: new Date('2025-01-13T12:00:00Z'),
      createdAt: new Date('2025-01-13T10:00:00Z'),
      updatedAt: new Date('2025-01-14T15:00:00Z'),
      lastMessageAt: new Date('2025-01-14T15:00:00Z'),
    },
  });

  console.log('💬 Created 1 AWAITING_FEEDBACK ticket');

  // ========== Создание сообщений для IN_PROGRESS тикета 1 ==========

  // Сообщение от абитуриента
  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket1.id,
      authorId: applicant1Account.id,
      authorType: 'FROM_CUSTOMER',
      content:
        'Здравствуйте! Я подал документы 10 января, но до сих пор нет информации о зачислении. Когда можно ожидать результаты?',
      status: 'SENT',
      createdAt: new Date('2025-01-14T09:00:00Z'),
    },
  });

  // Ответ от оператора
  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket1.id,
      authorId: operator1.id,
      authorType: 'FROM_AGENT',
      content:
        'Добрый день! Рассмотрение документов занимает до 10 рабочих дней. О результатах мы уведомим вас по email. Ориентировочно до 25 января.',
      status: 'DELIVERED',
      deliveredAt: new Date('2025-01-14T10:30:00Z'),
      createdAt: new Date('2025-01-14T10:30:00Z'),
    },
  });

  // Дополнительный вопрос
  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket1.id,
      authorId: applicant1Account.id,
      authorType: 'FROM_CUSTOMER',
      content:
        'Спасибо за ответ. А где именно смотреть результаты? В личном кабинете или придет отдельное письмо?',
      status: 'SENT',
      createdAt: new Date('2025-01-14T11:00:00Z'),
    },
  });

  // Ответ оператора
  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket1.id,
      authorId: operator1.id,
      authorType: 'FROM_AGENT',
      content:
        'Результаты появятся в вашем личном кабинете в разделе "Статус абитуриента". Также мы продублируем информацию на email.',
      status: 'SEEN',
      deliveredAt: new Date('2025-01-14T11:15:00Z'),
      seenAt: new Date('2025-01-14T11:20:00Z'),
      createdAt: new Date('2025-01-14T11:15:00Z'),
    },
  });

  console.log('💬 Created messages for IN_PROGRESS ticket 1');

  // ========== Создание сообщений для IN_PROGRESS тикета 2 ==========

  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket2.id,
      authorId: applicant2Account.id,
      authorType: 'FROM_CUSTOMER',
      content:
        'Здравствуйте! Не могу оплатить обучение, система выдает ошибку при вводе данных карты.',
      status: 'SENT',
      createdAt: new Date('2025-01-13T14:00:00Z'),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket2.id,
      authorId: operator2.id,
      authorType: 'FROM_AGENT',
      content:
        'Здравствуйте, Мария! Какая именно ошибка возникает? Попробуйте использовать другой браузер или очистить кэш.',
      status: 'DELIVERED',
      deliveredAt: new Date('2025-01-13T15:30:00Z'),
      createdAt: new Date('2025-01-13T15:30:00Z'),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket2.id,
      authorId: applicant2Account.id,
      authorType: 'FROM_CUSTOMER',
      content:
        'Попробовала в Chrome и Firefox, везде пишет "Транзакция отклонена банком". Карта точно рабочая, другие платежи проходят.',
      status: 'SENT',
      createdAt: new Date('2025-01-14T10:00:00Z'),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: inProgressTicket2.id,
      authorId: operator2.id,
      authorType: 'FROM_AGENT',
      content:
        'Понял проблему. Свяжусь с платежным шлюзом. Ожидайте, решится в течение 24 часов.',
      status: 'SENT',
      createdAt: new Date('2025-01-14T16:45:00Z'),
    },
  });

  console.log('💬 Created messages for IN_PROGRESS ticket 2');

  // ========== Создание сообщений для ESCALATED тикета ==========

  await prisma.ticketMessage.create({
    data: {
      ticketId: escalatedTicket.id,
      authorId: applicant3Account.id,
      authorType: 'FROM_CUSTOMER',
      content:
        'Система постоянно выдает ошибку 500 при попытке загрузить документы. Уже 3 дня не могу отправить справку об инвалидности.',
      status: 'SENT',
      createdAt: new Date('2025-01-12T10:00:00Z'),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: escalatedTicket.id,
      authorId: operator1.id,
      authorType: 'FROM_AGENT',
      content:
        'Проблема требует эскалации до старшего оператора. Передаю тикет коллеге.',
      status: 'DELIVERED',
      deliveredAt: new Date('2025-01-12T11:00:00Z'),
      createdAt: new Date('2025-01-12T11:00:00Z'),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: escalatedTicket.id,
      authorId: supervisor.id,
      authorType: 'FROM_AGENT',
      content:
        'Здравствуйте! Мы обнаружили проблему в сервисе загрузки файлов. Техническая команда уже работает над исправлением. Ориентировочно проблема будет решена завтра.',
      status: 'SEEN',
      deliveredAt: new Date('2025-01-12T11:30:00Z'),
      seenAt: new Date('2025-01-12T11:35:00Z'),
      createdAt: new Date('2025-01-12T11:30:00Z'),
    },
  });

  console.log('💬 Created messages for ESCALATED ticket');

  // ========== Создание эскалации в аудите ==========

  await prisma.escalationTicketAudit.create({
    data: {
      ticketId: escalatedTicket.id,
      fromAgentId: operator1.id,
      toAgentId: supervisor.id,
      cause: EscalationCause.COMPLEX_ISSUE,
      causeComment:
        'Техническая проблема на стороне сервера, требуется вмешательство разработки',
      escalatedAt: new Date('2025-01-12T11:00:00Z'),
    },
  });

  console.log('📝 Created escalation audit record');

  // ========== Создание WebSocket соединений (для тестов) ==========

  await prisma.userConnection.create({
    data: {
      accountId: operator1.id,
      socketId: 'socket_test_001',
      connectedAt: new Date(),
    },
  });

  await prisma.userConnection.create({
    data: {
      accountId: operator2.id,
      socketId: 'socket_test_002',
      connectedAt: new Date(),
    },
  });

  console.log('🔌 Created test WebSocket connections');

  // ========== Итоговая статистика ==========

  const ticketsCount = await prisma.ticket.count();
  const messagesCount = await prisma.ticketMessage.count();
  const accountsCount = await prisma.account.count();

  console.log('\n=================================');
  console.log('✅ Seeding completed successfully!');
  console.log('=================================');
  console.log('\n📊 Database statistics:');
  console.log(`  👥 Accounts: ${accountsCount}`);
  console.log(`  🎫 Tickets: ${ticketsCount}`);
  console.log(`  💬 Messages: ${messagesCount}`);
  console.log(`  📚 Exam scores: ${examScoresData.length}`);
  console.log(`  🎓 Programs: ${applicantProgramsData.length}`);

  console.log('\n📋 Test accounts:');
  console.log('  👑 Admin:      admin@admin.com / admin');
  console.log('  👔 Supervisor: supervisor@example.com / admin');
  console.log('  👨‍💼 Operator1:  operator1@example.com / admin');
  console.log('  👨‍💼 Operator2:  operator2@example.com / admin');
  console.log('  👨‍💼 Operator3:  operator3@example.com / admin');
  console.log('  📚 Applicant1: ivanov.alexey@example.com / user123');
  console.log('  📚 Applicant2: petrova.maria@example.com / user123');
  console.log('  📚 Applicant3: sokolov.dmitry@example.com / user123');
  console.log('  📚 Applicant4: kozlova.olga@example.com / user123');

  console.log('\n📋 Ticket status distribution:');
  console.log(`  🆕 NEW: 4 tickets`);
  console.log(`  🔄 IN_PROGRESS: 3 tickets`);
  console.log(`  ⚠️ ESCALATED: 1 ticket`);
  console.log(`  ✅ RESOLVED: 1 ticket`);
  console.log(`  🔒 CLOSED: 1 ticket`);
  console.log(`  💬 AWAITING_FEEDBACK: 1 ticket`);
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

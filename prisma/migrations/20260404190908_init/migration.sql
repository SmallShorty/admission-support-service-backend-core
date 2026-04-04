-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('ADMIN', 'OPERATOR', 'SUPERVISOR', 'APPLICANT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AdmissionIntentCategory" AS ENUM ('TECHNICAL_ISSUES', 'DEADLINES_TIMELINES', 'DOCUMENT_SUBMISSION', 'STATUS_VERIFICATION', 'SCORES_COMPETITION', 'PAYMENTS_CONTRACTS', 'ENROLLMENT', 'DORMITORY_HOUSING', 'STUDIES_SCHEDULE', 'EVENTS', 'GENERAL_INFO', 'PROGRAM_CONSULTATION');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('BUDGET_COMPETITIVE', 'BUDGET_BVI', 'BUDGET_SPECIAL_QUOTA', 'BUDGET_SEPARATE_QUOTA', 'TARGET', 'PAID');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'SEEN');

-- CreateEnum
CREATE TYPE "EscalationCause" AS ENUM ('COMPLEX_ISSUE', 'INSUFFICIENT_RIGHTS', 'CUSTOMER_COMPLAINT', 'TECHNICAL_FAILURE', 'TIMEOUT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('EGE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('FROM_CUSTOMER', 'FROM_AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SatisfactionScore" AS ENUM ('TERRIBLE', 'POOR', 'AVERAGE', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "StudyForm" AS ENUM ('FULL_TIME', 'PART_TIME', 'EVENING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED', 'AWAITING_FEEDBACK');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "external_id" VARCHAR,
    "last_name" VARCHAR NOT NULL,
    "first_name" VARCHAR NOT NULL,
    "middle_name" VARCHAR,
    "email" VARCHAR NOT NULL,
    "auth_provider" "AuthProvider" NOT NULL,
    "role" "AccountRole",
    "password_hash" VARCHAR(255),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" UUID NOT NULL,
    "snils" VARCHAR(14),
    "has_bvi" BOOLEAN DEFAULT false,
    "has_special_quota" BOOLEAN DEFAULT false,
    "has_separate_quota" BOOLEAN DEFAULT false,
    "has_target_quota" BOOLEAN DEFAULT false,
    "has_priority_right" BOOLEAN DEFAULT false,
    "original_document_received" BOOLEAN DEFAULT false,
    "original_document_received_at" TIMESTAMP(6),

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_programs" (
    "id" BIGSERIAL NOT NULL,
    "applicant_id" UUID NOT NULL,
    "program_id" INTEGER NOT NULL,
    "program_code" VARCHAR(20) NOT NULL,
    "study_form" "StudyForm" NOT NULL,
    "admission_type" "AdmissionType" NOT NULL,
    "priority" SMALLINT NOT NULL,

    CONSTRAINT "applicant_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_ticket_audit" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "from_agent_id" UUID NOT NULL,
    "to_agent_id" UUID NOT NULL,
    "cause" "EscalationCause" NOT NULL,
    "cause_comment" TEXT,
    "escalated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(6),

    CONSTRAINT "escalation_ticket_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_scores" (
    "id" BIGSERIAL NOT NULL,
    "applicant_id" UUID NOT NULL,
    "subject_name" VARCHAR(100) NOT NULL,
    "score" INTEGER NOT NULL,
    "type" "ExamType",

    CONSTRAINT "exam_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "DeliveryStatus" DEFAULT 'SENT',
    "delivered_at" TIMESTAMP(6),
    "seen_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "agent_id" UUID,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" SMALLINT DEFAULT 0,
    "intent" "AdmissionIntentCategory",
    "note_text" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(6),
    "first_reply_at" TIMESTAMP(6),
    "resolved_at" TIMESTAMP(6),
    "closed_at" TIMESTAMP(6),
    "satisfaction_score" "SatisfactionScore",
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_snils_key" ON "applicants"("snils");

-- CreateIndex
CREATE INDEX "idx_escalation_from" ON "escalation_ticket_audit"("from_agent_id");

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_id_fkey" FOREIGN KEY ("id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_programs" ADD CONSTRAINT "applicant_programs_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_ticket_audit" ADD CONSTRAINT "escalation_ticket_audit_from_agent_id_fkey" FOREIGN KEY ("from_agent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_ticket_audit" ADD CONSTRAINT "escalation_ticket_audit_to_agent_id_fkey" FOREIGN KEY ("to_agent_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_ticket_audit" ADD CONSTRAINT "escalation_ticket_audit_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

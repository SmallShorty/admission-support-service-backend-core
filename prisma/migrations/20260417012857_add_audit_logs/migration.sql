-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'ACCOUNT', 'TICKET', 'TEMPLATE', 'SECURITY', 'MESSAGING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'TOKEN_REFRESH_FAILED', 'LOGOUT', 'ACCOUNT_REGISTERED', 'ACCOUNT_UPDATED', 'TICKET_TAKEN', 'TICKET_ESCALATED', 'TICKET_STATUS_CHANGED', 'TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'TEMPLATE_ACTIVATED', 'TEMPLATE_DEACTIVATED', 'TICKET_ACCESS_FORBIDDEN', 'TICKET_ESCALATION_FORBIDDEN', 'MESSAGE_VARIABLE_RESOLUTION_FAILED');

-- CreateEnum
CREATE TYPE "IntegrationAction" AS ENUM ('INTEGRATION_CREATED', 'INTEGRATION_UPDATED', 'INTEGRATION_ACTIVATED', 'INTEGRATION_DEACTIVATED', 'INTEGRATION_SUBMITTED', 'INTEGRATION_SUBMISSION_NOT_FOUND', 'INTEGRATION_SUBMISSION_READONLY_FIELD_VIOLATION');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "category" "AuditCategory" NOT NULL,
    "severity" "LogSeverity" NOT NULL,
    "actor" JSONB,
    "target_id" TEXT,
    "target_type" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" UUID NOT NULL,
    "integration_id" UUID,
    "slug" TEXT,
    "action" "IntegrationAction" NOT NULL,
    "severity" "LogSeverity" NOT NULL,
    "actor" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "integration_logs_action_idx" ON "integration_logs"("action");

-- CreateIndex
CREATE INDEX "integration_logs_severity_idx" ON "integration_logs"("severity");

-- CreateIndex
CREATE INDEX "integration_logs_integration_id_idx" ON "integration_logs"("integration_id");

-- CreateIndex
CREATE INDEX "integration_logs_slug_idx" ON "integration_logs"("slug");

-- CreateIndex
CREATE INDEX "integration_logs_created_at_idx" ON "integration_logs"("created_at");

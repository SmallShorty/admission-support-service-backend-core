-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "last_message_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "tickets_status_priority_last_message_at_idx" ON "tickets"("status", "priority", "last_message_at");

-- CreateIndex
CREATE INDEX "tickets_status_agent_id_idx" ON "tickets"("status", "agent_id");

-- CreateIndex
CREATE INDEX "tickets_status_priority_idx" ON "tickets"("status", "priority");

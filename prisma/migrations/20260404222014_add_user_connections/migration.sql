/*
  Warnings:

  - You are about to drop the `ticket_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ticket_messages" DROP CONSTRAINT "ticket_messages_author_id_fkey";

-- DropForeignKey
ALTER TABLE "ticket_messages" DROP CONSTRAINT "ticket_messages_ticket_id_fkey";

-- DropTable
DROP TABLE "ticket_messages";

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" BIGSERIAL NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "DeliveryStatus" DEFAULT 'SENT',
    "delivered_at" TIMESTAMP(6),
    "seen_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_connections" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "socket_id" TEXT NOT NULL,
    "connected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(6),

    CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketMessage_ticket_id_created_at_idx" ON "TicketMessage"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "TicketMessage_author_id_idx" ON "TicketMessage"("author_id");

-- CreateIndex
CREATE INDEX "user_connections_account_id_idx" ON "user_connections"("account_id");

-- CreateIndex
CREATE INDEX "user_connections_socket_id_idx" ON "user_connections"("socket_id");

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

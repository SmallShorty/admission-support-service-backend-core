-- CreateEnum
CREATE TYPE "IntegrationEventType" AS ENUM ('INFORMATIONAL', 'FAILURE');

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "event_type" "IntegrationEventType" NOT NULL,
    "theme" VARCHAR(100) NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "is_type_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_theme_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_source_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_content_editable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrations_slug_key" ON "integrations"("slug");

-- CreateIndex
CREATE INDEX "integrations_name_idx" ON "integrations"("name");

-- CreateIndex
CREATE INDEX "integrations_event_type_idx" ON "integrations"("event_type");

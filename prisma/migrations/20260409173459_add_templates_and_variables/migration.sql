-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "alias" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "category" "AdmissionIntentCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_variables" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "source_field" TEXT NOT NULL,
    "fallback_text" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynamic_variables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "templates_alias_key" ON "templates"("alias");

-- CreateIndex
CREATE INDEX "templates_alias_idx" ON "templates"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_variables_name_key" ON "dynamic_variables"("name");

-- CreateIndex
CREATE INDEX "tickets_agent_id_status_idx" ON "tickets"("agent_id", "status");

-- CreateIndex
CREATE INDEX "tickets_applicant_id_idx" ON "tickets"("applicant_id");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_created_id_fkey" FOREIGN KEY ("created_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

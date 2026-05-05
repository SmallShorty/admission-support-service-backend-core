-- AlterTable: add created_by with a temporary default to handle existing rows
ALTER TABLE "integrations" ADD COLUMN "created_by" UUID;

-- Backfill: assign existing integrations to the first ADMIN account found
UPDATE "integrations"
SET "created_by" = (
  SELECT "id" FROM "accounts" WHERE "role" = 'ADMIN' ORDER BY "created_at" ASC LIMIT 1
)
WHERE "created_by" IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE "integrations" ALTER COLUMN "created_by" SET NOT NULL;

-- CreateIndex
CREATE INDEX "integrations_created_by_idx" ON "integrations"("created_by");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

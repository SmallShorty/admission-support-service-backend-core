/*
  Warnings:

  - Added the required column `program_name` to the `applicant_programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applicant_programs" ADD COLUMN "program_name" VARCHAR(255);

-- Fill existing rows with program_code as program_name
UPDATE "applicant_programs" SET "program_name" = "program_code" WHERE "program_name" IS NULL;

-- Make program_name NOT NULL
ALTER TABLE "applicant_programs" ALTER COLUMN "program_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "exam_scores" ADD COLUMN "subject_code" VARCHAR(20);

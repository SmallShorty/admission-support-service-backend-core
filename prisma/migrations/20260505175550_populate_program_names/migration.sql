-- Populate program_name with default text for existing records
UPDATE "applicant_programs" SET "program_name" = 'Название направления' WHERE "program_name" IS NULL OR "program_name" = '';
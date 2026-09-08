-- CreateEnum
CREATE TYPE "ChecklistLinkStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "dob" DATE,
ADD COLUMN     "education_history" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zip_code" TEXT;

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field_keys" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "status" "ChecklistLinkStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_data" JSONB,
    "created_by_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "checklist_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_links_token_key" ON "checklist_links"("token");

-- CreateIndex
CREATE INDEX "checklist_links_token_idx" ON "checklist_links"("token");

-- CreateIndex
CREATE INDEX "checklist_links_candidate_id_idx" ON "checklist_links"("candidate_id");

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_links" ADD CONSTRAINT "checklist_links_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_links" ADD CONSTRAINT "checklist_links_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_links" ADD CONSTRAINT "checklist_links_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

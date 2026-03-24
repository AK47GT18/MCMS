/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `budget_line` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `requisitions` table. All the data in the column will be lost.
  - You are about to alter the column `total_amount` on the `requisitions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(15,2)`.
  - You are about to drop the `vendors` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `project_id` on table `requisitions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `submitted_by` on table `requisitions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "contract_status_enum" ADD VALUE 'pending_approval';

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "requisitions" DROP CONSTRAINT "requisitions_project_id_fkey";

-- DropForeignKey
ALTER TABLE "requisitions" DROP CONSTRAINT "requisitions_submitted_by_fkey";

-- DropForeignKey
ALTER TABLE "requisitions" DROP CONSTRAINT "requisitions_vendor_id_fkey";

-- DropIndex
DROP INDEX "contracts_vendor_id_idx";

-- DropIndex
DROP INDEX "requisitions_status_idx";

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "vendor_id",
ADD COLUMN     "contract_type" VARCHAR(50),
ADD COLUMN     "materials_list" TEXT,
ADD COLUMN     "vendor_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "field_supervisor_id" INTEGER;

-- AlterTable
ALTER TABLE "requisitions" DROP COLUMN "budget_line",
DROP COLUMN "description",
DROP COLUMN "vendor_id",
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "vendor_name" VARCHAR(255),
ALTER COLUMN "req_code" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "project_id" SET NOT NULL,
ALTER COLUMN "submitted_by" SET NOT NULL,
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "reviewed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "deletion_reason" VARCHAR(500);

-- DropTable
DROP TABLE "vendors";

-- DropEnum
DROP TYPE "vendor_status_enum";

-- CreateTable
CREATE TABLE "contract_versions" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "ref_code" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "value" DECIMAL(18,2),
    "status" VARCHAR(20) NOT NULL,
    "change_notes" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" SERIAL NOT NULL,
    "entity_name" VARCHAR(255) NOT NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "policy_number" VARCHAR(100) NOT NULL,
    "expiry_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Valid',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "original_name" VARCHAR(255) NOT NULL,
    "current_version_url" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "contract_value" DECIMAL(18,2),
    "project_id" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "change_notes" TEXT,
    "contract_value" DECIMAL(18,2),
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_specifications" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "road_type" VARCHAR(10) NOT NULL,
    "length_km" DECIMAL(10,3) NOT NULL,
    "width_m" DECIMAL(6,2) NOT NULL,
    "lanes" INTEGER NOT NULL DEFAULT 2,
    "terrain" VARCHAR(30) NOT NULL,
    "geographic_zone" VARCHAR(100),
    "nearest_town_km" DECIMAL(8,2),
    "estimated_total_low" DECIMAL(20,2) NOT NULL,
    "estimated_total_high" DECIMAL(20,2) NOT NULL,
    "approved_total" DECIMAL(20,2),
    "cost_per_meter_low" DECIMAL(18,2),
    "cost_per_meter_high" DECIMAL(18,2),
    "reconciliation_status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "road_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_layers" (
    "id" SERIAL NOT NULL,
    "spec_id" INTEGER NOT NULL,
    "phase_number" INTEGER NOT NULL,
    "phase_name" VARCHAR(100) NOT NULL,
    "material_type" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "quantity_per_km" DECIMAL(14,3) NOT NULL,
    "total_quantity" DECIMAL(16,3) NOT NULL,
    "unit_cost_low" DECIMAL(18,2) NOT NULL,
    "unit_cost_high" DECIMAL(18,2) NOT NULL,
    "total_cost_low" DECIMAL(20,2) NOT NULL,
    "total_cost_high" DECIMAL(20,2) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_accessories" (
    "id" SERIAL NOT NULL,
    "spec_id" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "item_name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "quantity_per_km" DECIMAL(14,3) NOT NULL,
    "total_quantity" DECIMAL(16,3) NOT NULL,
    "unit_cost_low" DECIMAL(18,2) NOT NULL,
    "unit_cost_high" DECIMAL(18,2) NOT NULL,
    "total_cost_low" DECIMAL(20,2) NOT NULL,
    "total_cost_high" DECIMAL(20,2) NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_accessories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_versions_contract_id_idx" ON "contract_versions"("contract_id");

-- CreateIndex
CREATE INDEX "insurance_policies_expiry_date_idx" ON "insurance_policies"("expiry_date");

-- CreateIndex
CREATE INDEX "documents_project_id_idx" ON "documents"("project_id");

-- CreateIndex
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "road_specifications_project_id_key" ON "road_specifications"("project_id");

-- CreateIndex
CREATE INDEX "road_layers_spec_id_idx" ON "road_layers"("spec_id");

-- CreateIndex
CREATE INDEX "road_accessories_spec_id_idx" ON "road_accessories"("spec_id");

-- CreateIndex
CREATE INDEX "requisitions_submitted_by_idx" ON "requisitions"("submitted_by");

-- CreateIndex
CREATE INDEX "requisitions_req_code_idx" ON "requisitions"("req_code");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_field_supervisor_id_fkey" FOREIGN KEY ("field_supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_specifications" ADD CONSTRAINT "road_specifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_layers" ADD CONSTRAINT "road_layers_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "road_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "road_accessories" ADD CONSTRAINT "road_accessories_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "road_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

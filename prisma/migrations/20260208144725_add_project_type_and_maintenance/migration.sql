-- CreateEnum
CREATE TYPE "daily_log_status_enum" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "project_type_enum" AS ENUM ('Civil Works', 'Bridge Construction', 'Road Works', 'Building Works');

-- CreateEnum
CREATE TYPE "maintenance_type_enum" AS ENUM ('preventive', 'corrective', 'emergency');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "last_maintenance_at" DATE;

-- AlterTable
ALTER TABLE "daily_logs" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "daily_log_status_enum" NOT NULL DEFAULT 'pending',
ADD COLUMN     "task_id" INTEGER;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "client" VARCHAR(255),
ADD COLUMN     "lat" DECIMAL(10,8),
ADD COLUMN     "lng" DECIMAL(11,8),
ADD COLUMN     "project_type" "project_type_enum",
ADD COLUMN     "radius" INTEGER DEFAULT 500;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_change_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status_reason" TEXT;

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "service_date" DATE NOT NULL,
    "type" "maintenance_type_enum" NOT NULL DEFAULT 'preventive',
    "provider" VARCHAR(255),
    "cost" DECIMAL(18,2),
    "description" TEXT,
    "next_service_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_records_asset_id_idx" ON "maintenance_records"("asset_id");

-- CreateIndex
CREATE INDEX "maintenance_records_service_date_idx" ON "maintenance_records"("service_date");

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

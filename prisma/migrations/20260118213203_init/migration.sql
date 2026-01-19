-- CreateEnum
CREATE TYPE "role_enum" AS ENUM ('Project Manager', 'Finance Director', 'Field Supervisor', 'Contract Administrator', 'Equipment Coordinator', 'Operations Manager', 'Managing Director', 'System Technician');

-- CreateEnum
CREATE TYPE "project_status_enum" AS ENUM ('active', 'planning', 'on_hold', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "contract_status_enum" AS ENUM ('active', 'draft', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "milestone_status_enum" AS ENUM ('scheduled', 'pending', 'certified', 'paid');

-- CreateEnum
CREATE TYPE "vendor_status_enum" AS ENUM ('approved', 'pending', 'suspended');

-- CreateEnum
CREATE TYPE "asset_condition_enum" AS ENUM ('Good', 'Fair', 'Poor');

-- CreateEnum
CREATE TYPE "asset_status_enum" AS ENUM ('available', 'checked_out', 'in_transit', 'maintenance', 'decommissioned');

-- CreateEnum
CREATE TYPE "requisition_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'fraud_flag');

-- CreateEnum
CREATE TYPE "procurement_status_enum" AS ENUM ('pending_pm', 'pending_finance', 'approved', 'rejected', 'purchased');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "role_enum" NOT NULL,
    "avatar_url" TEXT,
    "permissions" TEXT[],
    "password_hash" VARCHAR(255),
    "last_login_ip" INET,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50),
    "tax_clearance_valid" BOOLEAN NOT NULL DEFAULT false,
    "tax_clearance_expiry" DATE,
    "ncic_grade" VARCHAR(20),
    "performance_rating" SMALLINT,
    "status" "vendor_status_enum" NOT NULL DEFAULT 'pending',
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "manager_id" INTEGER,
    "status" "project_status_enum" NOT NULL DEFAULT 'planning',
    "contract_value" DECIMAL(18,2),
    "budget_total" DECIMAL(18,2),
    "budget_spent" DECIMAL(18,2) DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "progress" SMALLINT NOT NULL DEFAULT 0,
    "dependency_id" INTEGER,
    "status_class" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "ref_code" VARCHAR(30) NOT NULL,
    "project_id" INTEGER,
    "vendor_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "value" DECIMAL(18,2),
    "start_date" DATE,
    "end_date" DATE,
    "status" "contract_status_enum" NOT NULL DEFAULT 'draft',
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "ref_code" VARCHAR(20),
    "description" VARCHAR(255),
    "due_date" DATE,
    "value" DECIMAL(18,2),
    "status" "milestone_status_enum" NOT NULL DEFAULT 'scheduled',
    "certificate_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "asset_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(100),
    "category" VARCHAR(50),
    "model_year" SMALLINT,
    "hours_or_km" INTEGER,
    "condition" "asset_condition_enum" NOT NULL DEFAULT 'Good',
    "fuel_level" SMALLINT,
    "current_project_id" INTEGER,
    "status" "asset_status_enum" NOT NULL DEFAULT 'available',
    "estimated_value" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_logs" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "project_id" INTEGER,
    "action" VARCHAR(20) NOT NULL,
    "fuel_level_at_action" SMALLINT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitions" (
    "id" SERIAL NOT NULL,
    "req_code" VARCHAR(20) NOT NULL,
    "project_id" INTEGER,
    "vendor_id" INTEGER,
    "submitted_by" INTEGER,
    "description" TEXT,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "budget_line" VARCHAR(20),
    "status" "requisition_status_enum" NOT NULL DEFAULT 'pending',
    "fraud_check" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_items" (
    "id" SERIAL NOT NULL,
    "requisition_id" INTEGER NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "entry_code" VARCHAR(20),
    "requisition_id" INTEGER,
    "project_id" INTEGER,
    "account_code" VARCHAR(20),
    "description" TEXT,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "submitted_by" INTEGER,
    "log_date" DATE NOT NULL,
    "headcount" INTEGER,
    "weather" VARCHAR(50),
    "narrative" TEXT,
    "expense_amount" DECIMAL(18,2),
    "expense_category" VARCHAR(50),
    "expense_reason" TEXT,
    "photos" JSONB,
    "is_sos" BOOLEAN NOT NULL DEFAULT false,
    "pm_approved" BOOLEAN NOT NULL DEFAULT false,
    "pm_approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "reported_by" INTEGER,
    "incident_type" VARCHAR(50),
    "site_area" VARCHAR(100),
    "persons_involved" TEXT,
    "description" TEXT,
    "photo_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_name" VARCHAR(100),
    "user_role" VARCHAR(50),
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" INTEGER,
    "target_code" VARCHAR(50),
    "ip_address" INET,
    "details" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_requests" (
    "id" SERIAL NOT NULL,
    "req_code" VARCHAR(20) NOT NULL,
    "vehicle_name" VARCHAR(255) NOT NULL,
    "estimated_cost" DECIMAL(18,2),
    "justification" TEXT,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'Standard',
    "requested_by" INTEGER,
    "pm_comments" TEXT,
    "pm_reviewed_at" TIMESTAMPTZ,
    "finance_comments" TEXT,
    "finance_reviewed_at" TIMESTAMPTZ,
    "status" "procurement_status_enum" NOT NULL DEFAULT 'pending_pm',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whistleblower_reports" (
    "id" SERIAL NOT NULL,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "reporter_id" INTEGER,
    "category" VARCHAR(100),
    "project_id" INTEGER,
    "evidence" TEXT,
    "document_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'submitted',
    "assigned_to" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whistleblower_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_change_requests" (
    "id" SERIAL NOT NULL,
    "bcr_code" VARCHAR(20) NOT NULL,
    "project_id" INTEGER NOT NULL,
    "budget_category" VARCHAR(50),
    "current_amount" DECIMAL(18,2),
    "proposed_amount" DECIMAL(18,2),
    "justification" TEXT,
    "requested_by" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "pm_approved" BOOLEAN,
    "pm_approved_at" TIMESTAMPTZ,
    "finance_approved" BOOLEAN,
    "finance_approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" SERIAL NOT NULL,
    "issue_code" VARCHAR(20) NOT NULL,
    "category" VARCHAR(100),
    "project_id" INTEGER,
    "site_location" VARCHAR(100),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'Medium',
    "description" TEXT,
    "photo_url" TEXT,
    "reported_by" INTEGER,
    "assigned_to" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_start_date_end_date_idx" ON "tasks"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_ref_code_key" ON "contracts"("ref_code");

-- CreateIndex
CREATE INDEX "contracts_project_id_idx" ON "contracts"("project_id");

-- CreateIndex
CREATE INDEX "contracts_vendor_id_idx" ON "contracts"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_code_key" ON "assets"("asset_code");

-- CreateIndex
CREATE INDEX "assets_current_project_id_idx" ON "assets"("current_project_id");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "asset_logs_asset_id_idx" ON "asset_logs"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "requisitions_req_code_key" ON "requisitions"("req_code");

-- CreateIndex
CREATE INDEX "requisitions_project_id_idx" ON "requisitions"("project_id");

-- CreateIndex
CREATE INDEX "requisitions_status_idx" ON "requisitions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_entry_code_key" ON "transactions"("entry_code");

-- CreateIndex
CREATE INDEX "transactions_project_id_idx" ON "transactions"("project_id");

-- CreateIndex
CREATE INDEX "daily_logs_project_id_log_date_idx" ON "daily_logs"("project_id", "log_date");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "procurement_requests_req_code_key" ON "procurement_requests"("req_code");

-- CreateIndex
CREATE INDEX "procurement_requests_status_idx" ON "procurement_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "budget_change_requests_bcr_code_key" ON "budget_change_requests"("bcr_code");

-- CreateIndex
CREATE UNIQUE INDEX "issues_issue_code_key" ON "issues"("issue_code");

-- CreateIndex
CREATE INDEX "issues_project_id_idx" ON "issues"("project_id");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dependency_id_fkey" FOREIGN KEY ("dependency_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_project_id_fkey" FOREIGN KEY ("current_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_logs" ADD CONSTRAINT "asset_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_logs" ADD CONSTRAINT "asset_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_logs" ADD CONSTRAINT "asset_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_items" ADD CONSTRAINT "requisition_items_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whistleblower_reports" ADD CONSTRAINT "whistleblower_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whistleblower_reports" ADD CONSTRAINT "whistleblower_reports_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whistleblower_reports" ADD CONSTRAINT "whistleblower_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_change_requests" ADD CONSTRAINT "budget_change_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_change_requests" ADD CONSTRAINT "budget_change_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

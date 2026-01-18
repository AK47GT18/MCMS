-- ============================================
-- MCMS PostgreSQL Database Schema
-- Generated: 2026-01-18
-- ============================================

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE role_enum AS ENUM (
    'Project Manager', 'Finance Director', 'Field Supervisor',
    'Contract Administrator', 'Equipment Coordinator',
    'Operations Manager', 'Managing Director', 'System Technician'
);

CREATE TYPE project_status_enum AS ENUM ('active', 'planning', 'on_hold', 'completed', 'cancelled');
CREATE TYPE contract_status_enum AS ENUM ('active', 'draft', 'expired', 'cancelled');
CREATE TYPE milestone_status_enum AS ENUM ('scheduled', 'pending', 'certified', 'paid');
CREATE TYPE vendor_status_enum AS ENUM ('approved', 'pending', 'suspended');
CREATE TYPE asset_condition_enum AS ENUM ('Good', 'Fair', 'Poor');
CREATE TYPE asset_status_enum AS ENUM ('available', 'checked_out', 'in_transit', 'maintenance', 'decommissioned');
CREATE TYPE requisition_status_enum AS ENUM ('pending', 'approved', 'rejected', 'fraud_flag');
CREATE TYPE procurement_status_enum AS ENUM ('pending_pm', 'pending_finance', 'approved', 'rejected', 'purchased');

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role role_enum NOT NULL,
    avatar_url TEXT,
    permissions TEXT[],
    password_hash VARCHAR(255),
    last_login_ip INET,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: vendors
-- ============================================
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    tax_clearance_valid BOOLEAN DEFAULT FALSE,
    tax_clearance_expiry DATE,
    ncic_grade VARCHAR(20),
    performance_rating SMALLINT CHECK (performance_rating >= 1 AND performance_rating <= 5),
    status vendor_status_enum DEFAULT 'pending',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: projects
-- ============================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_id INT REFERENCES users(id) ON DELETE SET NULL,
    status project_status_enum NOT NULL DEFAULT 'planning',
    location GEOGRAPHY(Point, 4326),
    contract_value NUMERIC(18,2),
    budget_total NUMERIC(18,2),
    budget_spent NUMERIC(18,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: tasks (Gantt Chart)
-- ============================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress SMALLINT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    dependency_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    status_class VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: contracts
-- ============================================
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    ref_code VARCHAR(30) UNIQUE NOT NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    value NUMERIC(18,2),
    start_date DATE,
    end_date DATE,
    status contract_status_enum DEFAULT 'draft',
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: milestones
-- ============================================
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    ref_code VARCHAR(20),
    description VARCHAR(255),
    due_date DATE,
    value NUMERIC(18,2),
    status milestone_status_enum DEFAULT 'scheduled',
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: assets (Fleet)
-- ============================================
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    category VARCHAR(50),
    model_year SMALLINT,
    hours_or_km INT,
    condition asset_condition_enum DEFAULT 'Good',
    fuel_level SMALLINT CHECK (fuel_level >= 0 AND fuel_level <= 100),
    current_project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    status asset_status_enum DEFAULT 'available',
    estimated_value NUMERIC(18,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: asset_logs (Check-in/Check-out)
-- ============================================
CREATE TABLE asset_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL,
    location GEOGRAPHY(Point, 4326),
    fuel_level_at_action SMALLINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: requisitions
-- ============================================
CREATE TABLE requisitions (
    id SERIAL PRIMARY KEY,
    req_code VARCHAR(20) UNIQUE NOT NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
    submitted_by INT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    total_amount NUMERIC(18,2) NOT NULL,
    budget_line VARCHAR(20),
    status requisition_status_enum DEFAULT 'pending',
    fraud_check BOOLEAN DEFAULT FALSE,
    reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: requisition_items
-- ============================================
CREATE TABLE requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INT NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    total_price NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================
-- TABLE: transactions (General Ledger)
-- ============================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    entry_code VARCHAR(20) UNIQUE,
    requisition_id INT REFERENCES requisitions(id) ON DELETE SET NULL,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    account_code VARCHAR(20),
    description TEXT,
    debit NUMERIC(18,2) DEFAULT 0,
    credit NUMERIC(18,2) DEFAULT 0,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: daily_logs (Field Supervisor)
-- ============================================
CREATE TABLE daily_logs (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INT REFERENCES users(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    headcount INT,
    weather VARCHAR(50),
    narrative TEXT,
    expense_amount NUMERIC(18,2),
    expense_category VARCHAR(50),
    expense_reason TEXT,
    photos JSONB,
    location GEOGRAPHY(Point, 4326),
    is_sos BOOLEAN DEFAULT FALSE,
    pm_approved BOOLEAN DEFAULT FALSE,
    pm_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: safety_incidents
-- ============================================
CREATE TABLE safety_incidents (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    reported_by INT REFERENCES users(id) ON DELETE SET NULL,
    incident_type VARCHAR(50),
    site_area VARCHAR(100),
    persons_involved TEXT,
    description TEXT,
    photo_url TEXT,
    location GEOGRAPHY(Point, 4326),
    status VARCHAR(20) DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: audit_logs (Immutable)
-- ============================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    target_code VARCHAR(50),
    ip_address INET,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent updates/deletes on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================
-- TABLE: procurement_requests
-- ============================================
CREATE TABLE procurement_requests (
    id SERIAL PRIMARY KEY,
    req_code VARCHAR(20) UNIQUE NOT NULL,
    vehicle_name VARCHAR(255) NOT NULL,
    estimated_cost NUMERIC(18,2),
    justification TEXT,
    priority VARCHAR(20) DEFAULT 'Standard',
    requested_by INT REFERENCES users(id) ON DELETE SET NULL,
    pm_comments TEXT,
    pm_reviewed_at TIMESTAMPTZ,
    finance_comments TEXT,
    finance_reviewed_at TIMESTAMPTZ,
    status procurement_status_enum DEFAULT 'pending_pm',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: whistleblower_reports
-- ============================================
CREATE TABLE whistleblower_reports (
    id SERIAL PRIMARY KEY,
    is_anonymous BOOLEAN DEFAULT TRUE,
    reporter_id INT REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100),
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    evidence TEXT,
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'submitted',
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: budget_change_requests
-- ============================================
CREATE TABLE budget_change_requests (
    id SERIAL PRIMARY KEY,
    bcr_code VARCHAR(20) UNIQUE NOT NULL,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    budget_category VARCHAR(50),
    current_amount NUMERIC(18,2),
    proposed_amount NUMERIC(18,2),
    variance NUMERIC(18,2) GENERATED ALWAYS AS (proposed_amount - current_amount) STORED,
    justification TEXT,
    requested_by INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    pm_approved BOOLEAN,
    pm_approved_at TIMESTAMPTZ,
    finance_approved BOOLEAN,
    finance_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: issues (Complaints)
-- ============================================
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    issue_code VARCHAR(20) UNIQUE NOT NULL,
    category VARCHAR(100),
    project_id INT REFERENCES projects(id) ON DELETE SET NULL,
    site_location VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'Medium',
    description TEXT,
    photo_url TEXT,
    reported_by INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_assets_project ON assets(current_project_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_asset_logs_asset ON asset_logs(asset_id);
CREATE INDEX idx_requisitions_project ON requisitions(project_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_daily_logs_project_date ON daily_logs(project_id, log_date);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_procurement_status ON procurement_requests(status);
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(status);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE projects IS 'Construction projects with budget tracking and geolocation';
COMMENT ON TABLE tasks IS 'Gantt chart tasks with dependencies';
COMMENT ON TABLE contracts IS 'Legal contracts with vendors';
COMMENT ON TABLE milestones IS 'Payment milestones tied to contracts';
COMMENT ON TABLE vendors IS 'Approved supplier and subcontractor registry';
COMMENT ON TABLE assets IS 'Fleet and equipment registry';
COMMENT ON TABLE asset_logs IS 'Equipment check-in/check-out tracking';
COMMENT ON TABLE requisitions IS 'Material and expense requisitions';
COMMENT ON TABLE transactions IS 'General ledger journal entries';
COMMENT ON TABLE daily_logs IS 'Field supervisor daily reports with GPS';
COMMENT ON TABLE safety_incidents IS 'HSE incident reports';
COMMENT ON TABLE audit_logs IS 'Immutable system audit trail';
COMMENT ON TABLE procurement_requests IS 'Vehicle procurement workflow';
COMMENT ON TABLE whistleblower_reports IS 'Anonymous integrity reports';
COMMENT ON TABLE budget_change_requests IS 'Budget modification governance';
COMMENT ON TABLE issues IS 'Operational issues and complaints';

-- ============================================
-- DONE
-- ============================================

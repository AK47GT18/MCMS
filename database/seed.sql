-- ============================================
-- MCMS Seed Data
-- Sample data matching frontend mock values
-- ============================================

-- ============================================
-- USERS
-- ============================================
INSERT INTO users (name, email, phone, role, avatar_url, permissions, password_hash) VALUES
('Sarah Jenkins', 's.jenkins@mkaka.mw', '+265 991 234 567', 'Project Manager', 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff', ARRAY['read_all', 'write_project', 'approve_timesheets'], '$2b$10$placeholder'),
('Stefan Mwale', 's.mwale@mkaka.mw', '+265 882 111 222', 'Finance Director', 'https://ui-avatars.com/api/?name=Stefan+Mwale&background=F97316&color=fff', ARRAY['read_all', 'write_finance', 'approve_budget'], '$2b$10$placeholder'),
('Mike Banda', 'm.banda@mkaka.mw', '+265 995 333 444', 'Field Supervisor', 'https://ui-avatars.com/api/?name=Mike+Banda&background=10B981&color=fff', ARRAY['read_assigned', 'write_daily_logs'], '$2b$10$placeholder'),
('John Kaira', 'j.kaira@mkaka.mw', '+265 884 555 666', 'Contract Administrator', 'https://ui-avatars.com/api/?name=John+Kaira&background=7C3AED&color=fff', ARRAY['read_contracts', 'write_contracts'], '$2b$10$placeholder'),
('Blessings Phiri', 'b.phiri@mkaka.mw', '+265 993 777 888', 'Equipment Coordinator', 'https://ui-avatars.com/api/?name=Blessings+Phiri&background=6366F1&color=fff', ARRAY['read_fleet', 'write_maintenance'], '$2b$10$placeholder'),
('Grace Chibwe', 'g.chibwe@mkaka.mw', '+265 889 999 000', 'Operations Manager', 'https://ui-avatars.com/api/?name=Grace+Chibwe&background=EC4899&color=fff', ARRAY['read_all', 'write_operations'], '$2b$10$placeholder'),
('David Mkaka', 'd.mkaka@mkaka.mw', '+265 991 123 456', 'Managing Director', 'https://ui-avatars.com/api/?name=David+Mkaka&background=111827&color=fff', ARRAY['read_all', 'approve_high_value'], '$2b$10$placeholder'),
('Isaac Newton', 'i.newton@mkaka.mw', '+265 990 000 111', 'System Technician', 'https://ui-avatars.com/api/?name=Isaac+Newton&background=334155&color=fff', ARRAY['read_all', 'manage_system', 'manage_users'], '$2b$10$placeholder');

-- ============================================
-- VENDORS
-- ============================================
INSERT INTO vendors (name, category, tax_clearance_valid, tax_clearance_expiry, ncic_grade, performance_rating, status) VALUES
('Malawi Cement Ltd', 'Materials', TRUE, '2025-12-31', NULL, 4, 'approved'),
('Apex Security', 'Services', FALSE, '2024-06-30', NULL, 3, 'suspended'),
('BuildRite Construction', 'Sub-Contractor', TRUE, '2025-12-31', '15 Million', 5, 'approved'),
('Flow Masters', 'Sub-Contractor', TRUE, '2025-08-15', '5 Million', 4, 'approved'),
('Mzuzu Hardware', 'Materials', TRUE, '2025-10-31', NULL, 4, 'approved'),
('Bright Sparks', 'Sub-Contractor', TRUE, '2025-09-30', '10 Million', 4, 'approved');

-- ============================================
-- PROJECTS
-- ============================================
INSERT INTO projects (code, name, manager_id, status, contract_value, budget_total, budget_spent, start_date, end_date) VALUES
('CEN-01', 'Unilia Library Complex', 1, 'active', 1200000000, 450000000, 382500000, '2025-01-01', '2026-06-30'),
('MZ-05', 'Mzuzu Clinic Extension', 1, 'active', 280000000, 120000000, 110400000, '2024-10-01', '2025-09-30'),
('NOR-04', 'Mzuzu Bridge Repair', 1, 'active', 850000000, 350000000, 210000000, '2025-02-01', '2025-12-15'),
('LIL-02', 'Area 18 Mall Access Road', 1, 'active', 420000000, 180000000, 189000000, '2024-11-01', '2025-08-31');

-- ============================================
-- TASKS (Gantt Items for CEN-01)
-- ============================================
INSERT INTO tasks (project_id, name, start_date, end_date, progress, status_class) VALUES
(1, 'Site Clearing & Survey', CURRENT_DATE - 10, CURRENT_DATE - 3, 100, 'gantt-item-emerald'),
(1, 'Excavation & Trenching', CURRENT_DATE - 2, CURRENT_DATE + 5, 45, 'gantt-item-emerald'),
(1, 'Foundation Poured', CURRENT_DATE + 6, CURRENT_DATE + 12, 0, 'gantt-item-orange'),
(1, 'Structural Steel Framing', CURRENT_DATE + 13, CURRENT_DATE + 25, 0, NULL),
(1, 'MEP First Fix', CURRENT_DATE + 20, CURRENT_DATE + 35, 0, NULL),
(1, 'Brickwork & Walling', CURRENT_DATE + 25, CURRENT_DATE + 45, 0, NULL),
(1, 'Roofing Installation', CURRENT_DATE + 40, CURRENT_DATE + 55, 0, NULL),
(1, 'Interior Plastering', CURRENT_DATE + 50, CURRENT_DATE + 65, 0, NULL),
(1, 'Exterior Landscaping', CURRENT_DATE + 60, CURRENT_DATE + 75, 0, NULL);

-- Set dependencies
UPDATE tasks SET dependency_id = 1 WHERE id = 2;
UPDATE tasks SET dependency_id = 2 WHERE id = 3;
UPDATE tasks SET dependency_id = 3 WHERE id = 4;

-- ============================================
-- CONTRACTS
-- ============================================
INSERT INTO contracts (ref_code, project_id, vendor_id, title, value, start_date, end_date, status) VALUES
('CTR-2024-001', 1, 3, 'Unilia Main Works', 1200000000, '2025-01-01', '2026-06-30', 'active'),
('CTR-2024-002', 3, 3, 'Mzuzu Bridge Works', 850000000, '2025-02-01', '2025-12-15', 'active'),
('CTR-SUP-089', 1, 1, 'Cement Supply Framework 2025', NULL, '2025-01-01', '2025-12-31', 'active'),
('CTR-SUB-05', 1, 4, 'Plumbing Subcontract', 45000000, '2025-02-15', '2025-08-15', 'draft'),
('CTR-SUB-012', 1, 6, 'Electrical Subcontract', 45000000, '2025-03-01', '2025-09-30', 'draft');

-- ============================================
-- MILESTONES
-- ============================================
INSERT INTO milestones (contract_id, ref_code, description, due_date, value, status) VALUES
(1, 'MS-100', 'Site Establishment', '2024-12-15', 45000000, 'paid'),
(1, 'MS-101', 'Foundation Completion', '2025-01-15', 120000000, 'pending'),
(1, 'MS-102', 'Wall Plate Level', '2025-02-28', 85000000, 'scheduled');

-- ============================================
-- ASSETS
-- ============================================
INSERT INTO assets (asset_code, name, serial_number, category, model_year, hours_or_km, condition, fuel_level, current_project_id, status, estimated_value) VALUES
('EQP-045', 'Caterpillar 320D Excavator', 'CAT-8892', 'Heavy Earthmoving', 2019, 8450, 'Good', 85, 1, 'checked_out', 180000000),
('EQP-012', 'Tata Tipper Truck 10T', 'TATA-Prima-12', 'Logistics', 2021, 120500, 'Fair', 45, 2, 'in_transit', 45000000),
('EQP-023', 'Honda Generator 5kVA', 'HON-GEN-23', 'Power Gen', 2018, NULL, 'Good', 15, 1, 'available', 2500000),
('EQP-008', 'Winget Concrete Mixer 400L', 'WIN-CMIX-08', 'Plant', 2018, NULL, 'Poor', NULL, 2, 'maintenance', 8000000);

-- ============================================
-- ASSET LOGS
-- ============================================
INSERT INTO asset_logs (asset_id, user_id, project_id, action, fuel_level_at_action, timestamp) VALUES
(1, 1, 1, 'check_out', 90, NOW() - INTERVAL '2 days'),
(2, 1, 2, 'check_out', 80, NOW() - INTERVAL '1 day'),
(3, 1, 1, 'check_in', 15, NOW() - INTERVAL '3 days');

-- ============================================
-- REQUISITIONS
-- ============================================
INSERT INTO requisitions (req_code, project_id, vendor_id, submitted_by, description, total_amount, budget_line, status, fraud_check) VALUES
('REQ-089', 1, 1, 1, '600 Bags Portland Cement', 4500000, '02-MAT', 'pending', FALSE),
('REQ-095', 1, 5, 1, 'Duplicate Payment Check', 850000, '02-MAT', 'fraud_flag', TRUE);

-- ============================================
-- REQUISITION ITEMS
-- ============================================
INSERT INTO requisition_items (requisition_id, item_name, quantity, unit_price) VALUES
(1, 'Portland Cement 50kg', 600, 7500);

-- ============================================
-- PROCUREMENT REQUESTS
-- ============================================
INSERT INTO procurement_requests (req_code, vehicle_name, estimated_cost, justification, priority, requested_by, status) VALUES
('PROC-882', 'Toyota Hilux 4x4', 45000000, 'Current site vehicle for CEN-01 is frequently breaking down. Need a reliable 4x4 for supervisor site visits and urgent small material deliveries.', 'Standard', 5, 'pending_pm');

-- ============================================
-- BUDGET CHANGE REQUESTS
-- ============================================
INSERT INTO budget_change_requests (bcr_code, project_id, budget_category, current_amount, proposed_amount, justification, requested_by, status) VALUES
('BCR-102', 1, '02-MAT Materials', 200000000, 220000000, 'Increased material costs due to supply chain delays', 1, 'pending');

-- ============================================
-- DAILY LOGS (Sample)
-- ============================================
INSERT INTO daily_logs (project_id, submitted_by, log_date, headcount, weather, narrative, expense_amount, expense_category, is_sos) VALUES
(1, 3, CURRENT_DATE, 14, 'Sunny 28°C', 'Foundation trench excavation progressing. Completed 15m of trenching today.', 150000, 'Equipment Fuel', FALSE);

-- ============================================
-- ISSUES
-- ============================================
INSERT INTO issues (issue_code, category, project_id, site_location, priority, description, reported_by, assigned_to, status) VALUES
('HSE-004', 'Safety', 1, 'Block B North Face', 'High', 'Unsafe scaffolding on Block B North face.', 3, 1, 'open'),
('WBS-012', 'Governance', NULL, 'Global', 'Critical', 'Possible material diversion at storage site.', 6, 2, 'investigating');

-- ============================================
-- AUDIT LOGS (Sample)
-- ============================================
INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_code, ip_address, timestamp) VALUES
(2, 'S. Mwale', 'Finance Dir', 'Approved', 'Transaction', 'TRX-9901', '105.12.4.22', NOW() - INTERVAL '45 minutes'),
(1, 'A. Kanjira', 'PM', 'Submitted', 'Transaction', 'TRX-9901', '105.12.4.55', NOW() - INTERVAL '50 minutes'),
(NULL, 'Unknown', NULL, 'Login Fail', 'Auth', NULL, '192.168.1.5', NOW() - INTERVAL '90 minutes');

-- ============================================
-- DONE
-- ============================================

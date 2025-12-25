-- Database Views for Mkaka Construction Management System

-- 1. Project Summaries View
CREATE OR REPLACE VIEW `view_project_summaries` AS
SELECT 
    p.id,
    p.project_code,
    p.project_name,
    p.status,
    p.contract_value,
    p.completion_percentage,
    COUNT(t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    u.first_name as pm_first_name,
    u.last_name as pm_last_name
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN users u ON p.project_manager_id = u.id
GROUP BY p.id;

-- 2. Budget Utilization View
CREATE OR REPLACE VIEW `view_budget_utilization` AS
SELECT 
    b.project_id,
    p.project_name,
    b.category,
    b.allocated_amount,
    COALESCE(SUM(tr.amount), 0) as spent_amount,
    (b.allocated_amount - COALESCE(SUM(tr.amount), 0)) as remaining_amount
FROM budgets b
JOIN projects p ON b.project_id = p.id
LEFT JOIN transactions tr ON b.project_id = tr.project_id 
    AND b.category = tr.category 
    AND tr.type = 'expense'
    AND tr.status = 'approved'
GROUP BY b.project_id, b.category;

-- 3. Late Tasks View
CREATE OR REPLACE VIEW `view_overdue_tasks` AS
SELECT 
    t.id,
    t.task_code,
    t.task_name,
    t.end_date,
    p.project_name,
    u.first_name as assignee_first_name,
    u.last_name as assignee_last_name,
    DATEDIFF(CURDATE(), t.end_date) as days_overdue
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status != 'completed' AND t.end_date < CURDATE();

-- 4. Equipment Availability View
CREATE OR REPLACE VIEW `view_equipment_status` AS
SELECT 
    e.id,
    e.equipment_name,
    e.equipment_type,
    e.status,
    e.current_project_id,
    p.project_name,
    u.first_name as operator_first_name,
    u.last_name as operator_last_name
FROM equipment e
LEFT JOIN projects p ON e.current_project_id = p.id
LEFT JOIN users u ON e.assigned_to = u.id;

-- Database Triggers for Mkaka Construction Management System

DELIMITER //

-- 1. Trigger to Update Project Updated_At on Task Change
CREATE TRIGGER `trg_task_update_project_timestamp`
AFTER UPDATE ON `tasks`
FOR EACH ROW
BEGIN
    UPDATE `projects` SET `updated_at` = CURRENT_TIMESTAMP WHERE `id` = NEW.project_id;
END //

CREATE TRIGGER `trg_task_insert_project_timestamp`
AFTER INSERT ON `tasks`
FOR EACH ROW
BEGIN
    UPDATE `projects` SET `updated_at` = CURRENT_TIMESTAMP WHERE `id` = NEW.project_id;
END //

-- 2. Trigger to Log Status Changes in Audit Log (Simplified)
-- Note: The application handles most audit logging, but database triggers can enforce it.
-- This is a backup measure.

-- 3. Trigger to Auto-Calculate Task Duration if End Date Changes
CREATE TRIGGER `trg_task_calculate_duration`
BEFORE UPDATE ON `tasks`
FOR EACH ROW
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.start_date IS NOT NULL THEN
        SET NEW.duration_days = DATEDIFF(NEW.end_date, NEW.start_date);
    END IF;
END //

-- 4. Trigger to Ensure Budget Non-Negative
CREATE TRIGGER `trg_budget_check`
BEFORE INSERT ON `budgets`
FOR EACH ROW
BEGIN
    IF NEW.allocated_amount < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Budget allocation cannot be negative';
    END IF;
END //

DELIMITER ;

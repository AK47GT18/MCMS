-- Database Stored Procedures for Mkaka Construction Management System

DELIMITER //

-- 1. Procedure to Archive Old Audit Logs
CREATE PROCEDURE `sp_archive_audit_logs`(IN retention_days INT)
BEGIN
    DECLARE cutoff_date DATE;
    SET cutoff_date = DATE_SUB(CURDATE(), INTERVAL retention_days DAY);
    
    -- In a real scenario, we might insert into an archive table first
    -- INSERT INTO audit_logs_archive SELECT * FROM audit_logs WHERE created_at < cutoff_date;
    
    DELETE FROM audit_logs WHERE created_at < cutoff_date;
END //

-- 2. Procedure to Calculate Project Progress
CREATE PROCEDURE `sp_update_project_progress`(IN project_id_param INT)
BEGIN
    DECLARE total_weight DECIMAL(10,2);
    DECLARE earned_value DECIMAL(10,2);
    DECLARE progress DECIMAL(5,2);
    
    SELECT SUM(weight) INTO total_weight 
    FROM tasks WHERE project_id = project_id_param;
    
    SELECT SUM(weight * (completion_percentage / 100)) INTO earned_value
    FROM tasks WHERE project_id = project_id_param;
    
    IF total_weight > 0 THEN
        SET progress = (earned_value / total_weight) * 100;
    ELSE
        SET progress = 0;
    END IF;
    
    UPDATE projects SET completion_percentage = progress WHERE id = project_id_param;
END //

-- 3. Procedure to Generate Monthly Financial Report
CREATE PROCEDURE `sp_monthly_financial_report`(IN report_month DATE)
BEGIN
    SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        category,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM transactions
    WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(report_month, '%Y-%m')
      AND status = 'approved'
    GROUP BY category;
END //

DELIMITER ;

-- Database Indexes for Mkaka Construction Management System

-- 1. Authentication & Users
CREATE INDEX `idx_users_role_id` ON `users`(`role_id`);
CREATE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_is_active` ON `users`(`is_active`);

-- 2. Project Management
CREATE INDEX `idx_projects_pm` ON `projects`(`project_manager_id`);
CREATE INDEX `idx_projects_status` ON `projects`(`status`);
CREATE INDEX `idx_projects_code` ON `projects`(`project_code`);

CREATE INDEX `idx_tasks_project` ON `tasks`(`project_id`);
CREATE INDEX `idx_tasks_assigned` ON `tasks`(`assigned_to`);
CREATE INDEX `idx_tasks_status` ON `tasks`(`status`);
CREATE INDEX `idx_tasks_parent` ON `tasks`(`parent_task_id`);
CREATE INDEX `idx_tasks_dates` ON `tasks`(`start_date`, `end_date`);

CREATE INDEX `idx_task_comments_task` ON `task_comments`(`task_id`);

-- 3. Financial & Contracts
CREATE INDEX `idx_contracts_project` ON `contracts`(`project_id`);
CREATE INDEX `idx_contracts_status` ON `contracts`(`status`);

CREATE INDEX `idx_contract_milestones_contract` ON `contract_milestones`(`contract_id`);

CREATE INDEX `idx_budgets_project` ON `budgets`(`project_id`);

CREATE INDEX `idx_transactions_project` ON `transactions`(`project_id`);
CREATE INDEX `idx_transactions_date` ON `transactions`(`date`);
CREATE INDEX `idx_transactions_type` ON `transactions`(`type`);

-- 4. Assets & Equipment
CREATE INDEX `idx_equipment_status` ON `equipment`(`status`);
CREATE INDEX `idx_equipment_project` ON `equipment`(`current_project_id`);
CREATE INDEX `idx_equipment_assigned` ON `equipment`(`assigned_to`);

CREATE INDEX `idx_equip_checkout_equip` ON `equipment_checkout_log`(`equipment_id`);
CREATE INDEX `idx_equip_checkout_project` ON `equipment_checkout_log`(`project_id`);

CREATE INDEX `idx_maintenance_equip` ON `maintenance_records`(`equipment_id`);
CREATE INDEX `idx_maintenance_status` ON `maintenance_records`(`status`);
CREATE INDEX `idx_maintenance_scheduled` ON `maintenance_records`(`scheduled_date`);

-- 5. Reporting & Documentation
CREATE INDEX `idx_site_reports_project` ON `site_reports`(`project_id`);
CREATE INDEX `idx_site_reports_date` ON `site_reports`(`report_date`);
CREATE INDEX `idx_site_reports_submitted` ON `site_reports`(`submitted_by`);

CREATE INDEX `idx_documents_entity` ON `documents`(`entity_type`, `entity_id`);
CREATE INDEX `idx_documents_type` ON `documents`(`document_type`);

-- 6. System & Workflow
CREATE INDEX `idx_notifications_user` ON `notifications`(`user_id`);
CREATE INDEX `idx_notifications_unread` ON `notifications`(`user_id`, `is_read`);

CREATE INDEX `idx_audit_logs_user` ON `audit_logs`(`user_id`);
CREATE INDEX `idx_audit_logs_entity` ON `audit_logs`(`entity_type`, `entity_id`);
CREATE INDEX `idx_audit_logs_created` ON `audit_logs`(`created_at`);

CREATE INDEX `idx_approvals_entity` ON `approvals`(`entity_type`, `entity_id`);
CREATE INDEX `idx_approvals_role_status` ON `approvals`(`approver_role`, `status`);

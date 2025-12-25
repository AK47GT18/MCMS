-- Database Schema Design for Mkaka Construction Management System
-- Generated based on application models

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Authentication & Users
-- -----------------------------------------------------------------------------

-- Roles Table
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20),
    `role_id` INT,
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Project Management
-- -----------------------------------------------------------------------------

-- Projects Table
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_code` VARCHAR(20) NOT NULL UNIQUE,
    `project_name` VARCHAR(100) NOT NULL,
    `client_name` VARCHAR(100) NOT NULL,
    `client_contact` VARCHAR(100),
    `client_email` VARCHAR(100),
    `contract_value` DECIMAL(15, 2) DEFAULT 0.00,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `expected_completion_date` DATE,
    `actual_completion_date` DATE,
    `status` VARCHAR(50) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
    `location` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `description` TEXT,
    `project_manager_id` INT,
    `project_type` VARCHAR(50),
    `priority` VARCHAR(20) DEFAULT 'medium',
    `completion_percentage` DECIMAL(5, 2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks Table
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NOT NULL,
    `task_code` VARCHAR(50) NOT NULL,
    `task_name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `start_date` DATE,
    `end_date` DATE,
    `duration_days` INT,
    `assigned_to` INT,
    `status` VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, on_hold, cancelled
    `completion_percentage` DECIMAL(5, 2) DEFAULT 0.00,
    `dependencies` JSON, -- JSON array of dependent task IDs
    `parent_task_id` INT,
    `priority` VARCHAR(20) DEFAULT 'normal',
    `weight` DECIMAL(5, 2) DEFAULT 1.00,
    `estimated_hours` DECIMAL(10, 2),
    `actual_hours` DECIMAL(10, 2),
    `estimated_cost` DECIMAL(15, 2),
    `actual_cost` DECIMAL(15, 2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task Comments Table
DROP TABLE IF EXISTS `task_comments`;
CREATE TABLE `task_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `task_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Financial & Contracts
-- -----------------------------------------------------------------------------

-- Contracts Table
DROP TABLE IF EXISTS `contracts`;
CREATE TABLE `contracts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contract_code` VARCHAR(50) NOT NULL UNIQUE,
    `project_id` INT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `start_date` DATE,
    `end_date` DATE,
    `value` DECIMAL(15, 2) DEFAULT 0.00,
    `status` VARCHAR(50) DEFAULT 'active', -- active, expired, terminated, completed
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contract Milestones Table
DROP TABLE IF EXISTS `contract_milestones`;
CREATE TABLE `contract_milestones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `contract_id` INT NOT NULL,
    `milestone_name` VARCHAR(255) NOT NULL,
    `due_date` DATE,
    `status` VARCHAR(50) DEFAULT 'pending',
    `amount` DECIMAL(15, 2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budgets Table
DROP TABLE IF EXISTS `budgets`;
CREATE TABLE `budgets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT NOT NULL,
    `category` VARCHAR(50) NOT NULL, -- labor, materials, equipment, etc.
    `allocated_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions Table
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_id` INT,
    `transaction_code` VARCHAR(50) UNIQUE,
    `type` VARCHAR(20) NOT NULL, -- income, expense
    `amount` DECIMAL(15, 2) NOT NULL,
    `date` DATE NOT NULL,
    `category` VARCHAR(50),
    `description` TEXT,
    `status` VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, rejected
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Assets & Equipment
-- -----------------------------------------------------------------------------

-- Equipment Table
DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipment_id` VARCHAR(50) NOT NULL UNIQUE,
    `equipment_name` VARCHAR(100) NOT NULL,
    `equipment_type` VARCHAR(50),
    `serial_number` VARCHAR(100),
    `manufacturer` VARCHAR(100),
    `model` VARCHAR(100),
    `purchase_date` DATE,
    `purchase_cost` DECIMAL(15, 2),
    `current_value` DECIMAL(15, 2),
    `status` VARCHAR(50) DEFAULT 'available', -- available, in_use, maintenance, damaged
    `current_location` JSON, -- {lat, lng}
    `current_project_id` INT,
    `assigned_to` INT,
    `usage_hours` DECIMAL(10, 2) DEFAULT 0.00,
    `last_maintenance_date` DATE,
    `next_maintenance_due` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`current_project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Checkout Log Table
DROP TABLE IF EXISTS `equipment_checkout_log`;
CREATE TABLE `equipment_checkout_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipment_id` INT NOT NULL,
    `project_id` INT,
    `assigned_to` INT,
    `checkout_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `checkout_latitude` DECIMAL(10, 8),
    `checkout_longitude` DECIMAL(11, 8),
    `checkout_by` INT,
    `checkin_date` TIMESTAMP NULL,
    `checkin_latitude` DECIMAL(10, 8),
    `checkin_longitude` DECIMAL(11, 8),
    `checkin_by` INT,
    `condition` VARCHAR(50),
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`checkout_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`checkin_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Records Table
DROP TABLE IF EXISTS `maintenance_records`;
CREATE TABLE `maintenance_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipment_id` INT NOT NULL,
    `maintenance_type` VARCHAR(50),
    `scheduled_date` DATE,
    `completed_date` DATE,
    `description` TEXT,
    `performed_by` INT, -- User ID if internal, or text for external? Assuming User ID based on model method
    `cost` DECIMAL(15, 2),
    `estimated_cost` DECIMAL(15, 2),
    `status` VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed
    `notes` TEXT,
    `scheduled_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`scheduled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Reporting & Documentation
-- -----------------------------------------------------------------------------

-- Site Reports Table
DROP TABLE IF EXISTS `site_reports`;
CREATE TABLE `site_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_code` VARCHAR(50) UNIQUE,
    `project_id` INT NOT NULL,
    `report_date` DATE NOT NULL,
    `report_type` VARCHAR(50), -- daily, weekly, incident
    `submitted_by` INT,
    `status` VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected
    `site_conditions` TEXT,
    `equipment_present` JSON,
    `personnel_attendance` JSON,
    `materials_delivered` JSON,
    `work_completed` TEXT,
    `challenges` TEXT,
    `incidents` TEXT,
    `weather_conditions` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `location_accuracy` DECIMAL(8, 2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents Table
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `entity_type` VARCHAR(50) NOT NULL, -- project, task, report, contract, etc.
    `entity_id` INT NOT NULL,
    `document_type` VARCHAR(50),
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size` BIGINT,
    `mime_type` VARCHAR(100),
    `version` INT DEFAULT 1,
    `description` TEXT,
    `metadata` JSON,
    `uploaded_by` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. System & Workflow
-- -----------------------------------------------------------------------------

-- Notifications Table
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `notification_type` VARCHAR(50),
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT,
    `entity_type` VARCHAR(50),
    `entity_id` INT,
    `is_read` TINYINT(1) DEFAULT 0,
    `read_at` TIMESTAMP NULL,
    `priority` VARCHAR(20) DEFAULT 'normal',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT, -- Nullable for system actions
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50),
    `entity_id` INT,
    `details` JSON,
    `ip_address` VARCHAR(45),
    `user_agent` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Immutable, no updated_at
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approvals Table
DROP TABLE IF EXISTS `approvals`;
CREATE TABLE `approvals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NOT NULL,
    `requested_by` INT,
    `approver_role` INT, -- Role ID required to approve
    `approver_id` INT, -- User ID who approved
    `status` VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    `comments` TEXT,
    `rejection_reason` TEXT,
    `approved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`approver_role`) REFERENCES `roles`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

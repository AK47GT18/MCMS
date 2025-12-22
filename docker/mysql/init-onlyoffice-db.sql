-- ============================================
-- OnlyOffice Database Initialization
-- Creates dedicated user and database for OnlyOffice
-- ============================================

-- Create OnlyOffice database
CREATE DATABASE IF NOT EXISTS `onlyoffice` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated OnlyOffice user with limited privileges
CREATE USER IF NOT EXISTS 'onlyoffice'@'%' IDENTIFIED BY '${ONLYOFFICE_DB_PASSWORD:-onlyoffice_pass_2026}';

-- Grant privileges to OnlyOffice user (limited scope)
GRANT ALL PRIVILEGES ON `onlyoffice`.* TO 'onlyoffice'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Initialize OnlyOffice database tables
USE `onlyoffice`;

-- OnlyOffice requires this table structure for document management
CREATE TABLE IF NOT EXISTS `doc_changes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doc_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255),
  `change_data` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `doc_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doc_id` VARCHAR(255) NOT NULL,
  `version` INT DEFAULT 1,
  `file_path` VARCHAR(512),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_doc_version` (`doc_id`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `doc_locks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doc_id` VARCHAR(255) NOT NULL UNIQUE,
  `locked_by` VARCHAR(255),
  `locked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

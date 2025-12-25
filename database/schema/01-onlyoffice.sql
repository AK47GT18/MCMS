-- OnlyOffice Integration Schema
-- Support for collaborative editing and version history

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- OnlyOffice Sessions
-- Tracks active editing sessions and document keys
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `onlyoffice_sessions`;
CREATE TABLE `onlyoffice_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `document_id` INT NOT NULL,
    `key` VARCHAR(255) NOT NULL, -- Unique document identifier used by OnlyOffice
    `status` INT DEFAULT 0, -- 0: not found, 1: editing, 2: saving, 3: saved, 4: closed...
    `users` JSON, -- List of connected users, useful for displaying "Who is editing"
    `ip_address` VARCHAR(45),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
    INDEX `idx_oo_sessions_key` (`key`),
    INDEX `idx_oo_sessions_doc` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- OnlyOffice History
-- Stores version history and changes for documents edited via OnlyOffice
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `onlyoffice_history`;
CREATE TABLE `onlyoffice_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `document_id` INT NOT NULL,
    `version` INT NOT NULL,
    `key` VARCHAR(255) NOT NULL, -- The key associated with this version
    `user_id` INT, -- User who saved this version
    `changes_json` JSON, -- Detailed changes from OnlyOffice callback
    `server_version` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_oo_history_doc` (`document_id`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Menu Cost Pro — License Database Schema
-- Database: AppCostCount
-- Import: phpMyAdmin → Import → select this file
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: license_keys
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_keys` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `key_code`    VARCHAR(24)  NOT NULL,
  `customer`    VARCHAR(255) NOT NULL,
  `max_devices` INT(11)      NOT NULL DEFAULT 1,
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `notes`       TEXT,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_code` (`key_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: device_activations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `device_activations` (
  `id`           INT(11)     NOT NULL AUTO_INCREMENT,
  `key_code`     VARCHAR(24) NOT NULL,
  `device_id`    VARCHAR(64) NOT NULL,
  `activated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_device` (`key_code`, `device_id`),
  CONSTRAINT `fk_device_key`
    FOREIGN KEY (`key_code`) REFERENCES `license_keys` (`key_code`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Sample license keys (optional — delete if not needed)
-- Format: XXXX-XXXX-XXXX-XXXX
-- ------------------------------------------------------------
-- INSERT INTO `license_keys` (`key_code`, `customer`, `max_devices`, `notes`) VALUES
-- ('ABCD-1234-EFGH-0001', 'Pho Hung Restaurant', 1, 'First customer'),
-- ('WXYZ-5678-MNOP-0002', 'Saigon Kitchen',      1, '');

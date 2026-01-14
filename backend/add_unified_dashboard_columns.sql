-- Migration script for unified dashboard columns
-- Run this on your production database

-- Check if input_type column exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'call_analyses';
SET @columnname = 'input_type';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column input_type already exists"',
  'ALTER TABLE call_analyses ADD COLUMN input_type ENUM("audio", "text", "image") NOT NULL DEFAULT "audio" AFTER template_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check if input_text column exists, if not add it
SET @columnname = 'input_text';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column input_text already exists"',
  'ALTER TABLE call_analyses ADD COLUMN input_text TEXT NULL AFTER audio_duration'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check if image_file_path column exists, if not add it
SET @columnname = 'image_file_path';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column image_file_path already exists"',
  'ALTER TABLE call_analyses ADD COLUMN image_file_path VARCHAR(500) NULL AFTER input_text'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'call_analyses'
AND COLUMN_NAME IN ('input_type', 'input_text', 'image_file_path');

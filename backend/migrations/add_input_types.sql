-- Migration: Add input types support to call_analyses table
-- Date: 2026-01-09
-- Description: Add fields for text and image input types

-- Add input_type enum column (default: 'audio')
ALTER TABLE call_analyses
ADD COLUMN input_type ENUM('audio', 'text', 'image') NOT NULL DEFAULT 'audio'
AFTER template_id;

-- Add input_text column for direct text input
ALTER TABLE call_analyses
ADD COLUMN input_text TEXT NULL
AFTER audio_duration;

-- Add image_file_path column for image input
ALTER TABLE call_analyses
ADD COLUMN image_file_path VARCHAR(500) NULL
AFTER input_text;

-- Add index on input_type for performance
CREATE INDEX idx_input_type ON call_analyses(input_type);

-- Update existing records to have input_type='audio'
UPDATE call_analyses SET input_type = 'audio' WHERE input_type IS NULL;

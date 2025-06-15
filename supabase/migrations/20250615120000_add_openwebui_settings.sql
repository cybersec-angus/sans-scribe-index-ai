
-- Add OpenWebUI configuration columns to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS openwebui_url TEXT,
ADD COLUMN IF NOT EXISTS openwebui_api_key TEXT,
ADD COLUMN IF NOT EXISTS openwebui_model TEXT;

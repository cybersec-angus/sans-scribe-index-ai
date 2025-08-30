
-- Enable Row Level Security on existing tables and add user_id columns
ALTER TABLE pdf_files 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE index_entries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ai_indexing_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_indexing_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pdf_files
CREATE POLICY "Users can view their own PDF files" 
  ON pdf_files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF files" 
  ON pdf_files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF files" 
  ON pdf_files FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF files" 
  ON pdf_files FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for index_entries
CREATE POLICY "Users can view their own index entries" 
  ON index_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own index entries" 
  ON index_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own index entries" 
  ON index_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own index entries" 
  ON index_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
  ON user_settings FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for ai_indexing_sessions
CREATE POLICY "Users can view their own AI indexing sessions" 
  ON ai_indexing_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI indexing sessions" 
  ON ai_indexing_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI indexing sessions" 
  ON ai_indexing_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI indexing sessions" 
  ON ai_indexing_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to automatically create user settings when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, default_color_code)
  VALUES (NEW.id, '#fbbf24');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user settings
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

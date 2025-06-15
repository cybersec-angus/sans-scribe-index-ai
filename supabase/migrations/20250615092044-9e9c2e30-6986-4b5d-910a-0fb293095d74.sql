
-- Create a table to track AI indexing sessions
CREATE TABLE public.ai_indexing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_file_id UUID REFERENCES public.pdf_files(id) ON DELETE CASCADE,
  start_page INTEGER NOT NULL,
  current_page INTEGER NOT NULL,
  total_pages_processed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add an indexing session reference to index_entries
ALTER TABLE public.index_entries 
ADD COLUMN ai_indexing_session_id UUID REFERENCES public.ai_indexing_sessions(id) ON DELETE SET NULL;

-- Add a column to track if an entry was created by AI
ALTER TABLE public.index_entries 
ADD COLUMN created_by_ai BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX idx_ai_indexing_sessions_pdf_file_id ON public.ai_indexing_sessions(pdf_file_id);
CREATE INDEX idx_index_entries_ai_session ON public.index_entries(ai_indexing_session_id);
CREATE INDEX idx_index_entries_created_by_ai ON public.index_entries(created_by_ai);


import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type AIIndexingSession = Tables<'ai_indexing_sessions'>;
type AIIndexingSessionInsert = TablesInsert<'ai_indexing_sessions'>;

interface AIIndexRequest {
  pageText: string;
  pageNumber: number;
  bookNumber: string;
  courseCode?: string;
  openWebUIUrl: string;
  apiKey?: string;
  model?: string;
}

interface AIIndexResponse {
  terms: Array<{
    word: string;
    definition: string;
    notes?: string;
  }>;
}

export const useAIIndexing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['ai_indexing_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_indexing_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching AI indexing sessions:', error);
        throw error;
      }
      
      return data;
    },
  });

  const createSession = useMutation({
    mutationFn: async (session: AIIndexingSessionInsert) => {
      const { data, error } = await supabase
        .from('ai_indexing_sessions')
        .insert(session)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai_indexing_sessions'] });
      toast({
        title: "AI Indexing Session Created",
        description: `Started indexing from page ${data.start_page}`,
      });
    },
    onError: (error) => {
      console.error('Error creating AI indexing session:', error);
      toast({
        title: "Error",
        description: "Failed to create AI indexing session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIIndexingSession> }) => {
      const { data, error } = await supabase
        .from('ai_indexing_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_indexing_sessions'] });
    },
    onError: (error) => {
      console.error('Error updating AI indexing session:', error);
      toast({
        title: "Error",
        description: "Failed to update AI indexing session.",
        variant: "destructive",
      });
    },
  });

  const indexPageWithAI = useMutation({
    mutationFn: async (request: AIIndexRequest) => {
      const prompt = `You are an AI assistant that helps students prepare for cybersecurity exams by identifying and defining key terms from textbook pages.

Your task is to:
1. Analyze the provided text from a cybersecurity textbook page
2. Identify the most important terms that would likely appear on an exam
3. Provide concise definitions (maximum 2 sentences each)
4. Return the results in valid JSON format

Rules:
- Focus on technical terms, concepts, acronyms, and methodologies
- Prioritize terms that are likely to be tested
- Keep definitions to 2 sentences maximum
- Return ONLY valid JSON, no additional text
- Include 5-15 terms per page (depending on content density)

Page text to analyze:
${request.pageText}

Return format:
{
  "terms": [
    {
      "word": "term name",
      "definition": "Brief definition in 1-2 sentences.",
      "notes": "Optional additional context or examples"
    }
  ]
}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (request.apiKey) {
        headers['Authorization'] = `Bearer ${request.apiKey}`;
      }

      const response = await fetch(`${request.openWebUIUrl}/api/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model || 'llama3.2',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that helps students prepare for cybersecurity exams. You must return only valid JSON responses with no additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenWebUI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Try to parse the JSON response
      try {
        const parsedResponse: AIIndexResponse = JSON.parse(aiResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponse);
        throw new Error('AI response was not valid JSON format');
      }
    },
    onError: (error) => {
      console.error('Error indexing page with AI:', error);
      toast({
        title: "AI Indexing Failed",
        description: "Failed to index page with AI. Please check your settings and try again.",
        variant: "destructive",
      });
    },
  });

  const saveAITerms = useMutation({
    mutationFn: async ({ 
      terms, 
      pageNumber, 
      bookNumber, 
      sessionId 
    }: { 
      terms: AIIndexResponse['terms']; 
      pageNumber: number; 
      bookNumber: string;
      sessionId: string;
    }) => {
      const entries = terms.map(term => ({
        word: term.word,
        definition: term.definition,
        notes: term.notes || null,
        page_number: pageNumber,
        book_number: bookNumber,
        color_code: '#10b981', // Green color for AI-generated entries
        created_by_ai: true,
        ai_indexing_session_id: sessionId,
      }));

      const { data, error } = await supabase
        .from('index_entries')
        .insert(entries)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['index_entries'] });
      toast({
        title: "Terms Indexed",
        description: `Successfully indexed ${data.length} terms from the page.`,
      });
    },
    onError: (error) => {
      console.error('Error saving AI terms:', error);
      toast({
        title: "Error",
        description: "Failed to save indexed terms. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoadingSessions,
    createSession: createSession.mutate,
    updateSession: updateSession.mutate,
    indexPageWithAI: indexPageWithAI.mutate,
    saveAITerms: saveAITerms.mutate,
    isCreatingSession: createSession.isPending,
    isUpdatingSession: updateSession.isPending,
    isIndexing: indexPageWithAI.isPending,
    isSavingTerms: saveAITerms.isPending,
  };
};

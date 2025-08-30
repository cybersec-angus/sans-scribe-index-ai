import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type IndexEntry = Tables<'index_entries'>;
type IndexEntryInsert = TablesInsert<'index_entries'>;
type IndexEntryUpdate = TablesUpdate<'index_entries'>;

export const useIndexEntries = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['index_entries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('index_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching index entries:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const createEntry = useMutation({
    mutationFn: async (entry: IndexEntryInsert) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('index_entries')
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['index_entries', user?.id] });
      toast({
        title: "Definition Added",
        description: `"${data.word}" has been successfully indexed.`,
      });
    },
    onError: (error) => {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: "Failed to save definition. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: IndexEntryUpdate }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('index_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['index_entries', user?.id] });
      toast({
        title: "Definition Updated",
        description: `"${data.word}" has been successfully updated.`,
      });
    },
    onError: (error) => {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update definition. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('index_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['index_entries', user?.id] });
      toast({
        title: "Definition Deleted",
        description: "The definition has been removed.",
      });
    },
    onError: (error) => {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete definition. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enhanceWithAI = useMutation({
    mutationFn: async ({ word, definition, openWebUIUrl, apiKey, model = 'llama3.2' }: { 
      word: string; 
      definition: string; 
      openWebUIUrl: string;
      apiKey?: string;
      model?: string;
    }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${openWebUIUrl}/api/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a cybersecurity educator. Enhance cybersecurity definitions with additional context in a single, concise paragraph. Do not use formatting, bullet points, or numbered lists. Provide a flowing narrative that includes practical applications, real-world examples, related concepts, and current industry relevance.'
            },
            {
              role: 'user',
              content: `Enhance this cybersecurity term and definition with additional context:

Term: ${word}
Definition: ${definition}

Provide a concise enhancement in one paragraph without formatting that includes practical applications, real-world examples, related concepts, and current industry relevance.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenWebUI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No enhancement available';
    },
    onSuccess: (enhancement, variables) => {
      toast({
        title: "AI Enhancement Complete",
        description: `Enhanced definition for "${variables.word}" is ready to save.`,
      });
    },
    onError: (error) => {
      console.error('Error enhancing with AI:', error);
      toast({
        title: "AI Enhancement Failed",
        description: "Failed to enhance definition with AI. Please check your OpenWebUI settings.",
        variant: "destructive",
      });
    },
  });

  return {
    entries,
    isLoading,
    createEntry: createEntry.mutate,
    updateEntry: updateEntry.mutate,
    deleteEntry: deleteEntry.mutate,
    enhanceWithAI: enhanceWithAI.mutate,
    isCreating: createEntry.isPending,
    isUpdating: updateEntry.isPending,
    isDeleting: deleteEntry.isPending,
    isEnhancing: enhanceWithAI.isPending,
  };
};

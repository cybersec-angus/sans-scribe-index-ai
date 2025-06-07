
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type IndexEntry = Tables<'index_entries'>;
type IndexEntryInsert = TablesInsert<'index_entries'>;
type IndexEntryUpdate = TablesUpdate<'index_entries'>;

export const useIndexEntries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['index_entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('index_entries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching index entries:', error);
        throw error;
      }
      
      return data;
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: IndexEntryInsert) => {
      const { data, error } = await supabase
        .from('index_entries')
        .insert(entry)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['index_entries'] });
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
      const { data, error } = await supabase
        .from('index_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['index_entries'] });
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
      const { error } = await supabase
        .from('index_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['index_entries'] });
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

  return {
    entries,
    isLoading,
    createEntry: createEntry.mutate,
    updateEntry: updateEntry.mutate,
    deleteEntry: deleteEntry.mutate,
    isCreating: createEntry.isPending,
    isUpdating: updateEntry.isPending,
    isDeleting: deleteEntry.isPending,
  };
};

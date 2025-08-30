
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type UserSettings = Tables<'user_settings'>;

export const useUserSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<TablesUpdate<'user_settings'>>) => {
      if (!user || !settings?.id) throw new Error('No user or settings found');
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString(), user_id: user.id })
        .eq('id', settings.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings', user?.id] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};

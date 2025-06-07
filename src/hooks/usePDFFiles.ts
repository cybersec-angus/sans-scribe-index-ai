
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type PDFFile = Tables<'pdf_files'> & { file_url?: string };
type PDFFileInsert = TablesInsert<'pdf_files'>;

export const usePDFFiles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  const { data: pdfFiles = [], isLoading } = useQuery({
    queryKey: ['pdf_files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('*')
        .order('upload_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching PDF files:', error);
        throw error;
      }
      
      return data;
    },
  });

  const uploadPDFFile = useMutation({
    mutationFn: async (file: File) => {
      console.log('Processing PDF file:', file.name);
      
      // Extract book number from filename (assuming format like "BOOK1.pdf" or similar)
      const bookNumber = file.name.replace(/\.pdf$/i, '').toUpperCase();
      
      const pdfFileData: PDFFileInsert = {
        file_name: file.name,
        book_number: bookNumber,
        file_size: file.size,
      };

      const { data, error } = await supabase
        .from('pdf_files')
        .insert(pdfFileData)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving PDF file:', error);
        throw error;
      }
      
      // Store the actual file for later use
      setUploadedFiles(prev => new Map(prev.set(data.id, file)));
      
      console.log('PDF file saved to database:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pdf_files'] });
      toast({
        title: "PDF Uploaded",
        description: `${data.file_name} has been successfully uploaded and is ready for indexing.`,
      });
    },
    onError: (error) => {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload PDF file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePDFFile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pdf_files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local storage
      setUploadedFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf_files'] });
      toast({
        title: "PDF Deleted",
        description: "PDF file has been removed.",
      });
    },
    onError: (error) => {
      console.error('Error deleting PDF file:', error);
      toast({
        title: "Error",
        description: "Failed to delete PDF file.",
        variant: "destructive",
      });
    },
  });

  const getPDFFile = (id: string): File | undefined => {
    return uploadedFiles.get(id);
  };

  const createPDFUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return {
    pdfFiles,
    isLoading,
    uploadPDFFile: uploadPDFFile.mutate,
    deletePDFFile: deletePDFFile.mutate,
    isUploading: uploadPDFFile.isPending,
    isDeleting: deletePDFFile.isPending,
    getPDFFile,
    createPDFUrl,
  };
};

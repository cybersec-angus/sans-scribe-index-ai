
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type PDFFile = Tables<'pdf_files'> & { file_url?: string };
type PDFFileInsert = TablesInsert<'pdf_files'>;

// Helper functions for file persistence
const storePDFFile = async (id: string, file: File): Promise<void> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    localStorage.setItem(`pdf_${id}`, base64);
    localStorage.setItem(`pdf_${id}_name`, file.name);
    localStorage.setItem(`pdf_${id}_size`, file.size.toString());
    localStorage.setItem(`pdf_${id}_type`, file.type);
  } catch (error) {
    console.error('Error storing PDF file:', error);
  }
};

const retrievePDFFile = (id: string): File | null => {
  try {
    const base64 = localStorage.getItem(`pdf_${id}`);
    const name = localStorage.getItem(`pdf_${id}_name`);
    const size = localStorage.getItem(`pdf_${id}_size`);
    const type = localStorage.getItem(`pdf_${id}_type`);
    
    if (!base64 || !name || !size || !type) {
      return null;
    }
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new File([bytes], name, { type });
  } catch (error) {
    console.error('Error retrieving PDF file:', error);
    return null;
  }
};

const removePDFFile = (id: string): void => {
  localStorage.removeItem(`pdf_${id}`);
  localStorage.removeItem(`pdf_${id}_name`);
  localStorage.removeItem(`pdf_${id}_size`);
  localStorage.removeItem(`pdf_${id}_type`);
};

export const usePDFFiles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  // Load files from localStorage on mount
  useEffect(() => {
    const loadStoredFiles = () => {
      const newMap = new Map<string, File>();
      
      // Get all localStorage keys that match our PDF pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pdf_') && key.endsWith('_name')) {
          const id = key.replace('pdf_', '').replace('_name', '');
          const file = retrievePDFFile(id);
          if (file) {
            newMap.set(id, file);
          }
        }
      }
      
      setUploadedFiles(newMap);
    };

    loadStoredFiles();
  }, []);

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
    mutationFn: async ({ file, courseCode, bookNumber, pageOffset }: {
      file: File;
      courseCode: string;
      bookNumber: string;
      pageOffset: number;
    }) => {
      console.log('Processing PDF file:', file.name, 'Course:', courseCode, 'Book:', bookNumber, 'Offset:', pageOffset);
      
      const pdfFileData: PDFFileInsert = {
        file_name: file.name,
        book_number: bookNumber,
        course_code: courseCode,
        page_offset: pageOffset,
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
      
      // Store the actual file both in memory and localStorage
      setUploadedFiles(prev => new Map(prev.set(data.id, file)));
      await storePDFFile(data.id, file);
      
      console.log('PDF file saved to database and localStorage:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pdf_files'] });
      toast({
        title: "PDF Uploaded",
        description: `${data.file_name} has been successfully uploaded and configured.`,
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
      
      // Remove from both local storage and memory
      setUploadedFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      removePDFFile(id);
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
    // First try to get from memory
    let file = uploadedFiles.get(id);
    
    // If not in memory, try to retrieve from localStorage
    if (!file) {
      file = retrievePDFFile(id) || undefined;
      if (file) {
        // Add back to memory for faster access
        setUploadedFiles(prev => new Map(prev.set(id, file!)));
      }
    }
    
    return file;
  };

  const createPDFUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const uploadPDFWithConfig = (file: File, courseCode: string, bookNumber: string, pageOffset: number) => {
    uploadPDFFile.mutate({ file, courseCode, bookNumber, pageOffset });
  };

  return {
    pdfFiles,
    isLoading,
    uploadPDFFile: uploadPDFWithConfig,
    deletePDFFile: deletePDFFile.mutate,
    isUploading: uploadPDFFile.isPending,
    isDeleting: deletePDFFile.isPending,
    getPDFFile,
    createPDFUrl,
  };
};

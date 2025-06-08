
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type IndexEntry = Tables<'index_entries'>;

interface FlashcardViewerProps {
  entries: IndexEntry[];
  onClose: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ entries, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [shuffledEntries, setShuffledEntries] = useState(entries);

  const currentEntry = shuffledEntries[currentIndex];

  // Fetch PDF file info to get course code
  const { data: pdfFile } = useQuery({
    queryKey: ['pdf_file', currentEntry?.book_number],
    queryFn: async () => {
      if (!currentEntry?.book_number) return null;
      
      const { data, error } = await supabase
        .from('pdf_files')
        .select('course_code')
        .eq('book_number', currentEntry.book_number)
        .single();
      
      if (error) {
        console.error('Error fetching PDF file:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!currentEntry?.book_number,
  });

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledEntries.length);
    setShowDefinition(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledEntries.length) % shuffledEntries.length);
    setShowDefinition(false);
  };

  const shuffleCards = () => {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    setShuffledEntries(shuffled);
    setCurrentIndex(0);
    setShowDefinition(false);
  };

  const resetCards = () => {
    setShuffledEntries(entries);
    setCurrentIndex(0);
    setShowDefinition(false);
  };

  if (!entries.length) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No definitions available for flashcards.</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-foreground">
            <span className="text-sm">Card {currentIndex + 1} of {shuffledEntries.length}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shuffleCards}>
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetCards}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Flashcard */}
        <Card className="h-96 cursor-pointer" onClick={() => setShowDefinition(!showDefinition)}>
          <CardContent className="h-full flex flex-col justify-center items-center p-8 text-center">
            {!showDefinition ? (
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">{currentEntry.word}</h2>
                <p className="text-muted-foreground text-sm">Click to reveal definition</p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Page {currentEntry.page_number} • Book {currentEntry.book_number}{pdfFile?.course_code ? ` • ${pdfFile.course_code}` : ''}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">{currentEntry.word}</h3>
                <p className="text-foreground leading-relaxed">{currentEntry.definition}</p>
                {currentEntry.notes && (
                  <p className="text-sm text-muted-foreground italic">Notes: {currentEntry.notes}</p>
                )}
                {currentEntry.ai_enrichment && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                    {currentEntry.ai_enrichment}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Page {currentEntry.page_number} • Book {currentEntry.book_number}{pdfFile?.course_code ? ` • ${pdfFile.course_code}` : ''}
                </div>
                <p className="text-muted-foreground text-sm">Click to show word</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" onClick={prevCard} disabled={shuffledEntries.length <= 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button 
            onClick={() => setShowDefinition(!showDefinition)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showDefinition ? 'Show Word' : 'Show Definition'}
          </Button>
          <Button variant="outline" onClick={nextCard} disabled={shuffledEntries.length <= 1}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

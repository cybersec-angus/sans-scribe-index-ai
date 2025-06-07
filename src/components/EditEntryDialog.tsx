
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type IndexEntry = Tables<'index_entries'>;

interface EditEntryDialogProps {
  entry: IndexEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<IndexEntry>) => void;
  isUpdating: boolean;
}

export const EditEntryDialog: React.FC<EditEntryDialogProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
  isUpdating
}) => {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [notes, setNotes] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [colorCode, setColorCode] = useState('#fbbf24');

  React.useEffect(() => {
    if (entry) {
      setWord(entry.word);
      setDefinition(entry.definition);
      setNotes(entry.notes || '');
      setBookNumber(entry.book_number);
      setPageNumber(entry.page_number);
      setColorCode(entry.color_code);
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;
    
    onSave(entry.id, {
      word: word.trim(),
      definition: definition.trim(),
      notes: notes.trim() || null,
      book_number: bookNumber.trim(),
      page_number: pageNumber,
      color_code: colorCode,
    });
  };

  const colors = [
    { name: "Yellow", value: "#fbbf24", bg: "bg-yellow-200" },
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-200" },
    { name: "Green", value: "#10b981", bg: "bg-green-200" },
    { name: "Purple", value: "#8b5cf6", bg: "bg-purple-200" },
    { name: "Red", value: "#ef4444", bg: "bg-red-200" },
    { name: "Orange", value: "#f97316", bg: "bg-orange-200" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Definition</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-word">Word</Label>
            <Input
              id="edit-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter word..."
            />
          </div>
          
          <div>
            <Label htmlFor="edit-definition">Definition</Label>
            <Textarea
              id="edit-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter definition..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-book">Book Number</Label>
              <Input
                id="edit-book"
                value={bookNumber}
                onChange={(e) => setBookNumber(e.target.value)}
                placeholder="e.g., SEC401"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-page">Page Number</Label>
              <Input
                id="edit-page"
                type="number"
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label>Color Code</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setColorCode(color.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    colorCode === color.value ? 'border-slate-800' : 'border-slate-200'
                  } ${color.bg}`}
                >
                  <div className="w-full h-4 rounded" style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isUpdating || !word.trim() || !definition.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

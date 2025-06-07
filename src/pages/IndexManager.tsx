
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit2, Save, X, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IndexEntry {
  id: string;
  word: string;
  definition: string;
  pageNumber: number;
  bookNumber: string;
  notes?: string;
  colorCode: string;
  aiEnrichment?: string;
}

const IndexManager = () => {
  const [entries, setEntries] = useState<IndexEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<IndexEntry>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const colors = [
    { name: "All", value: "", bg: "bg-slate-100" },
    { name: "Yellow", value: "#fbbf24", bg: "bg-yellow-200" },
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-200" },
    { name: "Green", value: "#10b981", bg: "bg-green-200" },
    { name: "Purple", value: "#8b5cf6", bg: "bg-purple-200" },
    { name: "Red", value: "#ef4444", bg: "bg-red-200" },
    { name: "Orange", value: "#f97316", bg: "bg-orange-200" },
  ];

  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem('indexEntries') || '[]');
    setEntries(storedEntries);
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.bookNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesColor = !selectedColor || entry.colorCode === selectedColor;
    
    return matchesSearch && matchesColor;
  });

  const startEdit = (entry: IndexEntry) => {
    setEditingEntry(entry.id);
    setEditForm({ ...entry });
  };

  const saveEdit = () => {
    if (!editingEntry || !editForm.word || !editForm.definition) {
      toast({
        title: "Missing Information",
        description: "Word and definition are required.",
        variant: "destructive",
      });
      return;
    }

    const updatedEntries = entries.map(entry => 
      entry.id === editingEntry ? { ...entry, ...editForm } : entry
    );
    
    setEntries(updatedEntries);
    localStorage.setItem('indexEntries', JSON.stringify(updatedEntries));
    setEditingEntry(null);
    setEditForm({});
    
    toast({
      title: "Entry Updated",
      description: "Definition has been successfully updated.",
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('indexEntries', JSON.stringify(updatedEntries));
    
    toast({
      title: "Entry Deleted",
      description: "Definition has been removed from your index.",
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Word', 'Definition', 'Page', 'Book', 'Notes', 'AI Enrichment'],
      ...entries.map(entry => [
        entry.word,
        entry.definition,
        entry.pageNumber.toString(),
        entry.bookNumber,
        entry.notes || '',
        entry.aiEnrichment || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sans-index.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your index has been exported to CSV format.",
    });
  };

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const book = entry.bookNumber;
    if (!acc[book]) acc[book] = [];
    acc[book].push(entry);
    return acc;
  }, {} as Record<string, IndexEntry[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="bg-white/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Index Manager</h1>
              <p className="text-slate-600">{entries.length} total definitions</p>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700"
            disabled={entries.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search Terms</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search words, definitions, or books..."
                />
              </div>
              <div>
                <Label>Filter by Color</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                        selectedColor === color.value ? 'border-slate-800' : 'border-slate-200'
                      } ${color.bg}`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries by Book */}
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([bookNumber, bookEntries]) => (
            <Card key={bookNumber} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <FileText className="h-6 w-6 text-blue-600" />
                  {bookNumber}
                  <Badge variant="secondary" className="ml-auto">
                    {bookEntries.length} definitions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {bookEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                      style={{ borderLeftWidth: '4px', borderLeftColor: entry.colorCode }}
                    >
                      {editingEntry === entry.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Word</Label>
                              <Input
                                value={editForm.word || ''}
                                onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Page Number</Label>
                              <Input
                                type="number"
                                value={editForm.pageNumber || ''}
                                onChange={(e) => setEditForm({ ...editForm, pageNumber: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Definition</Label>
                            <Textarea
                              value={editForm.definition || ''}
                              onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button onClick={cancelEdit} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-slate-900">{entry.word}</h3>
                              <Badge variant="outline" className="text-xs">
                                Page {entry.pageNumber}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => startEdit(entry)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => deleteEntry(entry.id)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-slate-700 mb-3">{entry.definition}</p>
                          {entry.notes && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-600 mb-1">Notes:</p>
                              <p className="text-sm text-slate-600 italic">{entry.notes}</p>
                            </div>
                          )}
                          {entry.aiEnrichment && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-1">AI Enrichment:</p>
                              <p className="text-sm text-blue-700">{entry.aiEnrichment}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No definitions found</h3>
              <p className="text-slate-500">
                {entries.length === 0 
                  ? "Start by uploading and indexing your SANS PDFs." 
                  : "Try adjusting your search or filter criteria."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IndexManager;

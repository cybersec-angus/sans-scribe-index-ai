
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Highlighter, Save, BookOpen } from "lucide-react";
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

const PDFViewer = () => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [selectedText, setSelectedText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDefining, setIsDefining] = useState(false);
  const [definition, setDefinition] = useState("");
  const [notes, setNotes] = useState("");
  const [bookNumber, setBookNumber] = useState("");
  const [colorCode, setColorCode] = useState("#fbbf24");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedPdfUrl = sessionStorage.getItem('currentPDF');
    const storedPdfName = sessionStorage.getItem('currentPDFName');
    
    if (storedPdfUrl && storedPdfName) {
      setPdfUrl(storedPdfUrl);
      setPdfName(storedPdfName);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const colors = [
    { name: "Yellow", value: "#fbbf24", bg: "bg-yellow-200" },
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-200" },
    { name: "Green", value: "#10b981", bg: "bg-green-200" },
    { name: "Purple", value: "#8b5cf6", bg: "bg-purple-200" },
    { name: "Red", value: "#ef4444", bg: "bg-red-200" },
    { name: "Orange", value: "#f97316", bg: "bg-orange-200" },
  ];

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString().trim());
      setIsDefining(true);
      toast({
        title: "Text Selected",
        description: `Selected: "${selection.toString().trim()}"`,
      });
    }
  };

  const generateAIEnrichment = async (word: string): Promise<string> => {
    // Simulate AI enrichment - in real implementation, this would call an AI API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`AI Context: ${word} is commonly used in cybersecurity contexts. Related concepts include network security, threat analysis, and defensive measures.`);
      }, 1000);
    });
  };

  const saveDefinition = async () => {
    if (!selectedText || !definition) {
      toast({
        title: "Missing Information",
        description: "Please select text and provide a definition.",
        variant: "destructive",
      });
      return;
    }

    const aiEnrichment = await generateAIEnrichment(selectedText);

    const newEntry: IndexEntry = {
      id: Date.now().toString(),
      word: selectedText,
      definition,
      pageNumber: currentPage,
      bookNumber: bookNumber || pdfName,
      notes,
      colorCode,
      aiEnrichment,
    };

    // Save to localStorage (in real app, this would be a proper database)
    const existingEntries = JSON.parse(localStorage.getItem('indexEntries') || '[]');
    localStorage.setItem('indexEntries', JSON.stringify([...existingEntries, newEntry]));

    toast({
      title: "Definition Saved",
      description: `Added "${selectedText}" to your index.`,
    });

    // Reset form
    setSelectedText("");
    setDefinition("");
    setNotes("");
    setIsDefining(false);
  };

  const highlightText = () => {
    if (!searchTerm) {
      toast({
        title: "No Search Term",
        description: "Please enter a word to highlight.",
        variant: "destructive",
      });
      return;
    }

    // Simulate highlighting - in real implementation, this would interact with PDF.js
    toast({
      title: "Text Highlighted",
      description: `Highlighted all instances of "${searchTerm}"`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
              <h1 className="text-2xl font-bold text-slate-900">{pdfName}</h1>
              <p className="text-sm text-slate-600">Page {currentPage}</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/index-manager')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Index
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PDF Viewer Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[calc(100vh-200px)]">
              <CardContent className="p-6 h-full">
                <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-lg"
                      onMouseUp={handleTextSelection}
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4" />
                      <p>No PDF loaded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Panel */}
          <div className="space-y-6">
            {/* Search and Highlight */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Search className="h-5 w-5" />
                  Search & Highlight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search-term">Search Term</Label>
                  <Input
                    id="search-term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter word to find..."
                  />
                </div>
                <Button
                  onClick={highlightText}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
                >
                  <Highlighter className="h-4 w-4 mr-2" />
                  Highlight All
                </Button>
              </CardContent>
            </Card>

            {/* Definition Panel */}
            {isDefining && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Define Term</CardTitle>
                  <p className="text-sm text-slate-600">Selected: "{selectedText}"</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="book-number">Book Number</Label>
                    <Input
                      id="book-number"
                      value={bookNumber}
                      onChange={(e) => setBookNumber(e.target.value)}
                      placeholder="e.g., SEC401, SEC503..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="definition">Definition</Label>
                    <Textarea
                      id="definition"
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="Enter the definition..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                      rows={2}
                    />
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

                  <div className="flex gap-2">
                    <Button
                      onClick={saveDefinition}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => setIsDefining(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Navigation */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Page Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

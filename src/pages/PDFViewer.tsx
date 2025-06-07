import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Highlighter, Save, BookOpen, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIndexEntries } from "@/hooks/useIndexEntries";

// React PDF Viewer imports
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import type { HighlightArea } from '@react-pdf-viewer/highlight';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

// Configure pdfjs worker
import * as pdfjs from 'pdfjs-dist';

// Set worker source to use a working CDN with proper CORS headers
pdfjs.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.min.js';

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

interface CustomHighlight {
  id: string;
  content: {
    text: string;
    color: string;
  };
  highlightAreas: HighlightArea[];
}

const PDFViewer = () => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedDefinition, setSelectedDefinition] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageOffset, setPageOffset] = useState(0);
  const [isWaitingForWord, setIsWaitingForWord] = useState(false);
  const [isWaitingForDefinition, setIsWaitingForDefinition] = useState(false);
  const [isDefining, setIsDefining] = useState(false);
  const [definition, setDefinition] = useState("");
  const [notes, setNotes] = useState("");
  const [bookNumber, setBookNumber] = useState("");
  const [colorCode, setColorCode] = useState("#fbbf24");
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [highlights, setHighlights] = useState<CustomHighlight[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entries, createEntry } = useIndexEntries();

  useEffect(() => {
    const storedPdfUrl = sessionStorage.getItem('currentPDF');
    const storedPdfName = sessionStorage.getItem('currentPDFName');
    const storedPageOffset = sessionStorage.getItem('currentPDFPageOffset');
    
    console.log('Stored PDF URL:', storedPdfUrl);
    console.log('Stored PDF Name:', storedPdfName);
    console.log('Stored Page Offset:', storedPageOffset);
    
    if (storedPdfUrl && storedPdfName) {
      setPdfUrl(storedPdfUrl);
      setPdfName(storedPdfName);
      setPageOffset(parseInt(storedPageOffset || '0'));
    } else {
      console.log('No PDF data found in session storage, redirecting to home');
      navigate('/');
    }
  }, [navigate]);

  // PDF Viewer plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const highlightPluginInstance = highlightPlugin();

  const handleHighlightText = (selectedText: string) => {
    if (isWaitingForWord && selectedText) {
      setSelectedWord(selectedText);
      setIsWaitingForWord(false);
      
      toast({
        title: "Word Selected",
        description: `Word: "${selectedText}" - Press 'D' to select definition`,
      });
    } else if (isWaitingForDefinition && selectedText) {
      setSelectedDefinition(selectedText);
      setIsWaitingForDefinition(false);
      setIsDefining(true);
      setDefinition(selectedText);
      
      toast({
        title: "Definition Selected",
        description: `Definition captured. Complete the entry form.`,
      });
    }
  };

  // Add keyboard event listeners for 'W' and 'D' keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'w' && !isWaitingForWord && !isWaitingForDefinition && !isDefining) {
        event.preventDefault();
        setIsWaitingForWord(true);
        toast({
          title: "Waiting for Word",
          description: "Select a word to define in the PDF",
        });
      } else if (event.key.toLowerCase() === 'd' && selectedWord && !isWaitingForDefinition && !isDefining) {
        event.preventDefault();
        setIsWaitingForDefinition(true);
        toast({
          title: "Waiting for Definition",
          description: "Select the definition text in the PDF",
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWaitingForWord, isWaitingForDefinition, isDefining, selectedWord, toast]);

  const colors = [
    { name: "Yellow", value: "#fbbf24", bg: "bg-yellow-200" },
    { name: "Blue", value: "#3b82f6", bg: "bg-blue-200" },
    { name: "Green", value: "#10b981", bg: "bg-green-200" },
    { name: "Purple", value: "#8b5cf6", bg: "bg-purple-200" },
    { name: "Red", value: "#ef4444", bg: "bg-red-200" },
    { name: "Orange", value: "#f97316", bg: "bg-orange-200" },
  ];

  const generateAIEnrichment = async (word: string): Promise<string> => {
    // Simulate AI enrichment - in real implementation, this would call an AI API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`AI Context: ${word} is commonly used in cybersecurity contexts. Related concepts include network security, threat analysis, and defensive measures.`);
      }, 1000);
    });
  };

  const saveDefinition = async () => {
    if (!selectedWord || !definition) {
      toast({
        title: "Missing Information",
        description: "Please select a word and provide a definition.",
        variant: "destructive",
      });
      return;
    }

    const aiEnrichment = await generateAIEnrichment(selectedWord);

    // Calculate actual page number with offset
    const actualPageNumber = Math.max(1, currentPage - pageOffset);

    const newEntry = {
      word: selectedWord,
      definition,
      page_number: actualPageNumber,
      book_number: bookNumber || pdfName,
      notes,
      color_code: colorCode,
      ai_enrichment: aiEnrichment,
    };

    createEntry(newEntry);

    // Reset form
    setSelectedWord("");
    setSelectedDefinition("");
    setDefinition("");
    setNotes("");
    setIsDefining(false);
  };

  const cancelDefining = () => {
    setSelectedWord("");
    setSelectedDefinition("");
    setDefinition("");
    setNotes("");
    setIsDefining(false);
    setIsWaitingForWord(false);
    setIsWaitingForDefinition(false);
  };

  const highlightSearchTerm = () => {
    if (!searchTerm) {
      toast({
        title: "No Search Term",
        description: "Please enter a word to highlight.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Search Feature",
      description: `Use the search feature in the PDF viewer toolbar to find "${searchTerm}"`,
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
              <p className="text-sm text-slate-600">
                Page {currentPage} {pageOffset > 0 && `(Actual: ${Math.max(1, currentPage - pageOffset)})`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDefinitions(!showDefinitions)}
              variant="outline"
              className="bg-white/80"
            >
              <List className="h-4 w-4 mr-2" />
              {showDefinitions ? 'Hide' : 'Show'} Definitions
            </Button>
            <Button
              onClick={() => navigate('/index-manager')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Index
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showDefinitions ? 'grid-cols-1 lg:grid-cols-6' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* PDF Viewer Area */}
          <div className={showDefinitions ? 'lg:col-span-3' : 'lg:col-span-3'}>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[calc(100vh-200px)]">
              <CardContent className="p-6 h-full">
                <div className="h-full">
                  {pdfUrl ? (
                    <Viewer
                      fileUrl={pdfUrl}
                      plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                      onDocumentLoad={(e) => {
                        console.log('PDF loaded with', e.doc.numPages, 'pages');
                      }}
                      onPageChange={(e) => {
                        setCurrentPage(e.currentPage + 1); // PDF viewer is 0-indexed
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-slate-500">
                      <div>
                        <BookOpen className="h-12 w-12 mx-auto mb-4" />
                        <p>Loading PDF...</p>
                        <p className="text-xs mt-2">If this persists, try uploading the PDF again</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Panel */}
          <div className={showDefinitions ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <div className="space-y-6">
              {/* Instructions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-slate-600">1. Press 'W' to start word selection</p>
                  <p className="text-sm text-slate-600">2. Enter a word in the input field</p>
                  <p className="text-sm text-slate-600">3. Press 'D' to select definition</p>
                  <p className="text-sm text-slate-600">4. Enter definition text in the input field</p>
                  <p className="text-sm text-slate-600">5. Complete the form and save</p>
                </CardContent>
              </Card>

              {/* Manual Input for PDF text */}
              {(isWaitingForWord || isWaitingForDefinition) && (
                <Card className="shadow-lg border-0 bg-yellow-50 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-800">
                      {isWaitingForWord ? "Enter Word" : "Enter Definition"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-yellow-700">
                      {isWaitingForWord 
                        ? "Enter the word you want to define:" 
                        : "Enter the definition text:"
                      }
                    </p>
                    <Input
                      placeholder={isWaitingForWord ? "Enter the word here..." : "Enter the definition here..."}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const text = (e.target as HTMLInputElement).value.trim();
                          if (text) {
                            handleHighlightText(text);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-yellow-600">Press Enter to confirm</p>
                  </CardContent>
                </Card>
              )}

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
                    onClick={highlightSearchTerm}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
                  >
                    <Highlighter className="h-4 w-4 mr-2" />
                    Use PDF Search
                  </Button>
                </CardContent>
              </Card>

              {/* Status indicators */}
              {isWaitingForWord && (
                <Card className="shadow-lg border-0 bg-blue-50 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-blue-800">Waiting for word selection...</p>
                    <p className="text-xs text-blue-600">Enter text in the input field above</p>
                  </CardContent>
                </Card>
              )}

              {selectedWord && !isWaitingForDefinition && !isDefining && (
                <Card className="shadow-lg border-0 bg-green-50 border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-green-700 mb-2">Selected word:</p>
                    <p className="font-medium text-green-800 mb-2">"{selectedWord}"</p>
                    <p className="text-xs text-green-600">Press 'D' to select definition</p>
                  </CardContent>
                </Card>
              )}

              {isWaitingForDefinition && (
                <Card className="shadow-lg border-0 bg-orange-50 border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-orange-800">Waiting for definition...</p>
                    <p className="text-xs text-orange-600">Enter text in the input field above</p>
                  </CardContent>
                </Card>
              )}

              {/* Definition Panel */}
              {isDefining && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800">Define Term</CardTitle>
                    <p className="text-sm text-slate-600">Word: "{selectedWord}"</p>
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
                        onClick={cancelDefining}
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
                  {pageOffset > 0 && (
                    <p className="text-xs text-slate-600">
                      Actual page: {Math.max(1, currentPage - pageOffset)} (offset: -{pageOffset})
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Definitions Panel */}
          {showDefinitions && (
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-[calc(100vh-200px)]">
                <CardHeader>
                  <CardTitle className="text-slate-800">Definitions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-full overflow-y-auto">
                  <div className="space-y-4">
                    {entries.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No definitions yet</p>
                      </div>
                    ) : (
                      entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 border rounded-lg bg-white/60 border-l-4"
                          style={{ borderLeftColor: entry.color_code }}
                        >
                          <h4 className="font-semibold text-slate-800 mb-1">{entry.word}</h4>
                          <p className="text-sm text-slate-600 mb-2">{entry.definition}</p>
                          <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Page {entry.page_number}</span>
                            <span>{entry.book_number}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

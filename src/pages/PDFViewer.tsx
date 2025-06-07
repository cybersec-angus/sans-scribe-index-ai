import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Highlighter, Save, BookOpen, List, Edit, Trash2, Brain, Sparkles, Wifi, WifiOff, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIndexEntries } from "@/hooks/useIndexEntries";
import { usePDFFiles } from "@/hooks/usePDFFiles";
import { cleanSelectedText } from "@/utils/textProcessor";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { EditEntryDialog } from "@/components/EditEntryDialog";

// React PDF Viewer imports
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { HighlightArea, RenderHighlightTargetProps } from '@react-pdf-viewer/highlight';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

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

interface AIModel {
  id: string;
  name: string;
  object: string;
  created: number;
  owned_by: string;
}

const PDFViewer = () => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfId, setPdfId] = useState<string>("");
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
  
  // New state for editing and flashcards
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // AI Enhancement state
  const [openWebUIUrl, setOpenWebUIUrl] = useState("http://localhost:3000");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [aiEnhancement, setAiEnhancement] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [debugResponse, setDebugResponse] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { entries, createEntry, updateEntry, deleteEntry, enhanceWithAI, isUpdating, isEnhancing } = useIndexEntries();
  const { getPDFFile, createPDFUrl } = usePDFFiles();

  useEffect(() => {
    const loadPDF = () => {
      // First try to get from session storage (for immediate navigation)
      let storedPdfUrl = sessionStorage.getItem('currentPDF');
      let storedPdfName = sessionStorage.getItem('currentPDFName');
      let storedPdfId = sessionStorage.getItem('currentPDFId');
      let storedPageOffset = sessionStorage.getItem('currentPDFPageOffset');
      
      // If not in session storage, try to restore from the first available PDF
      if (!storedPdfUrl || !storedPdfId) {
        // Try to get PDF ID from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const urlPdfId = urlParams.get('pdfId');
        
        if (urlPdfId) {
          storedPdfId = urlPdfId;
        }
      }
      
      if (storedPdfId) {
        const file = getPDFFile(storedPdfId);
        if (file) {
          const url = createPDFUrl(file);
          setPdfUrl(url);
          setPdfName(storedPdfName || file.name);
          setPdfId(storedPdfId);
          setPageOffset(parseInt(storedPageOffset || '0'));
          
          // Update session storage with current values
          sessionStorage.setItem('currentPDF', url);
          sessionStorage.setItem('currentPDFName', file.name);
          sessionStorage.setItem('currentPDFId', storedPdfId);
          
          console.log('PDF loaded from persistent storage:', file.name);
          return;
        }
      }
      
      if (storedPdfUrl && storedPdfName && storedPdfId) {
        setPdfUrl(storedPdfUrl);
        setPdfName(storedPdfName);
        setPdfId(storedPdfId);
        setPageOffset(parseInt(storedPageOffset || '0'));
        console.log('PDF loaded from session storage:', storedPdfName);
      } else {
        console.log('No PDF data found, redirecting to home');
        navigate('/');
      }
    };

    loadPDF();
  }, [navigate, getPDFFile, createPDFUrl]);

  // PDF Viewer plugins with proper highlight and search handling
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const searchPluginInstance = searchPlugin();
  
  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        position: 'absolute',
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: 'translate(0, 8px)',
        zIndex: 1000,
        padding: '4px',
        gap: '4px'
      }}
    >
      <Button
        size="sm"
        onClick={() => {
          handleHighlightText();
          props.cancel();
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 h-7"
      >
        Select Text
      </Button>
      <Button
        size="sm"
        onClick={props.cancel}
        variant="outline"
        className="text-xs px-2 py-1 h-7"
      >
        Cancel
      </Button>
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
  });

  // Enhanced function to get native text selection
  const handleHighlightText = async () => {
    console.log('handleHighlightText called');
    
    try {
      // Get the current text selection from the browser
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        toast({
          title: "No Text Selected",
          description: "Please select some text first",
          variant: "destructive",
        });
        return;
      }

      // Get the selected text directly from the selection
      const selectedText = selection.toString();
      console.log('Raw selected text from selection:', selectedText);
      
      if (!selectedText.trim()) {
        toast({
          title: "No Text Selected",
          description: "Please select some text first",
          variant: "destructive",
        });
        return;
      }

      // Copy to clipboard and read back to ensure we get the cleanest version
      await navigator.clipboard.writeText(selectedText);
      const clipboardText = await navigator.clipboard.readText();
      console.log('Text from clipboard (native format):', clipboardText);
      
      // Use the clipboard version as it will be properly formatted
      const cleanedText = clipboardText.trim();
      console.log('Final cleaned text from clipboard:', cleanedText);
      
      if (isWaitingForWord && cleanedText) {
        setSelectedWord(cleanedText);
        setIsWaitingForWord(false);
        
        toast({
          title: "Word Selected",
          description: `Word: "${cleanedText}" - Press 'D' to select definition`,
        });
      } else if (isWaitingForDefinition && cleanedText) {
        setSelectedDefinition(cleanedText);
        setIsWaitingForDefinition(false);
        setIsDefining(true);
        setDefinition(cleanedText);
        
        toast({
          title: "Definition Selected",
          description: `Definition captured. Complete the entry form.`,
        });
      }
    } catch (error) {
      console.error('Text selection failed:', error);
      
      toast({
        title: "Selection Failed",
        description: "Please try selecting the text again",
        variant: "destructive",
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
          description: "Select text in the PDF to define it",
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

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('unknown');
    setDebugResponse("");
    setAvailableModels([]);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${openWebUIUrl}/api/models`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setDebugResponse(JSON.stringify(data, null, 2));
      
      // Extract models from the response
      if (data.data && Array.isArray(data.data)) {
        const models = data.data.map((model: AIModel) => ({
          id: model.id,
          name: model.name || model.id,
          object: model.object,
          created: model.created,
          owned_by: model.owned_by
        }));
        
        setAvailableModels(models);
        
        // Set the first model as selected if none is selected
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0].id);
        }
      }
      
      setConnectionStatus('connected');
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to OpenWebUI server. Found ${data.data?.length || 0} models.`,
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setDebugResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('failed');
      
      toast({
        title: "Connection Failed",
        description: "Could not connect to OpenWebUI server. Check your URL and settings.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAIEnhancement = async () => {
    if (!selectedWord || !definition) {
      toast({
        title: "Missing Information",
        description: "Please select a word and provide a definition first.",
        variant: "destructive",
      });
      return;
    }

    if (!openWebUIUrl.trim()) {
      toast({
        title: "Missing OpenWebUI URL",
        description: "Please provide your OpenWebUI server URL.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No Model Selected",
        description: "Please test the connection and select a model first.",
        variant: "destructive",
      });
      return;
    }

    enhanceWithAI({
      word: selectedWord,
      definition: definition,
      openWebUIUrl: openWebUIUrl.trim(),
      apiKey: apiKey.trim() || undefined,
      model: selectedModel,
    }, {
      onSuccess: (enhancement, variables) => {
        setAiEnhancement(enhancement);
        setDebugResponse(`Enhancement successful for "${variables.word}"`);
      },
      onError: (error) => {
        setDebugResponse(`Enhancement error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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

    // Calculate actual page number with offset
    const actualPageNumber = Math.max(1, currentPage - pageOffset);

    const newEntry = {
      word: selectedWord,
      definition,
      page_number: actualPageNumber,
      book_number: bookNumber || pdfName,
      notes,
      color_code: colorCode,
      ai_enrichment: aiEnhancement || undefined,
    };

    createEntry(newEntry);

    // Reset form
    setSelectedWord("");
    setSelectedDefinition("");
    setDefinition("");
    setNotes("");
    setAiEnhancement("");
    setIsDefining(false);
  };

  const cancelDefining = () => {
    setSelectedWord("");
    setSelectedDefinition("");
    setDefinition("");
    setNotes("");
    setAiEnhancement("");
    setIsDefining(false);
    setIsWaitingForWord(false);
    setIsWaitingForDefinition(false);
  };

  const performSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "No Search Term",
        description: "Please enter a word to search for.",
        variant: "destructive",
      });
      return;
    }

    // The search plugin automatically handles keyword highlighting through the UI
    // We just need to update the search term and let the user know
    toast({
      title: "Search Initiated",
      description: `Use the search box in the PDF toolbar (🔍) to perform the actual search and navigate through results`,
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
    toast({
      title: "Search Cleared",
      description: "Search term cleared. Use the PDF toolbar to clear any active searches.",
    });
  };

  // New functions for editing
  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleUpdateEntry = (id: string, updates: any) => {
    updateEntry({ id, updates });
    setShowEditDialog(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this definition?')) {
      deleteEntry(id);
    }
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
              onClick={() => setShowFlashcards(true)}
              variant="outline"
              className="bg-white/80"
              disabled={entries.length === 0}
            >
              <Brain className="h-4 w-4 mr-2" />
              Flashcards
            </Button>
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
                    <Worker workerUrl="/pdf.worker.min.js">
                      <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayoutPluginInstance, highlightPluginInstance, searchPluginInstance]}
                        onDocumentLoad={(e) => {
                          console.log('PDF loaded with', e.doc.numPages, 'pages');
                        }}
                        onPageChange={(e) => {
                          setCurrentPage(e.currentPage + 1); // PDF viewer is 0-indexed
                        }}
                      />
                    </Worker>
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
                  <p className="text-sm text-slate-600">2. Select text in the PDF directly</p>
                  <p className="text-sm text-slate-600">3. Press 'D' to select definition</p>
                  <p className="text-sm text-slate-600">4. Select definition text in the PDF</p>
                  <p className="text-sm text-slate-600">5. Complete the form and save</p>
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Sparkles className="h-5 w-5" />
                    AI Enhancement Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="openwebui-url">OpenWebUI Server URL</Label>
                    <Input
                      id="openwebui-url"
                      value={openWebUIUrl}
                      onChange={(e) => setOpenWebUIUrl(e.target.value)}
                      placeholder="http://localhost:3000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key (Optional)</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter API key if required"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model-select">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={availableModels.length === 0}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder={availableModels.length === 0 ? "Test connection to load models" : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableModels.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {availableModels.length} model(s) available
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={testConnection}
                      variant="outline"
                      size="sm"
                      disabled={isTestingConnection || !openWebUIUrl.trim()}
                      className="flex-1"
                    >
                      {isTestingConnection ? (
                        <>Loading...</>
                      ) : connectionStatus === 'connected' ? (
                        <>
                          <Wifi className="h-4 w-4 mr-2" />
                          Connected
                        </>
                      ) : connectionStatus === 'failed' ? (
                        <>
                          <WifiOff className="h-4 w-4 mr-2" />
                          Failed
                        </>
                      ) : (
                        <>
                          <Wifi className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDebug(!showDebug)}
                      variant="outline"
                      size="sm"
                    >
                      <Bug className="h-4 w-4" />
                    </Button>
                  </div>
                  {showDebug && debugResponse && (
                    <div className="mt-2">
                      <Label>Debug Response</Label>
                      <Textarea
                        value={debugResponse}
                        readOnly
                        rows={4}
                        className="bg-slate-50 text-xs font-mono"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Search */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Search className="h-5 w-5" />
                    Search PDF
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          performSearch();
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={performSearch}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!searchTerm.trim()}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button
                      onClick={clearSearch}
                      variant="outline"
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Use the search box in the PDF toolbar (🔍) to perform the actual search and navigate through results
                  </p>
                </CardContent>
              </Card>

              {/* Manual Input for PDF text */}
              {(isWaitingForWord || isWaitingForDefinition) && (
                <Card className="shadow-lg border-0 bg-yellow-50 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-800">
                      {isWaitingForWord ? "Select Word in PDF" : "Select Definition in PDF"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-yellow-700">
                      {isWaitingForWord 
                        ? "Select text in the PDF above to capture the word you want to define" 
                        : "Select text in the PDF above to capture the definition"
                      }
                    </p>
                    <p className="text-xs text-yellow-600">
                      Or enter manually below as fallback:
                    </p>
                    <Input
                      placeholder={isWaitingForWord ? "Enter the word here..." : "Enter the definition here..."}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const text = (e.target as HTMLInputElement).value.trim();
                          if (text) {
                            handleHighlightText();
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-yellow-600">Press Enter to confirm manual input</p>
                  </CardContent>
                </Card>
              )}

              {/* Status indicators */}
              {isWaitingForWord && (
                <Card className="shadow-lg border-0 bg-blue-50 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-blue-800">Waiting for word selection...</p>
                    <p className="text-xs text-blue-600">Select text in the PDF or use manual input</p>
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
                    <p className="text-xs text-orange-600">Select text in the PDF or use manual input</p>
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

                    {/* AI Enhancement Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>AI Enhancement</Label>
                        <Button
                          onClick={handleAIEnhancement}
                          variant="outline"
                          size="sm"
                          disabled={isEnhancing || !selectedWord || !definition || !selectedModel}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                        </Button>
                      </div>
                      {aiEnhancement && (
                        <Textarea
                          value={aiEnhancement}
                          onChange={(e) => setAiEnhancement(e.target.value)}
                          placeholder="AI enhancement will appear here..."
                          rows={4}
                          className="bg-blue-50"
                        />
                      )}
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

          {/* Definitions Panel with Edit/Delete buttons */}
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
                          {entry.ai_enrichment && (
                            <div className="bg-blue-50 p-2 rounded mb-2">
                              <p className="text-xs font-medium text-blue-800 mb-1">AI Enhancement:</p>
                              <p className="text-xs text-blue-700">{entry.ai_enrichment}</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                            <span>Page {entry.page_number}</span>
                            <span>{entry.book_number}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEntry(entry)}
                              className="text-xs px-2 py-1 h-6"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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

      {/* Flashcard Viewer */}
      {showFlashcards && (
        <FlashcardViewer
          entries={entries}
          onClose={() => setShowFlashcards(false)}
        />
      )}

      {/* Edit Dialog */}
      <EditEntryDialog
        entry={editingEntry}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingEntry(null);
        }}
        onSave={handleUpdateEntry}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default PDFViewer;

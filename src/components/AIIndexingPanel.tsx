import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Play, Pause, Square, Zap, AlertCircle, Settings, TestTube, Save } from 'lucide-react';
import { useAIIndexing } from '@/hooks/useAIIndexing';
import { usePDFFiles } from '@/hooks/usePDFFiles';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface AIIndexingPanelProps {
  pdfId: string;
  pdfName: string;
  bookNumber: string;
  currentPage: number;
  pageOffset: number;
  onExtractText: (pageNumber: number) => Promise<string>;
}

export const AIIndexingPanel: React.FC<AIIndexingPanelProps> = ({
  pdfId,
  pdfName,
  bookNumber,
  currentPage,
  pageOffset,
  onExtractText,
}) => {
  const { toast } = useToast();
  const { settings, updateSettings, isUpdating } = useUserSettings();
  
  // Handle the case where the new OpenWebUI fields might not exist yet
  const getSettingValue = (key: string, defaultValue: string = '') => {
    return (settings as any)?.[key] || defaultValue;
  };
  
  const [localOpenWebUIUrl, setLocalOpenWebUIUrl] = useState(getSettingValue('openwebui_url', ''));
  const [localApiKey, setLocalApiKey] = useState(getSettingValue('openwebui_api_key', ''));
  const [localSelectedModel, setLocalSelectedModel] = useState(getSettingValue('openwebui_model', ''));
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);
  
  const [startPage, setStartPage] = useState(currentPage);
  const [endPage, setEndPage] = useState(currentPage);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);

  const {
    createSession,
    updateSession,
    indexPageWithAI,
    saveAITerms,
    isCreatingSession,
    isIndexing,
    isSavingTerms,
  } = useAIIndexing();

  // Update local state when settings change
  React.useEffect(() => {
    if (settings) {
      setLocalOpenWebUIUrl(getSettingValue('openwebui_url', ''));
      setLocalApiKey(getSettingValue('openwebui_api_key', ''));
      setLocalSelectedModel(getSettingValue('openwebui_model', ''));
    }
  }, [settings]);

  const handleSaveSettings = () => {
    const updates: any = {
      openwebui_url: localOpenWebUIUrl.trim(),
      openwebui_api_key: localApiKey.trim(),
      openwebui_model: localSelectedModel,
    };

    updateSettings(updates);
  };

  const handleTestConnection = async () => {
    if (!localOpenWebUIUrl.trim()) {
      toast({
        title: "Configuration Required",
        description: "Please enter the OpenWebUI URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (localApiKey.trim()) {
        headers['Authorization'] = `Bearer ${localApiKey.trim()}`;
      }

      const response = await fetch(`${localOpenWebUIUrl.trim()}/api/models`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        setConnectionTestResult('success');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to OpenWebUI.",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTestResult('error');
      toast({
        title: "Connection Failed",
        description: `Failed to connect to OpenWebUI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleStartIndexing = async () => {
    if (!localOpenWebUIUrl.trim() || !localSelectedModel) {
      return;
    }

    const totalPagesToProcess = endPage - startPage + 1;
    setTotalPages(totalPagesToProcess);
    setProcessedPages(0);
    setIsProcessing(true);

    // Create a new AI indexing session
    createSession({
      pdf_file_id: pdfId,
      start_page: startPage,
      current_page: startPage,
      total_pages_processed: 0,
      status: 'in_progress',
    }, {
      onSuccess: async (session) => {
        setActiveSession(session);
        await processPages(session, startPage, endPage);
      },
      onError: () => {
        setIsProcessing(false);
      }
    });
  };

  const processPages = async (session: any, start: number, end: number) => {
    try {
      for (let pageNum = start; pageNum <= end; pageNum++) {
        if (!isProcessing) break;

        console.log(`Processing page ${pageNum}...`);
        
        // Extract text from the page
        const pageText = await onExtractText(pageNum);
        
        if (!pageText.trim()) {
          console.log(`Page ${pageNum} has no text, skipping...`);
          continue;
        }

        setExtractedText(pageText);

        // Calculate actual page number with offset
        const actualPageNumber = Math.max(1, pageNum - pageOffset);

        // Send to AI for indexing
        await new Promise<void>((resolve, reject) => {
          indexPageWithAI({
            pageText,
            pageNumber: actualPageNumber,
            bookNumber,
            openWebUIUrl: localOpenWebUIUrl.trim(),
            apiKey: localApiKey.trim(),
            model: localSelectedModel,
          }, {
            onSuccess: async (aiResponse) => {
              if (aiResponse.terms && aiResponse.terms.length > 0) {
                // Save the AI-generated terms
                await new Promise<void>((saveResolve, saveReject) => {
                  saveAITerms({
                    terms: aiResponse.terms,
                    pageNumber: actualPageNumber,
                    bookNumber,
                    sessionId: session.id,
                  }, {
                    onSuccess: () => {
                      console.log(`Successfully indexed ${aiResponse.terms.length} terms from page ${pageNum}`);
                      saveResolve();
                    },
                    onError: saveReject
                  });
                });
              }
              resolve();
            },
            onError: reject
          });
        });

        // Update progress
        const newProcessedCount = pageNum - start + 1;
        setProcessedPages(newProcessedCount);

        // Update session progress
        updateSession({
          id: session.id,
          updates: {
            current_page: pageNum,
            total_pages_processed: newProcessedCount,
          }
        });

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Mark session as completed
      updateSession({
        id: session.id,
        updates: {
          status: 'completed',
        }
      });

      setIsProcessing(false);
      setActiveSession(null);
      
    } catch (error) {
      console.error('Error during AI indexing:', error);
      
      // Mark session as failed
      if (session) {
        updateSession({
          id: session.id,
          updates: {
            status: 'failed',
          }
        });
      }
      
      setIsProcessing(false);
      setActiveSession(null);
    }
  };

  const handleStopIndexing = () => {
    setIsProcessing(false);
    if (activeSession) {
      updateSession({
        id: activeSession.id,
        updates: {
          status: 'paused',
        }
      });
      setActiveSession(null);
    }
  };

  const handleIndexCurrentPage = async () => {
    if (!localOpenWebUIUrl.trim() || !localSelectedModel) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Extract text from current page
      const pageText = await onExtractText(currentPage);
      setExtractedText(pageText);
      
      if (!pageText.trim()) {
        console.log('Current page has no text to index');
        setIsProcessing(false);
        return;
      }

      // Calculate actual page number with offset
      const actualPageNumber = Math.max(1, currentPage - pageOffset);

      // Send to AI for indexing
      indexPageWithAI({
        pageText,
        pageNumber: actualPageNumber,
        bookNumber,
        openWebUIUrl: localOpenWebUIUrl.trim(),
        apiKey: localApiKey.trim(),
        model: localSelectedModel,
      }, {
        onSuccess: async (aiResponse) => {
          if (aiResponse.terms && aiResponse.terms.length > 0) {
            // Create a quick session for this single page
            createSession({
              pdf_file_id: pdfId,
              start_page: currentPage,
              current_page: currentPage,
              total_pages_processed: 1,
              status: 'completed',
            }, {
              onSuccess: (session) => {
                saveAITerms({
                  terms: aiResponse.terms,
                  pageNumber: actualPageNumber,
                  bookNumber,
                  sessionId: session.id,
                });
              }
            });
          }
          setIsProcessing(false);
        },
        onError: () => {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Error indexing current page:', error);
      setIsProcessing(false);
    }
  };

  const isConfigured = localOpenWebUIUrl.trim() && localSelectedModel;
  const canStartBatch = isConfigured && startPage <= endPage && !isProcessing;
  const canIndexCurrent = isConfigured && !isProcessing;
  const hasUnsavedChanges = 
    localOpenWebUIUrl !== getSettingValue('openwebui_url', '') ||
    localApiKey !== getSettingValue('openwebui_api_key', '') ||
    localSelectedModel !== getSettingValue('openwebui_model', '');

  return (
    <Card className="shadow-lg border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Brain className="h-5 w-5" />
          AI Page Indexing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Section */}
        <div className="space-y-3 p-4 border rounded-lg bg-background/50">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            OpenWebUI Configuration
          </Label>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="openwebui-url">OpenWebUI URL</Label>
              <Input
                id="openwebui-url"
                placeholder="http://localhost:3000 or https://your-openwebui.com"
                value={localOpenWebUIUrl}
                onChange={(e) => setLocalOpenWebUIUrl(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Your OpenWebUI API key (if required)"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <Label htmlFor="model-select">AI Model</Label>
              <Select 
                value={localSelectedModel} 
                onValueChange={setLocalSelectedModel}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama3.2">Llama 3.2</SelectItem>
                  <SelectItem value="llama3.1">Llama 3.1</SelectItem>
                  <SelectItem value="llama3">Llama 3</SelectItem>
                  <SelectItem value="mixtral">Mixtral</SelectItem>
                  <SelectItem value="codellama">CodeLlama</SelectItem>
                  <SelectItem value="phi3">Phi-3</SelectItem>
                  <SelectItem value="gemma2">Gemma 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={!localOpenWebUIUrl.trim() || isTestingConnection}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              
              <Button
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges || isUpdating}
                size="sm"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>

            {connectionTestResult && (
              <Alert className={connectionTestResult === 'success' ? 'border-green-500' : 'border-red-500'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {connectionTestResult === 'success' 
                    ? 'Connection successful! You can now use AI indexing.' 
                    : 'Connection failed. Please check your URL and try again.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please configure your OpenWebUI settings above and test the connection before using AI indexing.
            </AlertDescription>
          </Alert>
        )}

        {/* Single Page Indexing */}
        <div className="space-y-3 p-4 border rounded-lg bg-background/50">
          <Label className="text-base font-semibold">Quick Index Current Page</Label>
          <Button
            onClick={handleIndexCurrentPage}
            disabled={!canIndexCurrent}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isProcessing ? 'Indexing...' : `Index Page ${currentPage}`}
          </Button>
          {!isConfigured && (
            <p className="text-xs text-muted-foreground">
              Configure OpenWebUI settings above to enable this feature
            </p>
          )}
        </div>

        {/* Batch Indexing Section */}
        <div className="space-y-3 p-4 border rounded-lg bg-background/50">
          <Label className="text-base font-semibold">Batch Indexing</Label>
          
          {/* Page Range Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-page">Start Page</Label>
              <Input
                id="start-page"
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                min="1"
                disabled={isProcessing}
              />
            </div>
            <div>
              <Label htmlFor="end-page">End Page</Label>
              <Input
                id="end-page"
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                min="1"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Progress Display */}
          {isProcessing && totalPages > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{processedPages} of {totalPages} pages</span>
              </div>
              <Progress value={(processedPages / totalPages) * 100} />
            </div>
          )}

          {/* Main Start Indexing Button */}
          <div className="flex gap-2">
            {!isProcessing ? (
              <Button
                onClick={handleStartIndexing}
                disabled={!canStartBatch}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start AI Indexing
              </Button>
            ) : (
              <Button
                onClick={handleStopIndexing}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Indexing
              </Button>
            )}
          </div>
          
          {!isConfigured && (
            <p className="text-xs text-muted-foreground">
              Configure OpenWebUI settings above to enable batch indexing
            </p>
          )}
        </div>

        {/* Debug: Show extracted text */}
        {extractedText && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtractedText(!showExtractedText)}
            >
              {showExtractedText ? 'Hide' : 'Show'} Extracted Text
            </Button>
            {showExtractedText && (
              <Textarea
                value={extractedText}
                readOnly
                rows={6}
                className="bg-muted text-xs font-mono"
                placeholder="Extracted text will appear here..."
              />
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>• AI will identify key terms likely to appear on exams</p>
          <p>• Definitions will be kept to 2 sentences maximum</p>
          <p>• Terms are automatically added with green highlighting</p>
        </div>
      </CardContent>
    </Card>
  );
};

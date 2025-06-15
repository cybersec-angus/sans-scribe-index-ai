
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Play, Pause, Square, Zap, AlertCircle } from 'lucide-react';
import { useAIIndexing } from '@/hooks/useAIIndexing';
import { usePDFFiles } from '@/hooks/usePDFFiles';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIIndexingPanelProps {
  pdfId: string;
  pdfName: string;
  bookNumber: string;
  currentPage: number;
  pageOffset: number;
  openWebUIUrl: string;
  apiKey: string;
  selectedModel: string;
  onExtractText: (pageNumber: number) => Promise<string>;
}

export const AIIndexingPanel: React.FC<AIIndexingPanelProps> = ({
  pdfId,
  pdfName,
  bookNumber,
  currentPage,
  pageOffset,
  openWebUIUrl,
  apiKey,
  selectedModel,
  onExtractText,
}) => {
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

  const handleStartIndexing = async () => {
    if (!openWebUIUrl.trim() || !selectedModel) {
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
            openWebUIUrl,
            apiKey,
            model: selectedModel,
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
    if (!openWebUIUrl.trim() || !selectedModel) {
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
        openWebUIUrl,
        apiKey,
        model: selectedModel,
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

  const isConfigured = openWebUIUrl.trim() && selectedModel;
  const canStartBatch = isConfigured && startPage <= endPage && !isProcessing;
  const canIndexCurrent = isConfigured && !isProcessing;

  return (
    <Card className="shadow-lg border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Brain className="h-5 w-5" />
          AI Page Indexing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please configure your OpenWebUI settings and test the connection before using AI indexing.
            </AlertDescription>
          </Alert>
        )}

        {/* Single Page Indexing */}
        <div className="space-y-2">
          <Label>Quick Index Current Page</Label>
          <Button
            onClick={handleIndexCurrentPage}
            disabled={!canIndexCurrent}
            className="w-full"
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isProcessing ? 'Indexing...' : `Index Page ${currentPage}`}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-sm font-medium">Batch Indexing</Label>
        </div>

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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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

        <div className="text-xs text-muted-foreground">
          <p>• AI will identify key terms likely to appear on exams</p>
          <p>• Definitions will be kept to 2 sentences maximum</p>
          <p>• Terms are automatically added with green highlighting</p>
        </div>
      </CardContent>
    </Card>
  );
};

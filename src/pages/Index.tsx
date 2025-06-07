
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, BookOpen, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useIndexEntries } from "@/hooks/useIndexEntries";
import { usePDFFiles } from "@/hooks/usePDFFiles";
import { PDFUploadForm } from "@/components/PDFUploadForm";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { settings, updateSettings, isUpdating } = useUserSettings();
  const { entries } = useIndexEntries();
  const { pdfFiles, uploadPDFFile, deletePDFFile, isUploading, getPDFFile, createPDFUrl } = usePDFFiles();

  const handleRemovePDF = (pdfId: string) => {
    deletePDFFile(pdfId);
  };

  const handleStartIndexing = () => {
    if (pdfFiles.length === 0) {
      toast({
        title: "No PDFs Available",
        description: "Please upload at least one PDF file before starting indexing.",
        variant: "destructive",
      });
      return;
    }

    // Get the first PDF file for now (you could enhance this to let users select which PDF)
    const firstPDF = pdfFiles[0];
    const file = getPDFFile(firstPDF.id);
    
    if (!file) {
      toast({
        title: "PDF File Not Found",
        description: "The PDF file is no longer available. Please re-upload the file.",
        variant: "destructive",
      });
      return;
    }

    // Create a URL for the PDF and store it for the PDF viewer
    const pdfUrl = createPDFUrl(file);
    sessionStorage.setItem('currentPDF', pdfUrl);
    sessionStorage.setItem('currentPDFName', firstPDF.file_name);
    sessionStorage.setItem('currentPDFId', firstPDF.id);
    sessionStorage.setItem('currentPDFPageOffset', String(firstPDF.page_offset || 0));
    
    navigate('/pdf-viewer');
  };

  const handleWatermarkUpdate = (field: 'watermark_email' | 'watermark_timestamp', value: string) => {
    if (!settings) return;
    
    updateSettings({
      [field]: value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            SANS Course Material Indexer
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Upload your SANS PDF course materials and create a comprehensive, searchable index 
            of definitions with AI-powered enrichment and smart organization.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pdfFiles.length}</p>
                  <p className="text-sm text-slate-600">PDFs Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
                  <p className="text-sm text-slate-600">Definitions Indexed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">Ready</p>
                  <p className="text-sm text-slate-600">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <PDFUploadForm
            onUpload={uploadPDFFile}
            isUploading={isUploading}
            uploadedFiles={pdfFiles}
            onRemove={handleRemovePDF}
          />

          {/* Settings Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Settings className="h-6 w-6 text-purple-600" />
                Watermark Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="watermark-email">Email (from PDF watermark)</Label>
                <Input
                  id="watermark-email"
                  value={settings?.watermark_email || ''}
                  onChange={(e) => handleWatermarkUpdate('watermark_email', e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1"
                  disabled={isUpdating}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Enter the email shown in your SANS PDF watermarks
                </p>
              </div>

              <div>
                <Label htmlFor="watermark-timestamp">Timestamp Pattern</Label>
                <Input
                  id="watermark-timestamp"
                  value={settings?.watermark_timestamp || ''}
                  onChange={(e) => handleWatermarkUpdate('watermark_timestamp', e.target.value)}
                  placeholder="timestamp"
                  className="mt-1"
                  disabled={isUpdating}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Enter the timestamp pattern from your SANS PDF watermarks
                </p>
              </div>

              {isUpdating && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Saving settings...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleStartIndexing}
            className="mr-4 bg-blue-600 hover:bg-blue-700"
            disabled={pdfFiles.length === 0}
          >
            Start Indexing PDFs
          </Button>
          
          <Button
            onClick={() => navigate('/index-manager')}
            variant="outline"
            size="lg"
            className="bg-white/80 border-slate-200 hover:bg-white"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            View Index Manager
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

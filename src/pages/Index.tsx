
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Settings, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useIndexEntries } from "@/hooks/useIndexEntries";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { settings, updateSettings, isUpdating } = useUserSettings();
  const { entries } = useIndexEntries();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    toast({
      title: "Files Uploaded",
      description: `${selectedFiles.length} PDF file(s) uploaded successfully.`,
    });
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
                  <p className="text-2xl font-bold text-slate-900">{files.length}</p>
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
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Upload className="h-6 w-6 text-blue-600" />
                Upload PDF Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="pdf-upload" className="text-base font-medium">
                  Select SANS Course PDFs
                </Label>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Upload multiple PDF files from your SANS course materials
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">Uploaded Files:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate('/pdf-viewer')}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={files.length === 0}
              >
                Start Indexing PDFs
              </Button>
            </CardContent>
          </Card>

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

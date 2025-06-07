
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, BookOpen, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [watermarkEmail, setWatermarkEmail] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Please upload only PDF files.",
        variant: "destructive",
      });
    }
    
    setUploadedFiles(prev => [...prev, ...pdfFiles]);
    
    if (pdfFiles.length > 0) {
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${pdfFiles.length} PDF file(s).`,
      });
    }
  };

  const openPDFViewer = (file: File) => {
    // Store file in sessionStorage for PDF viewer
    const fileURL = URL.createObjectURL(file);
    sessionStorage.setItem('currentPDF', fileURL);
    sessionStorage.setItem('currentPDFName', file.name);
    sessionStorage.setItem('watermarkEmail', watermarkEmail);
    navigate('/pdf-viewer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            SANS Material Indexer
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload and index your SANS course PDFs with intelligent text scanning and definition management
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Upload Section */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Upload className="h-6 w-6 text-blue-600" />
                Upload PDF Files
              </CardTitle>
              <CardDescription>
                Upload your SANS course material PDFs to begin indexing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <Input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-800">
                        Click to upload PDF files
                      </p>
                      <p className="text-sm text-slate-500">
                        or drag and drop your SANS course materials here
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-slate-800">Uploaded Files:</h3>
                  <div className="grid gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span className="font-medium text-slate-700">{file.name}</span>
                          <span className="text-sm text-slate-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          onClick={() => openPDFViewer(file)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings and Actions */}
          <div className="space-y-6">
            {/* Watermark Settings */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <Settings className="h-5 w-5 text-slate-600" />
                  Watermark Settings
                </CardTitle>
                <CardDescription>
                  Configure watermark filtering for your PDFs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="watermark-email" className="text-sm font-medium text-slate-700">
                    Your Email (for watermark filtering)
                  </Label>
                  <Input
                    id="watermark-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={watermarkEmail}
                    onChange={(e) => setWatermarkEmail(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This helps filter out watermarks from highlighting
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate('/index-manager')}
                  className="w-full justify-start bg-slate-100 hover:bg-slate-200 text-slate-800"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Manage Index
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

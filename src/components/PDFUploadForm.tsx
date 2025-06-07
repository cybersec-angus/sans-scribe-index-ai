
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFUploadFormProps {
  onUpload: (file: File, courseCode: string, bookNumber: string, pageOffset: number) => void;
  isUploading: boolean;
  uploadedFiles: Array<{
    id: string;
    file_name: string;
    file_size: number | null;
    course_code: string | null;
    book_number: string;
    page_offset: number | null;
  }>;
  onRemove: (id: string) => void;
}

export const PDFUploadForm = ({ onUpload, isUploading, uploadedFiles, onRemove }: PDFUploadFormProps) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [courseCode, setCourseCode] = useState("");
  const [bookNumber, setBookNumber] = useState("");
  const [pageOffset, setPageOffset] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('Files selected:', files.length);
    
    if (files.length === 0) return;

    // Validate PDF files
    const validFiles = files.filter(file => file.type === 'application/pdf');
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: `${invalidFiles.length} file(s) are not PDF files. Only PDF files are supported.`,
        variant: "destructive",
      });
    }

    setSelectedFiles(validFiles);
    
    // Auto-extract book number from first file if not set
    if (validFiles.length > 0 && !bookNumber) {
      const fileName = validFiles[0].name;
      const extractedBookNumber = fileName.replace(/\.pdf$/i, '').toUpperCase();
      setBookNumber(extractedBookNumber);
    }

    // Clear the input
    event.target.value = '';
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!courseCode.trim()) {
      toast({
        title: "Course Required",
        description: "Please enter a course code (e.g., SEC599).",
        variant: "destructive",
      });
      return;
    }

    if (!bookNumber.trim()) {
      toast({
        title: "Book Number Required",
        description: "Please enter a book number for this PDF.",
        variant: "destructive",
      });
      return;
    }

    // Upload each selected file
    selectedFiles.forEach(file => {
      console.log('Uploading file:', file.name, 'Course:', courseCode, 'Book:', bookNumber, 'Offset:', pageOffset);
      onUpload(file, courseCode.trim(), bookNumber.trim(), pageOffset);
    });

    // Clear form after upload
    setSelectedFiles([]);
    setBookNumber("");
    // Keep course code and page offset for next upload
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-lg border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-card-foreground">
          <Upload className="h-6 w-6 text-blue-600" />
          Upload PDF Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="course-code" className="text-sm font-medium">
              Course Code
            </Label>
            <Input
              id="course-code"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., SEC599"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="book-number" className="text-sm font-medium">
              Book Number
            </Label>
            <Input
              id="book-number"
              value={bookNumber}
              onChange={(e) => setBookNumber(e.target.value)}
              placeholder="e.g., BOOK1"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="page-offset" className="text-sm font-medium">
              Page Offset
            </Label>
            <Input
              id="page-offset"
              type="number"
              value={pageOffset}
              onChange={(e) => setPageOffset(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Subtract this from PDF page numbers
            </p>
          </div>
        </div>

        {/* File Selection */}
        <div>
          <Label htmlFor="pdf-upload" className="text-base font-medium">
            Select SANS Course PDFs
          </Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="mt-2"
            disabled={isUploading}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Upload multiple PDF files from your SANS course materials
          </p>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-card-foreground">Selected Files:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-accent rounded-lg">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-card-foreground truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={selectedFiles.length === 0 || isUploading || !courseCode.trim() || !bookNumber.trim()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${selectedFiles.length} PDF${selectedFiles.length !== 1 ? 's' : ''}`
          )}
        </Button>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-card-foreground">Uploaded Files:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-card-foreground truncate">{file.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.course_code || 'No course'} • {file.book_number} • Offset: {file.page_offset || 0}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.file_size ? (file.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown size'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(file.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

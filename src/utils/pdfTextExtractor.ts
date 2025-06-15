
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set the worker path
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface TextExtractionResult {
  text: string;
  pageNumber: number;
}

export const extractTextFromPDF = async (
  pdfFile: File,
  pageNumber: number
): Promise<string> => {
  try {
    // Convert file to array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load the PDF document
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Page ${pageNumber} does not exist. PDF has ${pdf.numPages} pages.`);
    }
    
    // Get the specific page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content
    const textContent = await page.getTextContent();
    
    // Combine all text items into a single string
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`Extracted ${text.length} characters from page ${pageNumber}`);
    return text;
    
  } catch (error) {
    console.error(`Error extracting text from page ${pageNumber}:`, error);
    throw new Error(`Failed to extract text from page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const extractTextFromMultiplePages = async (
  pdfFile: File,
  startPage: number,
  endPage: number
): Promise<TextExtractionResult[]> => {
  const results: TextExtractionResult[] = [];
  
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    try {
      const text = await extractTextFromPDF(pdfFile, pageNum);
      results.push({
        text,
        pageNumber: pageNum,
      });
    } catch (error) {
      console.error(`Failed to extract text from page ${pageNum}:`, error);
      // Continue with other pages even if one fails
    }
  }
  
  return results;
};

import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

// pdf-parse doesn't need a worker - it just works!

export const analyzePDFHealth = async (pdfBuffer, fileSize) => {
    try {
        // Get basic info from the PDF buffer
        const data = await pdfParse(pdfBuffer);
        const numPages = data.numpages;
        const textLength = data.text.length;
        const issues = [];
        
        const isScanned = textLength < 200 && fileSize > 200000;
        
        if (numPages > 2) issues.push({ type: "page_count", severity: "low", message: `${numPages} pages detected`, fix: "Consider condensing to 2 pages" });
        if (isScanned) issues.push({ type: "scanned_pdf", severity: "high", message: "No selectable text found - appears scanned", fix: "Use OCR or recreate as text-based PDF" });
        
        return { pageCount: numPages, issues, textLength: textLength, fileSize };
    } catch (error) {
        console.warn("PDF Health analysis failed:", error);
        return { pageCount: 0, issues: [], textLength: 0, fileSize: fileSize };
    }
};

export const parsePDF = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const buffer = e.target.result;
                const data = await pdfParse(buffer);
                const fullText = data.text;
                
                if (!fullText || fullText.trim().length < 50) {
                    reject(new Error('Could not extract enough text from PDF'));
                }
                
                resolve({ pdf: null, fullText });
            } catch (error) {
                console.error('PDF parse error:', error);
                reject(new Error('Failed to parse PDF: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const extractDocx = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                if (result.value && result.value.length > 50) resolve(result.value);
                else reject(new Error('Could not extract text from DOCX'));
            } catch (error) {
                reject(new Error('Failed to parse DOCX: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};
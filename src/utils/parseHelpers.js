import mammoth from 'mammoth';

// Use your existing Azure Document Intelligence worker for PDFs
const AZURE_PARSER_URL = 'https://ats-parser.keron62.workers.dev/';

export const analyzePDFHealth = async (file, fileSize) => {
    // Since Azure handles the parsing, we don't need complex PDF health analysis
    // Return basic info
    return { 
        pageCount: null, 
        issues: [], 
        textLength: 0, 
        fileSize: fileSize,
        note: "PDF processed by Azure Document Intelligence"
    };
};

export const parsePDF = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const base64 = btoa(
                    new Uint8Array(e.target.result).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                    )
                );
                
                // Call your Azure worker
                const response = await fetch(AZURE_PARSER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        file: base64,
                        filename: file.name
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Extract text from your worker's response
                const fullText = data.text || data.content || data.extractedText || '';
                
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
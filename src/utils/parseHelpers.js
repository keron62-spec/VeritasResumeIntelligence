import mammoth from 'mammoth';

// Your Azure Document Intelligence worker
const AZURE_PARSER_URL = 'https://ats-parser.keron62.workers.dev/azure';

export const analyzePDFHealth = async (file, fileSize) => {
    return { 
        pageCount: null, 
        issues: [], 
        textLength: 0, 
        fileSize: fileSize,
        note: "PDF processed by Azure Document Intelligence"
    };
};

export const parsePDF = async (file) => {
    try {
        console.log('Sending PDF to Azure worker:', file.name);
        
        // Create FormData - your worker expects multipart/form-data
        const formData = new FormData();
        formData.append('file', file);
        
        // Call your Azure worker
        const response = await fetch(AZURE_PARSER_URL, {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Azure response:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Azure extraction failed');
        }
        
        const fullText = data.text || '';
        
        if (!fullText || fullText.trim().length < 50) {
            throw new Error('Could not extract enough text from PDF');
        }
        
        return { pdf: null, fullText };
    } catch (error) {
        console.error('PDF parse error:', error);
        throw new Error('Failed to parse PDF: ' + error.message);
    }
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
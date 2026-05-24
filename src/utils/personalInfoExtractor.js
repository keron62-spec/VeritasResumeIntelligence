// src/utils/personalInfoExtractor.js

/**
 * Deterministic personal information extractor from resume text
 * Extracts: name, email, phone, LinkedIn, location, GitHub, portfolio
 * No LLM required - 100% regex-based pattern matching
 */

/**
 * Extract name from resume text
 * Name is typically the first non-empty line that:
 * - Is not an email, phone number, or URL
 * - Has 2-4 words (first and last name, possibly middle initial)
 * - Doesn't contain special characters or numbers
 * 
 * @param {string} text - Full resume text
 * @returns {string} Extracted name or empty string
 */
function extractName(text) {
    if (!text || typeof text !== 'string') return '';
    
    const lines = text.split('\n');
    
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Skip lines that look like email, phone, or URLs
        if (line.includes('@')) continue;
        if (line.match(/[\d\s-]{10,}/)) continue;
        if (line.match(/linkedin\.com|github\.com|bit\.ly|http/i)) continue;
        
        // Check if line looks like a name (2-4 words, no special chars except hyphen/apostrophe)
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
            // Allow hyphenated names (e.g., "Jean-Pierre")
            // Allow apostrophes (e.g., "O'Connor")
            const isValidName = words.every(word => {
                const cleanWord = word.replace(/[-\']/g, '');
                return /^[A-Z][a-z]+$/.test(cleanWord) || /^[A-Z]$/.test(word);
            });
            
            if (isValidName && line.length < 50) {
                return line;
            }
        }
    }
    
    return '';
}

/**
 * Extract email address from resume text
 * @param {string} text - Full resume text
 * @returns {string} Extracted email or empty string
 */
function extractEmail(text) {
    if (!text || typeof text !== 'string') return '';
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
}

/**
 * Extract phone number from resume text
 * Handles various formats: (868) 123-4567, 868-123-4567, 868.123.4567, 8681234567, +1-868-123-4567
 * @param {string} text - Full resume text
 * @returns {string} Extracted phone number or empty string
 */
function extractPhone(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Comprehensive phone regex - matches international and US/Canada/Caribbean formats
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const match = text.match(phoneRegex);
    
    if (match) {
        // Format consistently as (XXX) XXX-XXXX
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return '';
}

/**
 * Extract LinkedIn URL from resume text
 * @param {string} text - Full resume text
 * @returns {string} Extracted LinkedIn URL or empty string
 */
function extractLinkedIn(text) {
    if (!text || typeof text !== 'string') return '';
    
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9\-_]+/i;
    const match = text.match(linkedinRegex);
    return match ? match[0] : '';
}

/**
 * Extract GitHub URL from resume text
 * @param {string} text - Full resume text
 * @returns {string} Extracted GitHub URL or empty string
 */
function extractGitHub(text) {
    if (!text || typeof text !== 'string') return '';
    
    const githubRegex = /github\.com\/[a-zA-Z0-9\-_]+/i;
    const match = text.match(githubRegex);
    return match ? match[0] : '';
}

/**
 * Extract portfolio/website URL from resume text
 * FIXED: Added global flag to regex for matchAll
 * @param {string} text - Full resume text
 * @returns {string} Extracted portfolio URL or empty string
 */
function extractPortfolio(text) {
    if (!text || typeof text !== 'string') return '';
    
    // FIXED: Added 'g' flag for global matching (required for matchAll)
    const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|org|net|io|co|me|dev|app))(?:\/[\w\-./?%&=]*)?/gi;
    
    // Use match() instead of matchAll() to avoid the global flag requirement
    const matches = text.match(portfolioRegex);
    
    if (matches) {
        for (const url of matches) {
            // Skip if it's LinkedIn or GitHub
            if (!url.toLowerCase().includes('linkedin') && !url.toLowerCase().includes('github')) {
                // Ensure protocol is present
                if (url.startsWith('http')) return url;
                return `https://${url}`;
            }
        }
    }
    
    return '';
}

/**
 * Extract location (city, state, country) from resume text
 * Looks for patterns like "San Francisco, CA" or "New York, NY" near contact info
 * @param {string} text - Full resume text
 * @returns {string} Extracted location or empty string
 */
function extractLocation(text) {
    if (!text || typeof text !== 'string') return '';
    
    const lines = text.split('\n');
    
    // Look within first 15 lines for location pattern
    for (let i = 0; i < Math.min(15, lines.length); i++) {
        const line = lines[i].trim();
        
        // Check for city, state pattern (e.g., "San Francisco, CA" or "New York, NY")
        const cityStateMatch = line.match(/([A-Za-z\s]+),\s*([A-Z]{2})\b/);
        if (cityStateMatch) {
            return `${cityStateMatch[1].trim()}, ${cityStateMatch[2]}`;
        }
        
        // Check for city, country pattern (e.g., "London, UK" or "Toronto, Canada")
        const cityCountryMatch = line.match(/([A-Za-z\s]+),\s*([A-Za-z]+)\b/);
        if (cityCountryMatch && cityCountryMatch[2].length >= 2) {
            return `${cityCountryMatch[1].trim()}, ${cityCountryMatch[2]}`;
        }
    }
    
    return '';
}

/**
 * Extract all personal information from resume text
 * @param {string} text - Full resume text
 * @returns {Object} Personal information object
 */
export function extractPersonalInfo(text) {
    if (!text || typeof text !== 'string') {
        return {
            name: '',
            email: '',
            phone: '',
            linkedin: '',
            github: '',
            portfolio: '',
            location: ''
        };
    }
    
    return {
        name: extractName(text),
        email: extractEmail(text),
        phone: extractPhone(text),
        linkedin: extractLinkedIn(text),
        github: extractGitHub(text),
        portfolio: extractPortfolio(text),
        location: extractLocation(text)
    };
}

/**
 * Format personal information for display/export
 * @param {Object} info - Personal information object
 * @returns {string} Formatted contact line
 */
export function formatContactLine(info) {
    const parts = [];
    if (info.email) parts.push(info.email);
    if (info.phone) parts.push(info.phone);
    if (info.linkedin) parts.push(info.linkedin);
    if (info.github) parts.push(info.github);
    if (info.location) parts.push(info.location);
    
    return parts.join(' | ');
}

/**
 * Validate if personal information is complete enough
 * @param {Object} info - Personal information object
 * @returns {Object} Validation result
 */
export function validatePersonalInfo(info) {
    const issues = [];
    
    if (!info.name) issues.push('Missing full name');
    if (!info.email) issues.push('Missing email address');
    if (!info.phone) issues.push('Missing phone number');
    
    return {
        isComplete: issues.length === 0,
        isAcceptable: issues.length <= 1,
        issues,
        score: Math.max(0, 100 - (issues.length * 25))
    };
}
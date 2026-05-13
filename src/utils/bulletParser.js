// src/utils/bulletParser.js

/**
 * Extracts bullet points from resume text with context (company, role, section)
 * 100% deterministic using pattern matching and section detection
 */

// Section headers to look for (case insensitive)
const SECTION_HEADERS = {
    work_experience: [
      'work experience', 'experience', 'employment', 'work history', 
      'professional experience', 'career history', 'relevant experience'
    ],
    education: ['education', 'academic background', 'qualifications', 'education history'],
    skills: ['skills', 'technical skills', 'core competencies', 'expertise', 'skills summary'],
    projects: ['projects', 'personal projects', 'key projects', 'project portfolio'],
    certifications: ['certifications', 'certificates', 'professional certifications', 'licenses'],
    volunteer: ['volunteer', 'volunteer experience', 'community service', 'volunteer work'],
    publications: ['publications', 'papers', 'articles', 'research publications'],
    leadership: ['leadership', 'leadership experience', 'board memberships']
  };
  
  // Common bullet characters
  const BULLET_CHARS = ['•', '·', '●', '◦', '➢', '➤', '►', '‣', '-', '*', '+'];
  
  /**
   * Parse date strings in resumes
   * Handles: "Jan 2020", "2020-01", "01/2020", "2020", "Present", "Current"
   */
  function parseDate(dateStr) {
    if (!dateStr) return null;
    
    const str = dateStr.trim().toLowerCase();
    
    // Present/Current
    if (str === 'present' || str === 'current' || str === 'now') {
      return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, isPresent: true };
    }
    
    // Month Year format: "Jan 2020", "January 2020"
    const monthYearMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*\s+(\d{4})/i);
    if (monthYearMatch) {
      const months = { jan:1, january:1, feb:2, february:2, mar:3, march:3, apr:4, april:4, may:5, jun:6, june:6, jul:7, july:7, aug:8, august:8, sep:9, september:9, oct:10, october:10, nov:11, november:11, dec:12, december:12 };
      const month = months[monthYearMatch[1].toLowerCase().substring(0, 3)];
      const year = parseInt(monthYearMatch[2]);
      return { year, month, isPresent: false };
    }
    
    // Year only: "2020"
    const yearMatch = str.match(/^(\d{4})$/);
    if (yearMatch) {
      return { year: parseInt(yearMatch[1]), month: 6, isPresent: false };
    }
    
    // ISO format: "2020-01"
    const isoMatch = str.match(/(\d{4})[-/](\d{1,2})/);
    if (isoMatch) {
      return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]), isPresent: false };
    }
    
    return null;
  }
  
  /**
   * Extracts company, role, and dates from a job line
   * Example: "Caribbean Public Health Agency • Trinidad and Tobago • 03/2024 - 03/2025"
   *          "PMO Coordinator/Project Operations Coordinator"
   */
  function parseJobHeader(lines, startIdx) {
    let currentIdx = startIdx;
    let company = null;
    let location = null;
    let startDate = null;
    let endDate = null;
    let role = null;
    
    // First line usually contains company, location, dates
    const headerLine = lines[currentIdx];
    
    // Try to extract dates first
    const datePattern = /(\d{1,2}\/\d{4}|\d{4}-\d{2}|\w+\s+\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|\d{4}-\d{2}|\w+\s+\d{4}|Present|Current)/i;
    const dateMatch = headerLine.match(datePattern);
    if (dateMatch) {
      startDate = parseDate(dateMatch[1]);
      endDate = parseDate(dateMatch[2]);
    }
    
    // Remove dates from string for parsing company/location
    let remaining = headerLine.replace(datePattern, '').trim();
    
    // Split by bullet or pipe
    const parts = remaining.split(/[•·●◦➢➤►‣|]/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 1) company = parts[0];
    if (parts.length >= 2) location = parts[1];
    
    // Next line usually contains role title
    if (currentIdx + 1 < lines.length) {
      const roleLine = lines[currentIdx + 1].trim();
      // Role line shouldn't start with a bullet (that would be a bullet point)
      const isRoleLine = !BULLET_CHARS.some(c => roleLine.startsWith(c)) && roleLine.length > 0 && roleLine.length < 100;
      if (isRoleLine) {
        role = roleLine;
        currentIdx++;
      }
    }
    
    return {
      company,
      location,
      role,
      startDate,
      endDate,
      nextIndex: currentIdx + 1
    };
  }
  
  /**
   * Extracts bullet points from a block of text
   */
  function extractBulletsFromBlock(blockText, section, context) {
    const bullets = [];
    const lines = blockText.split('\n');
    
    let currentCompany = context.company || null;
    let currentRole = context.role || null;
    let bulletIndex = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      // Check if this line starts a new job entry (contains company pattern)
      const hasCompanyIndicator = /[A-Z][a-z]+\s+(Agency|Limited|Group|Organization|Company|Corp|Inc|Ltd|PLC|LLC)/i.test(line);
      const hasDateRange = /\d{4}\s*[-–—]\s*\d{4}|\d{4}\s*[-–—]\s*Present/i.test(line);
      
      if ((hasCompanyIndicator || hasDateRange) && i > 0) {
        // Parse new job header
        const jobInfo = parseJobHeader(lines, i);
        currentCompany = jobInfo.company || currentCompany;
        currentRole = jobInfo.role || currentRole;
        i = jobInfo.nextIndex - 1;
        bulletIndex = 1;
        continue;
      }
      
      // Check if line starts with a bullet character
      let isBullet = false;
      let bulletChar = null;
      for (const bc of BULLET_CHARS) {
        if (line.startsWith(bc) || line.startsWith(bc + ' ') || line.startsWith(bc + '\t')) {
          isBullet = true;
          bulletChar = bc;
          break;
        }
      }
      
      // Also detect numbered bullets (1., 2., etc.)
      const numberedMatch = line.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        isBullet = true;
        bulletChar = numberedMatch[1] + '.';
      }
      
      if (isBullet) {
        // Remove bullet character and clean
        let bulletText = line;
        if (bulletChar) {
          bulletText = bulletText.replace(new RegExp(`^${bulletChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '');
        }
        
        bullets.push({
          id: `${section.substring(0, 2).toUpperCase()}_${currentCompany ? currentCompany.replace(/\s/g, '_').substring(0, 20) : 'unknown'}_${bulletIndex}`,
          section: section,
          company: currentCompany,
          role: currentRole,
          original_text: bulletText,
          bullet_index: bulletIndex
        });
        
        bulletIndex++;
      }
    }
    
    return bullets;
  }
  
  /**
   * Main function: Extract all bullets from resume text
   * @param {string} resumeText - Full resume text
   * @returns {Object} { bullets, sections, total_count }
   */
  export function extractBullets(resumeText) {
    if (!resumeText || typeof resumeText !== 'string') {
      return { bullets: [], sections: {}, total_count: 0 };
    }
    
    const lowerText = resumeText.toLowerCase();
    const allBullets = [];
    const sections = {};
    
    // Find section boundaries
    let currentSection = 'unknown';
    let currentSectionStart = 0;
    
    const lines = resumeText.split('\n');
    const sectionBoundaries = [];
    
    // First pass: identify section headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      for (const [sectionName, headers] of Object.entries(SECTION_HEADERS)) {
        for (const header of headers) {
          if (line === header || line.startsWith(header + ':') || line.startsWith(header + '\t')) {
            sectionBoundaries.push({ index: i, section: sectionName, line: line });
            break;
          }
        }
      }
    }
    
    // Sort boundaries by line index
    sectionBoundaries.sort((a, b) => a.index - b.index);
    
    // Extract text for each section
    for (let i = 0; i < sectionBoundaries.length; i++) {
      const boundary = sectionBoundaries[i];
      const nextBoundary = sectionBoundaries[i + 1];
      const startIdx = boundary.index + 1;
      const endIdx = nextBoundary ? nextBoundary.index : lines.length;
      
      const sectionText = lines.slice(startIdx, endIdx).join('\n');
      sections[boundary.section] = sectionText;
      
      // Extract bullets from this section
      const context = {};
      const bullets = extractBulletsFromBlock(sectionText, boundary.section, context);
      allBullets.push(...bullets);
    }
    
    // If no sections detected, try to extract bullets from entire text
    if (allBullets.length === 0) {
      const bullets = extractBulletsFromBlock(resumeText, 'unknown', {});
      allBullets.push(...bullets);
    }
    
    return {
      bullets: allBullets,
      sections: sections,
      total_count: allBullets.length
    };
  }
  
  /**
   * Groups bullets by company/role for easier processing
   */
  export function groupBulletsByRole(bullets) {
    const groups = [];
    let currentGroup = null;
    
    for (const bullet of bullets) {
      if (!currentGroup || currentGroup.company !== bullet.company || currentGroup.role !== bullet.role) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          company: bullet.company,
          role: bullet.role,
          section: bullet.section,
          bullets: []
        };
      }
      currentGroup.bullets.push(bullet);
    }
    
    if (currentGroup) groups.push(currentGroup);
    
    return groups;
  }
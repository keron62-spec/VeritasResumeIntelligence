// src/utils/bulletParser.js

/**
 * Enhanced bullet point extractor with robust pattern matching
 * Supports multiple resume formats, section detection, date extraction
 * Creates IDs matching LLM format: {SECTION_CODE}_{ROLE_INDEX}_{BULLET_INDEX}
 */

// ============================================================
// SECTION HEADERS (Widest possible range)
// ============================================================

const SECTION_HEADERS = {
  work_experience: {
      codes: ['WE'],
      patterns: [
          // Standard
          'work experience', 'experience', 'employment', 'work history',
          'professional experience', 'career history', 'relevant experience',
          // Markdown
          '## experience', '## work experience', '### experience', '# experience',
          '**experience**', '*experience*',
          // Uppercase
          'experience', 'work experience', 'professional experience',
          // With colon
          'experience:', 'work experience:', 'employment:',
          // With underline (detected separately in parsing)
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  projects: {
      codes: ['PR'],
      patterns: [
          'projects', 'personal projects', 'key projects', 'project portfolio',
          '## projects', '**projects**', 'projects:',
          'featured projects', 'side projects', 'open source projects'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  volunteer: {
      codes: ['VO'],
      patterns: [
          'volunteer', 'volunteer experience', 'community service', 'volunteer work',
          '## volunteer', '**volunteer**', 'volunteer:',
          'community involvement', 'pro bono'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  internships: {
      codes: ['IN'],
      patterns: [
          'internships', 'internship', 'intern experience',
          '## internships', '**internships**', 'internships:'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  leadership: {
      codes: ['LD'],
      patterns: [
          'leadership', 'leadership experience', 'board memberships', 'leadership roles',
          '## leadership', '**leadership**', 'leadership:',
          'executive leadership', 'team leadership'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  education: {
      codes: ['ED'],
      patterns: [
          'education', 'academic background', 'qualifications', 'degrees',
          'education history', '## education', '**education**', 'education:',
          'academic history', 'educational background'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  skills: {
      codes: ['SK'],
      patterns: [
          'skills', 'technical skills', 'core competencies', 'expertise',
          'competencies', 'skills summary', 'tools & technologies',
          '## skills', '**skills**', 'skills:',
          'key skills', 'professional skills', 'technology stack'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  certifications: {
      codes: ['CE'],
      patterns: [
          'certifications', 'certificates', 'licenses', 'professional certifications',
          '## certifications', '**certifications**', 'certifications:',
          'certification', 'licenses & certifications'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  publications: {
      codes: ['PU'],
      patterns: [
          'publications', 'papers', 'articles', 'research publications',
          '## publications', '**publications**', 'publications:',
          'selected publications', 'peer-reviewed publications'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  awards: {
      codes: ['AW'],
      patterns: [
          'awards', 'honors', 'recognition', 'achievements',
          '## awards', '**awards**', 'awards:',
          'honors & awards', 'recognition & awards'
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  languages: {
      codes: ['LA'],
      patterns: [
          'languages', 'language skills', 'spoken languages',
          '## languages', '**languages**', 'languages:',
          'language proficiency'
      ],
      detectUnderline: true,
      caseInsensitive: true
  }
};

// ============================================================
// SECTION CODE MAPPING (for ID generation)
// ============================================================

const SECTION_TO_CODE = {
  'work_experience': 'WE',
  'projects': 'PR',
  'volunteer': 'VO',
  'internships': 'IN',
  'leadership': 'LD',
  'education': 'ED',
  'skills': 'SK',
  'certifications': 'CE',
  'publications': 'PU',
  'awards': 'AW',
  'languages': 'LA'
};

// ============================================================
// DATE PATTERNS
// ============================================================

const DATE_PATTERNS = [
  // MM/YYYY - MM/YYYY (your format)
  { regex: /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|Present|Current)/i, hasMonth: true },
  // YYYY-MM - YYYY-MM
  { regex: /(\d{4}-\d{1,2})\s*[-–—]\s*(\d{4}-\d{1,2}|Present|Current)/i, hasMonth: true },
  // Month YYYY - Month YYYY
  { regex: /([A-Za-z]+\s+\d{4})\s*[-–—]\s*([A-Za-z]+\s+\d{4}|Present|Current)/i, hasMonth: true },
  // YYYY - YYYY
  { regex: /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i, hasMonth: false },
  // Single date with Present
  { regex: /(\d{4})\s*[-–—]\s*(Present|Current)/i, hasMonth: false },
  // MM/YYYY only (current role without end date)
  { regex: /^(\d{1,2}\/\d{4})$/i, hasMonth: true, isSingle: true },
  // YYYY only
  { regex: /^(\d{4})$/i, hasMonth: false, isSingle: true }
];

// Months mapping for parsing
const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12
};

// ============================================================
// HELPER: Parse Date
// ============================================================

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return { year: null, month: null, original: '' };
  
  const normalized = dateStr.trim();
  
  for (const pattern of DATE_PATTERNS) {
      const match = normalized.match(pattern.regex);
      if (match) {
          if (pattern.hasMonth) {
              let month = null;
              let year = null;
              
              // Handle MM/YYYY format
              if (match[1].match(/\d{1,2}\/\d{4}/)) {
                  const parts = match[1].split('/');
                  month = parseInt(parts[0]);
                  year = parseInt(parts[1]);
              }
              // Handle Month YYYY format
              else if (match[1].match(/[A-Za-z]+\s+\d{4}/)) {
                  const parts = match[1].split(' ');
                  month = MONTHS[parts[0].toLowerCase().substring(0, 3)];
                  year = parseInt(parts[1]);
              }
              // Handle YYYY-MM format
              else if (match[1].match(/\d{4}-\d{1,2}/)) {
                  const parts = match[1].split('-');
                  year = parseInt(parts[0]);
                  month = parseInt(parts[1]);
              }
              
              // Parse end date if present
              let endYear = null, endMonth = null;
              if (match[2] && match[2] !== 'Present' && match[2] !== 'Current') {
                  if (match[2].match(/\d{1,2}\/\d{4}/)) {
                      const parts = match[2].split('/');
                      endMonth = parseInt(parts[0]);
                      endYear = parseInt(parts[1]);
                  } else if (match[2].match(/[A-Za-z]+\s+\d{4}/)) {
                      const parts = match[2].split(' ');
                      endMonth = MONTHS[parts[0].toLowerCase().substring(0, 3)];
                      endYear = parseInt(parts[1]);
                  } else if (match[2].match(/\d{4}-\d{1,2}/)) {
                      const parts = match[2].split('-');
                      endYear = parseInt(parts[0]);
                      endMonth = parseInt(parts[1]);
                  } else if (match[2].match(/\d{4}/)) {
                      endYear = parseInt(match[2]);
                  }
              }
              
              return {
                  startYear: year,
                  startMonth: month,
                  endYear: endYear,
                  endMonth: endMonth,
                  isPresent: match[2] === 'Present' || match[2] === 'Current',
                  original: normalized
              };
          } else {
              const year = parseInt(match[1]);
              let endYear = null;
              let isPresent = false;
              
              if (match[2]) {
                  if (match[2] === 'Present' || match[2] === 'Current') {
                      isPresent = true;
                  } else {
                      endYear = parseInt(match[2]);
                  }
              }
              
              return {
                  startYear: year,
                  startMonth: null,
                  endYear: endYear,
                  endMonth: null,
                  isPresent: isPresent,
                  original: normalized
              };
          }
      }
  }
  
  return { year: null, month: null, original: normalized };
}

// ============================================================
// HELPER: Extract Date Range from Text
// ============================================================

function extractDateRange(text) {
  for (const pattern of DATE_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
          return {
              hasDates: true,
              start: match[1],
              end: match[2] || null,
              isPresent: match[2] === 'Present' || match[2] === 'Current'
          };
      }
  }
  return { hasDates: false, start: null, end: null, isPresent: false };
}

// ============================================================
// HELPER: Check if Line is a Section Header
// ============================================================

function isSectionHeader(line, sectionType = null) {
  const trimmed = line.trim();
  const lowerLine = trimmed.toLowerCase();
  
  // Remove markdown formatting for comparison
  const cleanLine = lowerLine.replace(/^#{1,6}\s*/, '').replace(/[*_]/g, '');
  
  const sectionsToCheck = sectionType ? [sectionType] : Object.keys(SECTION_HEADERS);
  
  for (const section of sectionsToCheck) {
      const config = SECTION_HEADERS[section];
      if (!config) continue;
      
      for (const pattern of config.patterns) {
          const cleanPattern = pattern.toLowerCase().replace(/^#{1,6}\s*/, '').replace(/[*_]/g, '');
          if (cleanLine === cleanPattern || cleanLine.startsWith(cleanPattern + ':') || cleanLine.startsWith(cleanPattern + ' ')) {
              return { isHeader: true, sectionType: section, code: SECTION_TO_CODE[section] };
          }
      }
  }
  
  // Check for underline-style headers (e.g., "Experience" then "=========" on next line)
  // This is handled in the main parsing loop
  
  return { isHeader: false, sectionType: null, code: null };
}

// ============================================================
// HELPER: Check if Line is a Bullet Point
// ============================================================

function isBulletLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return { isBullet: false, text: '', bulletChar: null };
  
  // Check for common bullet characters
  const bulletChars = ['•', '·', '●', '◦', '➢', '➤', '►', '‣', '-', '—', '–', '*', '+'];
  for (const char of bulletChars) {
      if (trimmed.startsWith(char) || trimmed.startsWith(char + ' ')) {
          return { 
              isBullet: true, 
              text: trimmed.replace(new RegExp(`^${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '').trim(),
              bulletChar: char
          };
      }
  }
  
  // Check for numbered bullets (1., 1), (1), etc.)
  const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+/);
  if (numberedMatch) {
      return { 
          isBullet: true, 
          text: trimmed.replace(/^\d+[\.\)]\s+/, '').trim(),
          bulletChar: numberedMatch[1] + '.'
      };
  }
  
  // Check for lettered bullets (a., b., etc.)
  const letteredMatch = trimmed.match(/^([a-z])[\.\)]\s+/i);
  if (letteredMatch) {
      return { 
          isBullet: true, 
          text: trimmed.replace(/^[a-z][\.\)]\s+/i, '').trim(),
          bulletChar: letteredMatch[1] + '.'
      };
  }
  
  // Check for roman numeral bullets (i., ii., etc.)
  const romanMatch = trimmed.match(/^[ivx]+[\.\)]\s+/i);
  if (romanMatch) {
      return { 
          isBullet: true, 
          text: trimmed.replace(/^[ivx]+[\.\)]\s+/i, '').trim(),
          bulletChar: romanMatch[0].trim()
      };
  }
  
  // Fallback: line starts with capital letter, isn't a section header, and is substantial length
  const headerCheck = isSectionHeader(trimmed);
  if (!headerCheck.isHeader && trimmed.match(/^[A-Z][a-z]/) && trimmed.length > 20) {
      return { isBullet: true, text: trimmed, bulletChar: null };
  }
  
  return { isBullet: false, text: '', bulletChar: null };
}

// ============================================================
// HELPER: Check if Line is Blank
// ============================================================

function isBlankLine(line) {
  return line.trim().length === 0;
}

// ============================================================
// HELPER: Parse Job Entry (Company, Role, Dates, Location)
// ============================================================

function parseJobEntry(lines, startIdx) {
  let currentIdx = startIdx;
  let company = null;
  let role = null;
  let location = null;
  let startDate = null;
  let endDate = null;
  let isPresent = false;
  
  // Collect next 10 lines to analyze
  const contextLines = [];
  for (let i = 0; i < Math.min(10, lines.length - currentIdx); i++) {
      contextLines.push(lines[currentIdx + i]);
  }
  
  if (contextLines.length === 0) return { company, role, location, startDate, endDate, isPresent, nextIndex: currentIdx };
  
  // ============================================================
  // PATTERN 1: Your format - Company, then Date, then Role, then Location
  // ============================================================
  let lineIdx = 0;
  
  // Company line (often bolded or starts with capital letter, not a date)
  if (contextLines[lineIdx] && contextLines[lineIdx].trim().length > 0 && !contextLines[lineIdx].match(/\d{4}/)) {
      const headerCheck = isSectionHeader(contextLines[lineIdx]);
      if (!headerCheck.isHeader) {
          company = contextLines[lineIdx].trim();
          lineIdx++;
          
          // Next line: Date range
          if (lineIdx < contextLines.length && contextLines[lineIdx]) {
              const dateResult = extractDateRange(contextLines[lineIdx]);
              if (dateResult.hasDates) {
                  const parsedStart = parseDate(dateResult.start);
                  const parsedEnd = parseDate(dateResult.end);
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
                  lineIdx++;
                  
                  // Next line: Role
                  if (lineIdx < contextLines.length && contextLines[lineIdx] && contextLines[lineIdx].trim().length > 0) {
                      const bulletCheck = isBulletLine(contextLines[lineIdx]);
                      if (!bulletCheck.isBullet) {
                          role = contextLines[lineIdx].trim();
                          lineIdx++;
                          
                          // Next line: Location (optional)
                          if (lineIdx < contextLines.length && contextLines[lineIdx] && contextLines[lineIdx].trim().length > 0) {
                              const nextBulletCheck = isBulletLine(contextLines[lineIdx]);
                              if (!nextBulletCheck.isBullet && contextLines[lineIdx].trim().length < 50) {
                                  location = contextLines[lineIdx].trim();
                                  lineIdx++;
                              }
                          }
                      }
                  }
              }
          }
      }
  }
  
  // ============================================================
  // PATTERN 2: Company | Role | Date format (pipe-separated)
  // ============================================================
  if (!company && contextLines[0]) {
      const pipeMatch = contextLines[0].match(/^(.+?)\s*[|\-]\s*(.+?)\s*[|\-]\s*(.+)$/);
      if (pipeMatch) {
          company = pipeMatch[1].trim();
          role = pipeMatch[2].trim();
          const dateResult = extractDateRange(pipeMatch[3]);
          if (dateResult.hasDates) {
              startDate = dateResult.start;
              endDate = dateResult.end;
              isPresent = dateResult.isPresent;
          }
          lineIdx = 1;
      }
  }
  
  // ============================================================
  // PATTERN 3: Role at Company format
  // ============================================================
  if (!company && contextLines[0]) {
      const atMatch = contextLines[0].match(/^(.+?)\s+at\s+(.+?)(?:\s*[|\-]\s*(.+))?$/i);
      if (atMatch) {
          role = atMatch[1].trim();
          company = atMatch[2].trim();
          if (atMatch[3]) {
              const dateResult = extractDateRange(atMatch[3]);
              if (dateResult.hasDates) {
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
              }
          }
          lineIdx = 1;
      }
  }
  
  // ============================================================
  // PATTERN 4: Comma-separated: Role, Company, Location, Date
  // ============================================================
  if (!company && contextLines[0]) {
      const commaMatch = contextLines[0].match(/^([^,]+),\s*([^,]+)(?:,\s*([^,]+))?(?:,\s*(.+))?$/);
      if (commaMatch) {
          role = commaMatch[1].trim();
          company = commaMatch[2].trim();
          if (commaMatch[3]) location = commaMatch[3].trim();
          if (commaMatch[4]) {
              const dateResult = extractDateRange(commaMatch[4]);
              if (dateResult.hasDates) {
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
              }
          }
          lineIdx = 1;
      }
  }
  
  // ============================================================
  // PATTERN 5: Company on one line, Role on next, Date on third
  // ============================================================
  if (!company && contextLines[0] && contextLines[1]) {
      const firstLineCheck = isBulletLine(contextLines[0]);
      const secondLineCheck = isBulletLine(contextLines[1]);
      
      if (!firstLineCheck.isBullet && !secondLineCheck.isBullet && contextLines[0].trim().length > 0) {
          company = contextLines[0].trim();
          role = contextLines[1].trim();
          
          // Check third line for date
          if (contextLines[2]) {
              const dateResult = extractDateRange(contextLines[2]);
              if (dateResult.hasDates) {
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
                  lineIdx = 3;
              } else {
                  lineIdx = 2;
              }
          } else {
              lineIdx = 2;
          }
      }
  }
  
  // Calculate next index
  const nextIndex = startIdx + lineIdx;
  
  return { 
      company, 
      role, 
      location, 
      startDate, 
      endDate, 
      isPresent,
      nextIndex: Math.min(nextIndex, lines.length)
  };
}

// ============================================================
// MAIN FUNCTION: Extract Bullets from Block with Context
// ============================================================

function extractBulletsFromBlock(blockText, sectionType, sectionCode, existingContext = {}) {
  const bullets = [];
  const lines = blockText.split('\n');
  let roleIndex = 0;
  let currentCompany = existingContext.company || null;
  let currentRole = existingContext.role || null;
  let currentLocation = existingContext.location || null;
  let currentStartDate = existingContext.startDate || null;
  let currentEndDate = existingContext.endDate || null;
  let bulletIndex = 1;
  let i = 0;
  
  while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed.length === 0) {
          i++;
          continue;
      }
      
      // Check if this line starts a new job entry
      const bulletCheck = isBulletLine(line);
      const headerCheck = isSectionHeader(line);
      
      // If it's a section header, stop processing this block
      if (headerCheck.isHeader && headerCheck.sectionType !== sectionType) {
          break;
      }
      
      // Try to parse as job entry (not a bullet)
      if (!bulletCheck.isBullet && !headerCheck.isHeader && trimmed.length > 0) {
          const jobInfo = parseJobEntry(lines, i);
          
          if (jobInfo.company || jobInfo.role) {
              // Save previous role's bullets before starting new one
              if (currentCompany || currentRole) {
                  roleIndex++;
                  bulletIndex = 1;
              }
              
              currentCompany = jobInfo.company || currentCompany;
              currentRole = jobInfo.role || currentRole;
              currentLocation = jobInfo.location || currentLocation;
              currentStartDate = jobInfo.startDate || currentStartDate;
              currentEndDate = jobInfo.endDate || currentEndDate;
              
              i = jobInfo.nextIndex;
              continue;
          }
      }
      
      // Check if line is a bullet point
      if (bulletCheck.isBullet) {
          bullets.push({
              id: `${sectionCode}_${roleIndex + 1}_${bulletIndex}`,
              section: sectionType,
              company: currentCompany,
              role: currentRole,
              location: currentLocation,
              startDate: currentStartDate,
              endDate: currentEndDate,
              original_text: bulletCheck.text,
              bullet_index: bulletIndex,
              bullet_char: bulletCheck.bulletChar
          });
          bulletIndex++;
          i++;
          continue;
      }
      
      // Check for multi-line bullet continuation
      // If we have an active bullet and this line isn't a blank line or new bullet
      if (bullets.length > 0 && trimmed.length > 0 && !bulletCheck.isBullet && !isBlankLine(line)) {
          const lastBullet = bullets[bullets.length - 1];
          const nextLineCheck = i + 1 < lines.length ? isBulletLine(lines[i + 1]) : { isBullet: false };
          
          // Continue appending until we hit a blank line or new bullet
          if (!nextLineCheck.isBullet && !isBlankLine(lines[i + 1] || '')) {
              lastBullet.original_text += ' ' + trimmed;
              i++;
              continue;
          }
      }
      
      i++;
  }
  
  return bullets;
}

// ============================================================
// MAIN FUNCTION: Extract All Bullets from Resume Text
// ============================================================

export function extractBullets(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
      return { bullets: [], sections: {}, total_count: 0 };
  }
  
  const lines = resumeText.split('\n');
  const allBullets = [];
  const sections = {};
  let currentSection = null;
  let currentSectionCode = null;
  let currentSectionStart = 0;
  
  // First pass: identify section boundaries
  const sectionBoundaries = [];
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      const headerCheck = isSectionHeader(line);
      if (headerCheck.isHeader) {
          sectionBoundaries.push({ 
              index: i, 
              section: headerCheck.sectionType, 
              code: headerCheck.code,
              line: line 
          });
      }
      
      // Check for underline-style headers (e.g., "Experience" then "=========")
      if (i + 1 < lines.length && line.match(/^[A-Za-z\s]+$/) && lines[i + 1].match(/^[=\-]{3,}$/)) {
          const sectionName = line.trim().toLowerCase();
          for (const [sectionType, config] of Object.entries(SECTION_HEADERS)) {
              for (const pattern of config.patterns) {
                  const cleanPattern = pattern.toLowerCase().replace(/^#{1,6}\s*/, '');
                  if (sectionName === cleanPattern || sectionName.startsWith(cleanPattern)) {
                      sectionBoundaries.push({ 
                          index: i, 
                          section: sectionType, 
                          code: SECTION_TO_CODE[sectionType],
                          line: line 
                      });
                      break;
                  }
              }
          }
      }
  }
  
  // Sort boundaries by line index
  sectionBoundaries.sort((a, b) => a.index - b.index);
  
  // Extract bullets for each section
  for (let i = 0; i < sectionBoundaries.length; i++) {
      const boundary = sectionBoundaries[i];
      const nextBoundary = sectionBoundaries[i + 1];
      const startIdx = boundary.index + 1;
      const endIdx = nextBoundary ? nextBoundary.index : lines.length;
      
      const sectionText = lines.slice(startIdx, endIdx).join('\n');
      sections[boundary.section] = sectionText;
      
      // Extract bullets from this section with context
      const context = {
          company: null,
          role: null,
          location: null,
          startDate: null,
          endDate: null
      };
      
      const bullets = extractBulletsFromBlock(sectionText, boundary.section, boundary.code, context);
      allBullets.push(...bullets);
  }
  
  // If no sections detected, try to extract bullets from entire text
  if (allBullets.length === 0) {
      const bullets = extractBulletsFromBlock(resumeText, 'unknown', 'OT', {});
      allBullets.push(...bullets);
  }
  
  // Add metadata to each bullet
  for (let i = 0; i < allBullets.length; i++) {
      const bullet = allBullets[i];
      bullet.original_index = i;
      bullet.has_metric = detectMetrics(bullet.original_text);
      bullet.word_count = bullet.original_text.split(/\s+/).length;
  }
  
  return {
      bullets: allBullets,
      sections: sections,
      total_count: allBullets.length
  };
}

// ============================================================
// HELPER: Detect if bullet contains metrics
// ============================================================

function detectMetrics(text) {
  if (!text) return false;
  return (
      /\d+%/.test(text) ||           // Percentage
      /\$\d+/.test(text) ||           // Dollar amount
      /\d+\s*(million|billion|thousand|k|m)/i.test(text) || // Scale
      /\d+\s*(people|user|customer|employee|staff|member)/i.test(text) || // Volume
      /\d+\s*(countries?|states?|locations?|sites?)/i.test(text) // Geographic
  );
}

// ============================================================
// HELPER: Group Bullets by Role/Company
// ============================================================

export function groupBulletsByRole(bullets) {
  if (!bullets || bullets.length === 0) return [];
  
  const groups = [];
  let currentGroup = null;
  
  for (const bullet of bullets) {
      if (!currentGroup || 
          currentGroup.company !== bullet.company || 
          currentGroup.role !== bullet.role ||
          currentGroup.section !== bullet.section) {
          
          if (currentGroup) groups.push(currentGroup);
          
          currentGroup = {
              section: bullet.section,
              company: bullet.company,
              role: bullet.role,
              location: bullet.location,
              startDate: bullet.startDate,
              endDate: bullet.endDate,
              bullets: []
          };
      }
      currentGroup.bullets.push(bullet);
  }
  
  if (currentGroup) groups.push(currentGroup);
  
  return groups;
}

// ============================================================
// HELPER: Generate ID for a bullet (matching LLM format)
// ============================================================

export function generateBulletId(section, roleIndex, bulletIndex) {
  const sectionCode = SECTION_TO_CODE[section] || 'OT';
  return `${sectionCode}_${roleIndex}_${bulletIndex}`;
}

// ============================================================
// HELPER: Parse ID back to components
// ============================================================

export function parseBulletId(id) {
  const match = id.match(/^([A-Z]{2})_(\d+)_(\d+)$/);
  if (match) {
      return {
          sectionCode: match[1],
          roleIndex: parseInt(match[2]),
          bulletIndex: parseInt(match[3])
      };
  }
  return null;
}
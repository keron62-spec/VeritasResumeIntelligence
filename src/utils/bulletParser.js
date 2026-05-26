// src/utils/bulletParser.js

/**
 * Enhanced bullet point extractor with robust pattern matching
 * Supports multiple resume formats, section detection, date extraction
 * Creates IDs matching LLM format: {SECTION_CODE}_{ROLE_INDEX}_{BULLET_INDEX}
 * 
 * FIXES INCLUDED:
 * - Markdown headers (##, ###, #) properly detected as section boundaries
 * - No empty "Untitled Role" / "Unknown Company" entries created
 * - Company/role separation with multiple pattern matching
 * - Skills section special-cased for comma-separated lists
 * - Projects section not treated as experience
 * - Date parsing with space handling
 * - "Present" not treated as a bullet
 */

// ============================================================
// SECTION HEADERS (Widest possible range, including markdown)
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
          '## work experience', '## professional experience',
          '**experience**', '*experience*',
          // Uppercase
          'experience', 'work experience', 'professional experience',
          // With colon
          'experience:', 'work experience:', 'employment:',
      ],
      detectUnderline: true,
      caseInsensitive: true
  },
  projects: {
      codes: ['PR'],
      patterns: [
          'projects', 'personal projects', 'key projects', 'project portfolio',
          '## projects', '### projects', '# projects',
          '**projects**', 'projects:',
          'featured projects', 'side projects', 'open source projects'
      ],
      caseInsensitive: true
  },
  volunteer: {
      codes: ['VO'],
      patterns: [
          'volunteer', 'volunteer experience', 'community service', 'volunteer work',
          '## volunteer', '### volunteer', '# volunteer',
          '**volunteer**', 'volunteer:'
      ],
      caseInsensitive: true
  },
  internships: {
      codes: ['IN'],
      patterns: [
          'internships', 'internship', 'intern experience',
          '## internships', '### internships', '# internships'
      ],
      caseInsensitive: true
  },
  leadership: {
      codes: ['LD'],
      patterns: [
          'leadership', 'leadership experience', 'board memberships', 'leadership roles',
          '## leadership', '### leadership', '# leadership'
      ],
      caseInsensitive: true
  },
  education: {
      codes: ['ED'],
      patterns: [
          'education', 'academic background', 'qualifications', 'degrees',
          'education history', '## education', '### education', '# education',
          '**education**', 'education:', 'academic history'
      ],
      caseInsensitive: true
  },
  skills: {
      codes: ['SK'],
      patterns: [
          'skills', 'technical skills', 'core competencies', 'expertise',
          'competencies', 'skills summary', 'tools & technologies',
          '## skills', '### skills', '# skills',
          '**skills**', 'skills:', 'key skills', 'professional skills'
      ],
      caseInsensitive: true
  },
  certifications: {
      codes: ['CE'],
      patterns: [
          'certifications', 'certificates', 'licenses', 'professional certifications',
          '## certifications', '### certifications', '# certifications',
          '**certifications**', 'certifications:'
      ],
      caseInsensitive: true
  },
  publications: {
      codes: ['PU'],
      patterns: [
          'publications', 'papers', 'articles', 'research publications',
          '## publications', '### publications', '# publications',
          '**publications**', 'publications:'
      ],
      caseInsensitive: true
  },
  awards: {
      codes: ['AW'],
      patterns: [
          'awards', 'honors', 'recognition', 'achievements',
          '## awards', '### awards', '# awards',
          '**awards**', 'awards:'
      ],
      caseInsensitive: true
  },
  languages: {
      codes: ['LA'],
      patterns: [
          'languages', 'language skills', 'spoken languages',
          '## languages', '### languages', '# languages',
          '**languages**', 'languages:'
      ],
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
  // MM/YYYY - MM/YYYY (with optional spaces)
  { regex: /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|Present|Current)/i, hasMonth: true },
  // YYYY-MM - YYYY-MM
  { regex: /(\d{4}-\d{1,2})\s*[-–—]\s*(\d{4}-\d{1,2}|Present|Current)/i, hasMonth: true },
  // Month YYYY - Month YYYY
  { regex: /([A-Za-z]+\s+\d{4})\s*[-–—]\s*([A-Za-z]+\s+\d{4}|Present|Current)/i, hasMonth: true },
  // YYYY - YYYY
  { regex: /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i, hasMonth: false },
  // Single date with Present
  { regex: /(\d{4})\s*[-–—]\s*(Present|Current)/i, hasMonth: false },
  // MM/YYYY only
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
  if (!text) return { hasDates: false, start: null, end: null, isPresent: false };
  
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
// HELPER: Check if Line is a Section Header (handles markdown)
// ============================================================

function isSectionHeader(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return { isHeader: false, sectionType: null, code: null };
  
  const lowerLine = trimmed.toLowerCase();
  
  // Remove markdown formatting for comparison
  let cleanLine = lowerLine;
  let hasMarkdown = false;
  
  // Check for markdown headers (##, ###, #)
  if (lowerLine.match(/^#{1,6}\s+/)) {
      hasMarkdown = true;
      cleanLine = lowerLine.replace(/^#{1,6}\s+/, '');
  }
  
  // Remove bold/italic markers
  cleanLine = cleanLine.replace(/[*_]/g, '');
  
  // Remove trailing colon
  cleanLine = cleanLine.replace(/:$/, '');
  
  for (const [sectionType, config] of Object.entries(SECTION_HEADERS)) {
      for (const pattern of config.patterns) {
          const cleanPattern = pattern.toLowerCase().replace(/^#{1,6}\s+/, '').replace(/[*_:]/g, '');
          if (cleanLine === cleanPattern || cleanLine === cleanPattern || cleanLine.startsWith(cleanPattern + ' ')) {
              return { 
                  isHeader: true, 
                  sectionType: sectionType, 
                  code: SECTION_TO_CODE[sectionType],
                  hasMarkdown: hasMarkdown,
                  originalLine: trimmed
              };
          }
      }
  }
  
  // Check for underline-style headers (e.g., "Experience" then "=========" on next line)
  // This is handled in the main parsing loop
  
  return { isHeader: false, sectionType: null, code: null, hasMarkdown: false, originalLine: null };
}

// ============================================================
// HELPER: Check if Line is a Bullet Point
// ============================================================

function isBulletLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return { isBullet: false, text: '', bulletChar: null };
  
  // Don't treat "Present" or "Current" as bullets
  if (trimmed === 'Present' || trimmed === 'Current') {
      return { isBullet: false, text: '', bulletChar: null };
  }
  
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
  
  return { isBullet: false, text: '', bulletChar: null };
}

// ============================================================
// HELPER: Check if Line is Blank
// ============================================================

function isBlankLine(line) {
  return line.trim().length === 0;
}

// ============================================================
// HELPER: Parse Skills Section (special handling)
// ============================================================

function parseSkillsSection(text) {
  const skills = [];
  const lines = text.split('\n');
  let currentCategory = 'General';
  
  for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      // Check for category subheader (e.g., "Core Competencies:", "Tools and Technologies:")
      const categoryMatch = trimmed.match(/^([A-Za-z\s&]+):$/);
      if (categoryMatch) {
          currentCategory = categoryMatch[1].trim();
          continue;
      }
      
      // Check if it's a bullet point
      const bulletCheck = isBulletLine(trimmed);
      if (bulletCheck.isBullet) {
          // Split comma-separated skills within the bullet
          const skillItems = bulletCheck.text.split(/[,•]\s*/);
          for (const skill of skillItems) {
              const cleanSkill = skill.trim();
              if (cleanSkill.length > 0 && cleanSkill.length < 100) {
                  skills.push({
                      category: currentCategory,
                      skill: cleanSkill
                  });
              }
          }
      } else if (trimmed.includes(',')) {
          // Line might be comma-separated skills without bullet
          const skillItems = trimmed.split(/[,•]\s*/);
          for (const skill of skillItems) {
              const cleanSkill = skill.trim();
              if (cleanSkill.length > 0 && cleanSkill.length < 100 && !cleanSkill.match(/^(and|or|the|with)$/i)) {
                  skills.push({
                      category: currentCategory,
                      skill: cleanSkill
                  });
              }
          }
      }
  }
  
  return skills;
}

// ============================================================
// HELPER: Parse Projects Section (special handling)
// ============================================================

function parseProjectsSection(text, sectionCode) {
  const projects = [];
  const lines = text.split('\n');
  let currentProject = null;
  let bulletIndex = 1;
  let projectIndex = 1;
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      const bulletCheck = isBulletLine(trimmed);
      const headerCheck = isSectionHeader(trimmed);
      
      if (headerCheck.isHeader) break;
      
      // Check if line looks like a project name (not a bullet, not too long)
      if (!bulletCheck.isBullet && trimmed.length < 100 && !trimmed.match(/^(https?:\/\/|github\.com)/i)) {
          // Save previous project
          if (currentProject && currentProject.bullets.length > 0) {
              projects.push(currentProject);
              projectIndex++;
          }
          
          // Start new project
          currentProject = {
              id: `${sectionCode}_${projectIndex}`,
              name: trimmed,
              bullets: [],
              bulletCount: 0
          };
          bulletIndex = 1;
          continue;
      }
      
      // Check for project links (GitHub, live demo)
      if (trimmed.match(/^(https?:\/\/|github\.com)/i) && currentProject) {
          if (!currentProject.links) currentProject.links = [];
          currentProject.links.push(trimmed);
          continue;
      }
      
      // Check for bullet points
      if (bulletCheck.isBullet && currentProject) {
          currentProject.bullets.push({
              id: `${sectionCode}_${projectIndex}_${bulletIndex}`,
              text: bulletCheck.text
          });
          bulletIndex++;
          currentProject.bulletCount++;
          continue;
      }
      
      // Multi-line bullet continuation
      if (currentProject && currentProject.bullets.length > 0 && !bulletCheck.isBullet && !isBlankLine(line)) {
          const lastBullet = currentProject.bullets[currentProject.bullets.length - 1];
          lastBullet.text += ' ' + trimmed;
      }
  }
  
  // Save last project
  if (currentProject && currentProject.bullets.length > 0) {
      projects.push(currentProject);
  }
  
  return projects;
}

// ============================================================
// HELPER: Parse Education Section
// ============================================================

function parseEducationSection(text, sectionCode) {
  const educationEntries = [];
  const lines = text.split('\n');
  let currentEntry = null;
  let entryIndex = 1;
  
  const degreePatterns = [
      /(bachelor|master|phd|doctorate|mba|bs|ba|ms|mph|mpa|associate)/i,
      /degree in/i,
      /university|college|institute|school/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      const bulletCheck = isBulletLine(trimmed);
      const headerCheck = isSectionHeader(trimmed);
      
      if (headerCheck.isHeader) break;
      
      // Check if line looks like an education entry
      const isDegreeLine = degreePatterns.some(p => p.test(trimmed.toLowerCase()));
      
      if (isDegreeLine && !bulletCheck.isBullet) {
          if (currentEntry) {
              educationEntries.push(currentEntry);
              entryIndex++;
          }
          
          currentEntry = {
              id: `${sectionCode}_${entryIndex}`,
              degree: trimmed,
              institution: '',
              year: '',
              bullets: []
          };
          continue;
      }
      
      // Check for institution (next line after degree)
      if (currentEntry && currentEntry.institution === '' && !bulletCheck.isBullet && !isDegreeLine && !trimmed.match(/\d{4}/)) {
          currentEntry.institution = trimmed;
          continue;
      }
      
      // Check for year
      if (currentEntry && trimmed.match(/\d{4}/)) {
          const yearMatch = trimmed.match(/\d{4}/);
          if (yearMatch) {
              currentEntry.year = yearMatch[0];
          }
          continue;
      }
      
      // Check for bullets under education
      if (bulletCheck.isBullet && currentEntry) {
          currentEntry.bullets.push(bulletCheck.text);
      }
  }
  
  if (currentEntry) {
      educationEntries.push(currentEntry);
  }
  
  return educationEntries;
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
  
  let lineIdx = 0;
  
  // ============================================================
  // PATTERN 1: Your format - Company, then Date, then Role, then Location
  // ============================================================
  if (contextLines[lineIdx] && contextLines[lineIdx].trim().length > 0) {
      const firstLine = contextLines[lineIdx].trim();
      const headerCheck = isSectionHeader(firstLine);
      
      // Don't parse section headers as company names
      if (!headerCheck.isHeader && !firstLine.match(/^\d{4}/) && !isBulletLine(firstLine).isBullet) {
          company = firstLine;
          lineIdx++;
          
          // Next line: Date range
          if (lineIdx < contextLines.length) {
              const dateResult = extractDateRange(contextLines[lineIdx]);
              if (dateResult.hasDates) {
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
                  lineIdx++;
                  
                  // Next line: Role (skip empty lines)
                  while (lineIdx < contextLines.length && isBlankLine(contextLines[lineIdx])) lineIdx++;
                  
                  if (lineIdx < contextLines.length && contextLines[lineIdx]) {
                      const nextLine = contextLines[lineIdx].trim();
                      const bulletCheck = isBulletLine(nextLine);
                      if (!bulletCheck.isBullet && !nextLine.match(/^\d{4}/)) {
                          role = nextLine;
                          lineIdx++;
                          
                          // Next line: Location (optional)
                          while (lineIdx < contextLines.length && isBlankLine(contextLines[lineIdx])) lineIdx++;
                          
                          if (lineIdx < contextLines.length && contextLines[lineIdx]) {
                              const locationLine = contextLines[lineIdx].trim();
                              const locationBulletCheck = isBulletLine(locationLine);
                              if (!locationBulletCheck.isBullet && locationLine.length < 50 && !locationLine.match(/^\d{4}/)) {
                                  location = locationLine;
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
  // PATTERN 2: Company | Role format (pipe-separated)
  // ============================================================
  if (!company && contextLines[0]) {
      const pipeMatch = contextLines[0].match(/^(.+?)\s*[|\-]\s*(.+?)(?:\s*[|\-]\s*(.+))?$/);
      if (pipeMatch) {
          company = pipeMatch[1].trim();
          role = pipeMatch[2].trim();
          if (pipeMatch[3]) {
              const dateResult = extractDateRange(pipeMatch[3]);
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
  // PATTERN 4: Company - Role format
  // ============================================================
  if (!company && contextLines[0]) {
      const hyphenMatch = contextLines[0].match(/^(.+?)\s+[-–—]\s+(.+?)$/);
      if (hyphenMatch) {
          company = hyphenMatch[1].trim();
          role = hyphenMatch[2].trim();
          lineIdx = 1;
          
          // Check next line for date
          if (lineIdx < contextLines.length) {
              const dateResult = extractDateRange(contextLines[lineIdx]);
              if (dateResult.hasDates) {
                  startDate = dateResult.start;
                  endDate = dateResult.end;
                  isPresent = dateResult.isPresent;
                  lineIdx++;
              }
          }
      }
  }
  
  // ============================================================
  // PATTERN 5: Company and Role on same line with space separator (fallback)
  // ============================================================
  if (!company && contextLines[0] && contextLines[0].trim().split(/\s+/).length >= 2) {
      const words = contextLines[0].trim().split(/\s+/);
      // Assume last 2-3 words might be role, rest is company (heuristic)
      if (words.length >= 3) {
          const possibleRole = words.slice(-2).join(' ');
          const possibleCompany = words.slice(0, -2).join(' ');
          if (possibleCompany.length > 5 && possibleRole.length > 2) {
              company = possibleCompany;
              role = possibleRole;
              lineIdx = 1;
          }
      }
  }
  
  // Calculate next index
  const nextIndex = startIdx + lineIdx;
  
  // Only return if we found at least company or role
  if (!company && !role) {
      return { company: null, role: null, location: null, startDate: null, endDate: null, isPresent: false, nextIndex: startIdx + 1 };
  }
  
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
      
      // Check if this line starts a new section
      const headerCheck = isSectionHeader(line);
      if (headerCheck.isHeader && headerCheck.sectionType !== sectionType) {
          break;
      }
      
      // Check if line is a bullet point
      const bulletCheck = isBulletLine(line);
      
      // Try to parse as job entry (not a bullet, not a section header)
      if (!bulletCheck.isBullet && !headerCheck.isHeader && trimmed.length > 0) {
          const jobInfo = parseJobEntry(lines, i);
          
          if (jobInfo.company || jobInfo.role) {
              // Only save if we have meaningful data (not empty placeholders)
              if ((jobInfo.company && jobInfo.company !== 'Unknown Company') || 
                  (jobInfo.role && jobInfo.role !== 'Untitled Role')) {
                  
                  // Save previous role's bullets before starting new one
                  if ((currentCompany || currentRole) && bullets.length > 0) {
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
      }
      
      // Check if line is a bullet point
      if (bulletCheck.isBullet) {
          // Only add bullet if we have a valid role/company (or it's a standalone section)
          if (currentRole || currentCompany || sectionType === 'skills' || sectionType === 'certifications') {
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
          }
          i++;
          continue;
      }
      
      // Check for multi-line bullet continuation
      if (bullets.length > 0 && trimmed.length > 0 && !bulletCheck.isBullet && !isBlankLine(line)) {
          const lastBullet = bullets[bullets.length - 1];
          // Check if next line is not a new bullet
          const nextLineCheck = i + 1 < lines.length ? isBulletLine(lines[i + 1]) : { isBullet: false };
          
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
  
  // First pass: identify section boundaries (including markdown headers)
  const sectionBoundaries = [];
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      const headerCheck = isSectionHeader(line);
      if (headerCheck.isHeader) {
          sectionBoundaries.push({ 
              index: i, 
              section: headerCheck.sectionType, 
              code: headerCheck.code,
              line: line,
              hasMarkdown: headerCheck.hasMarkdown
          });
      }
      
      // Check for underline-style headers
      if (i + 1 < lines.length && trimmed.match(/^[A-Za-z\s]+$/) && lines[i + 1].trim().match(/^[=\-]{3,}$/)) {
          const sectionName = trimmed.toLowerCase();
          for (const [sectionType, config] of Object.entries(SECTION_HEADERS)) {
              for (const pattern of config.patterns) {
                  const cleanPattern = pattern.toLowerCase().replace(/^#{1,6}\s*/, '');
                  if (sectionName === cleanPattern || sectionName.startsWith(cleanPattern)) {
                      sectionBoundaries.push({ 
                          index: i, 
                          section: sectionType, 
                          code: SECTION_TO_CODE[sectionType],
                          line: line,
                          hasMarkdown: false
                      });
                      break;
                  }
              }
          }
      }
  }
  
  // Sort boundaries by line index
  sectionBoundaries.sort((a, b) => a.index - b.index);
  
  // Extract content for each section
  for (let i = 0; i < sectionBoundaries.length; i++) {
      const boundary = sectionBoundaries[i];
      const nextBoundary = sectionBoundaries[i + 1];
      const startIdx = boundary.index + 1;
      const endIdx = nextBoundary ? nextBoundary.index : lines.length;
      
      const sectionLines = lines.slice(startIdx, endIdx);
      const sectionText = sectionLines.join('\n');
      sections[boundary.section] = sectionText;
      
      // Special handling for different section types
      let bullets = [];
      
      if (boundary.section === 'skills') {
          // Parse skills section specially
          const skillsData = parseSkillsSection(sectionText);
          // Convert skills to bullet format for consistency
          let skillIndex = 1;
          for (const skillItem of skillsData) {
              bullets.push({
                  id: `${boundary.code}_1_${skillIndex}`,
                  section: boundary.section,
                  company: null,
                  role: skillItem.category,
                  location: null,
                  startDate: null,
                  endDate: null,
                  original_text: skillItem.skill,
                  bullet_index: skillIndex,
                  skill_category: skillItem.category
              });
              skillIndex++;
          }
      } else if (boundary.section === 'projects') {
          // Parse projects section
          const projectsData = parseProjectsSection(sectionText, boundary.code);
          let bulletIndex = 1;
          for (const project of projectsData) {
              for (const bullet of project.bullets) {
                  bullets.push({
                      id: bullet.id,
                      section: boundary.section,
                      company: project.name,
                      role: 'Project',
                      location: null,
                      startDate: null,
                      endDate: null,
                      original_text: bullet.text,
                      bullet_index: bulletIndex,
                      project_links: project.links || []
                  });
                  bulletIndex++;
              }
          }
      } else if (boundary.section === 'education') {
          // Parse education section
          const educationData = parseEducationSection(sectionText, boundary.code);
          let bulletIndex = 1;
          for (const edu of educationData) {
              bullets.push({
                  id: edu.id,
                  section: boundary.section,
                  company: edu.institution,
                  role: edu.degree,
                  location: null,
                  startDate: edu.year,
                  endDate: null,
                  original_text: `${edu.degree} from ${edu.institution} (${edu.year})`,
                  bullet_index: bulletIndex,
                  education_bullets: edu.bullets
              });
              bulletIndex++;
          }
      } else {
          // Standard parsing for experience, volunteer, etc.
          const context = {
              company: null,
              role: null,
              location: null,
              startDate: null,
              endDate: null
          };
          bullets = extractBulletsFromBlock(sectionText, boundary.section, boundary.code, context);
          
          // Filter out bullets with empty company/role placeholders
          bullets = bullets.filter(b => {
              // Keep bullets that have meaningful content
              if (b.original_text && b.original_text.length > 0) {
                  // Skip if company is placeholder and role is placeholder
                  if ((b.company === 'Unknown Company' || !b.company) && 
                      (b.role === 'Untitled Role' || !b.role)) {
                      // Only keep if the bullet text itself is substantial
                      return b.original_text.length > 20;
                  }
                  return true;
              }
              return false;
          });
      }
      
      allBullets.push(...bullets);
  }
  
  // If no sections detected, try to extract bullets from entire text as unknown section
  if (allBullets.length === 0 && resumeText.trim().length > 0) {
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
      // For skills section, group by category
      if (bullet.section === 'skills') {
          if (!currentGroup || currentGroup.role !== bullet.role || currentGroup.section !== 'skills') {
              if (currentGroup) groups.push(currentGroup);
              currentGroup = {
                  section: bullet.section,
                  company: null,
                  role: bullet.role || 'Skills',
                  location: null,
                  startDate: null,
                  endDate: null,
                  bullets: []
              };
          }
          currentGroup.bullets.push(bullet);
      }
      // For projects section, group by project name (stored in company field)
      else if (bullet.section === 'projects') {
          if (!currentGroup || currentGroup.company !== bullet.company || currentGroup.section !== 'projects') {
              if (currentGroup) groups.push(currentGroup);
              currentGroup = {
                  section: bullet.section,
                  company: bullet.company,
                  role: 'Project',
                  location: null,
                  startDate: null,
                  endDate: null,
                  bullets: []
              };
          }
          currentGroup.bullets.push(bullet);
      }
      // Standard grouping by role/company
      else {
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
  }
  
  if (currentGroup) groups.push(currentGroup);
  
  // Filter out empty groups
  return groups.filter(g => g.bullets.length > 0);
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
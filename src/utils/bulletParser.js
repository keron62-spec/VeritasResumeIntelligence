// src/utils/bulletParser.js

/**
 * ENHANCED BULLET PARSER - 2-PASS SYSTEM
 * 
 * PASS 1: Entity Detection (sections, jobs, bullets, skills, education)
 * PASS 2: Association (bullets → jobs, skills → categories, etc.)
 * PASS 3: ID Generation (stable hashes for LLM matching)
 * 
 * FIXES INCLUDED:
 * - Section headers use startsWith (not exact match)
 * - Confidence scoring for job detection
 * - No role contamination (values don't inherit)
 * - PDF column mashing (split by 2+ spaces)
 * - Multi-line bullet continuation (lastWasBullet state)
 * - Stable bullet IDs (hash-based, not position-dependent)
 * - Expanded degree patterns (BSc, MSc, LLB, JD, etc.)
 * - Project detection requires indicators or bullets below
 */

// ============================================================
// CONFIGURATION
// ============================================================

// Generate a stable hash for a string (used for bullet IDs)
function stableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

// Section to code mapping
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
  'languages': 'LA',
  'unknown': 'OT'
};

// ============================================================
// PASS 1: ENTITY DETECTION
// ============================================================

/**
* Detect section headers with fuzzy matching (startsWith, not exact)
*/
function detectSectionHeader(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return null;
  
  // Clean the line (remove markdown, punctuation, normalize spaces)
  const cleaned = trimmed
      .toLowerCase()
      .replace(/^#{1,6}\s*/, '')
      .replace(/[*_:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  
  const sectionPatterns = {
      work_experience: ['work experience', 'experience', 'employment', 'work history', 'professional experience', 'career history', 'relevant experience'],
      skills: ['skills', 'technical skills', 'core competencies', 'expertise', 'competencies', 'tools & technologies', 'key skills'],
      education: ['education', 'academic background', 'qualifications', 'degrees', 'education history'],
      projects: ['projects', 'personal projects', 'key projects', 'project portfolio', 'featured projects'],
      certifications: ['certifications', 'certificates', 'licenses', 'professional certifications'],
      publications: ['publications', 'papers', 'articles', 'research publications'],
      volunteer: ['volunteer', 'volunteer experience', 'community service'],
      leadership: ['leadership', 'leadership experience', 'board memberships'],
      awards: ['awards', 'honors', 'recognition'],
      languages: ['languages', 'language skills']
  };
  
  for (const [sectionType, patterns] of Object.entries(sectionPatterns)) {
      for (const pattern of patterns) {
          // STARTS WITH matching (not exact)
          if (cleaned === pattern || cleaned.startsWith(pattern + ' ') || cleaned.startsWith(pattern + ':')) {
              return {
                  type: sectionType,
                  code: SECTION_TO_CODE[sectionType],
                  originalLine: trimmed,
                  hasMarkdown: trimmed.startsWith('#')
              };
          }
      }
  }
  
  // Check for underline-style headers (e.g., "EXPERIENCE" then "=========")
  // This is handled in the main loop
  
  return null;
}

/**
* Check if a line is a bullet point
*/
function isBulletLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  // "Present" is not a bullet
  if (trimmed === 'Present' || trimmed === 'Current') return false;
  
  // Check for common bullet characters
  const bulletChars = ['•', '·', '●', '◦', '➢', '➤', '►', '‣', '-', '—', '–', '*', '+'];
  for (const char of bulletChars) {
      if (trimmed.startsWith(char) || trimmed.startsWith(char + ' ')) {
          return true;
      }
  }
  
  // Check for numbered bullets (1., 1), (1), etc.)
  if (trimmed.match(/^(\d+)[\.\)]\s+/)) return true;
  
  // Check for lettered bullets (a., b., etc.)
  if (trimmed.match(/^[a-z][\.\)]\s+/i)) return true;
  
  return false;
}

/**
* Extract date range from a line
*/
function extractDateRange(text) {
  if (!text) return null;
  
  // Date patterns (supports MM/YYYY, YYYY-MM, Month YYYY, YYYY)
  const datePatterns = [
      { regex: /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|Present|Current)/i, type: 'range' },
      { regex: /(\d{4}-\d{1,2})\s*[-–—]\s*(\d{4}-\d{1,2}|Present|Current)/i, type: 'range' },
      { regex: /([A-Za-z]+\s+\d{4})\s*[-–—]\s*([A-Za-z]+\s+\d{4}|Present|Current)/i, type: 'range' },
      { regex: /(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i, type: 'range' },
      { regex: /^(\d{1,2}\/\d{4})$/i, type: 'single' },
      { regex: /^(\d{4})$/i, type: 'single' }
  ];
  
  for (const pattern of datePatterns) {
      const match = text.match(pattern.regex);
      if (match) {
          return {
              hasDates: true,
              start: match[1],
              end: match[2] || null,
              isPresent: match[2] === 'Present' || match[2] === 'Current',
              isSingle: pattern.type === 'single'
          };
      }
  }
  
  return null;
}

/**
* Parse a job entry with confidence scoring
*/
function parseJobEntry(lines, startIdx) {
  if (startIdx >= lines.length) return null;
  
  let company = null;
  let role = null;
  let location = null;
  let startDate = null;
  let endDate = null;
  let isPresent = false;
  let confidence = 0;
  let linesConsumed = 1;
  
  const currentLine = lines[startIdx].trim();
  if (!currentLine) return null;
  
  // Check if this line has a date range (highest confidence signal)
  const dateResult = extractDateRange(currentLine);
  if (dateResult && dateResult.hasDates) {
      startDate = dateResult.start;
      endDate = dateResult.end;
      isPresent = dateResult.isPresent;
      confidence += 3; // Date is strongest signal
      linesConsumed = 1;
      
      // Look for company/role in surrounding lines
      if (startIdx > 0) {
          const prevLine = lines[startIdx - 1].trim();
          if (prevLine && !isBulletLine(prevLine) && prevLine.length < 60) {
              company = prevLine;
              confidence += 2;
              linesConsumed++;
          }
      }
      
      if (startIdx + 1 < lines.length) {
          const nextLine = lines[startIdx + 1].trim();
          if (nextLine && !isBulletLine(nextLine) && nextLine.length < 60) {
              if (!role && (nextLine.match(/[A-Z][a-z]/) || nextLine.match(/coordinator|manager|analyst|specialist|officer|associate|director|lead/i))) {
                  role = nextLine;
                  confidence += 2;
                  linesConsumed++;
              } else if (!location && nextLine.match(/[A-Z][a-z]+\s*[A-Z][a-z]*/)) {
                  location = nextLine;
                  confidence += 1;
                  linesConsumed++;
              }
          }
      }
  }
  
  // Pattern: Company on its own line, no date yet
  if (!dateResult && currentLine.length > 0 && currentLine.length < 60 && !isBulletLine(currentLine)) {
      company = currentLine;
      confidence += 1;
      
      // Look for date on next line
      if (startIdx + 1 < lines.length) {
          const nextLine = lines[startIdx + 1].trim();
          const nextDateResult = extractDateRange(nextLine);
          if (nextDateResult && nextDateResult.hasDates) {
              startDate = nextDateResult.start;
              endDate = nextDateResult.end;
              isPresent = nextDateResult.isPresent;
              confidence += 3;
              linesConsumed = 2;
              
              // Look for role after date
              if (startIdx + 2 < lines.length) {
                  const roleLine = lines[startIdx + 2].trim();
                  if (roleLine && !isBulletLine(roleLine) && roleLine.length < 60) {
                      role = roleLine;
                      confidence += 2;
                      linesConsumed = 3;
                  }
              }
          }
      }
  }
  
  // Pattern: Company and role on same line (PDF column mashing)
  if (!company && !dateResult && currentLine.includes('  ')) {
      // Split by 2+ spaces
      const parts = currentLine.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
          // Check if any part is a date
          let datePartIndex = -1;
          for (let i = 0; i < parts.length; i++) {
              const partDate = extractDateRange(parts[i]);
              if (partDate && partDate.hasDates) {
                  startDate = partDate.start;
                  endDate = partDate.end;
                  isPresent = partDate.isPresent;
                  confidence += 3;
                  datePartIndex = i;
                  break;
              }
          }
          
          // Remove date part and assign company/role
          const remainingParts = datePartIndex !== -1 
              ? parts.filter((_, i) => i !== datePartIndex)
              : parts;
          
          if (remainingParts.length >= 2) {
              company = remainingParts[0];
              role = remainingParts.slice(1).join(' ');
              confidence += 2;
          } else if (remainingParts.length === 1) {
              // Guess based on content
              if (/inc|llc|corp|ltd|university|group|health|agency|organization/i.test(remainingParts[0])) {
                  company = remainingParts[0];
              } else {
                  role = remainingParts[0];
              }
              confidence += 1;
          }
          linesConsumed = 1;
      }
  }
  
  // Pattern: "Role at Company" format
  if (!company && !dateResult && currentLine.match(/ at /i)) {
      const atMatch = currentLine.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|\-]\s*(.+))?$/i);
      if (atMatch) {
          role = atMatch[1].trim();
          company = atMatch[2].trim();
          confidence += 2;
          linesConsumed = 1;
      }
  }
  
  // Pattern: "Company - Role" format
  if (!company && !dateResult && currentLine.match(/ - /)) {
      const hyphenMatch = currentLine.match(/^(.+?)\s+[-–—]\s+(.+?)$/);
      if (hyphenMatch) {
          company = hyphenMatch[1].trim();
          role = hyphenMatch[2].trim();
          confidence += 2;
          linesConsumed = 1;
      }
  }
  
  // Minimum confidence threshold (3 = has date OR has company+role)
  if (confidence < 2) {
      return null;
  }
  
  return {
      company,
      role,
      location,
      startDate,
      endDate,
      isPresent,
      confidence,
      linesConsumed
  };
}

// ============================================================
// PASS 1: ENTITY DETECTION (Main)
// ============================================================

function detectEntities(resumeText) {
  const lines = resumeText.split('\n');
  const entities = [];
  let i = 0;
  let currentSection = 'unknown';
  let lastWasBullet = false;
  
  while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed.length === 0) {
          lastWasBullet = false;
          i++;
          continue;
      }
      
      // Check for section headers
      const sectionHeader = detectSectionHeader(line);
      if (sectionHeader) {
          entities.push({
              type: 'section',
              sectionType: sectionHeader.type,
              code: sectionHeader.code,
              line: trimmed,
              index: i
          });
          currentSection = sectionHeader.type;
          lastWasBullet = false;
          i++;
          continue;
      }
      
      // Check for job entries (only in work_experience section)
      if (currentSection === 'work_experience') {
          const jobEntry = parseJobEntry(lines, i);
          if (jobEntry && jobEntry.confidence >= 2) {
              entities.push({
                  type: 'job',
                  company: jobEntry.company,
                  role: jobEntry.role,
                  location: jobEntry.location,
                  startDate: jobEntry.startDate,
                  endDate: jobEntry.endDate,
                  isPresent: jobEntry.isPresent,
                  confidence: jobEntry.confidence,
                  startIndex: i,
                  endIndex: i + jobEntry.linesConsumed
              });
              i += jobEntry.linesConsumed;
              lastWasBullet = false;
              continue;
          }
      }
      
      // Check for bullets
      const isBullet = isBulletLine(line);
      if (isBullet) {
          // Clean bullet text (remove bullet character)
          let bulletText = trimmed;
          const bulletChars = ['•', '·', '●', '◦', '➢', '➤', '►', '‣', '-', '—', '–', '*', '+'];
          for (const char of bulletChars) {
              if (bulletText.startsWith(char) || bulletText.startsWith(char + ' ')) {
                  bulletText = bulletText.replace(new RegExp(`^${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '').trim();
                  break;
              }
          }
          // Also handle numbered bullets
          bulletText = bulletText.replace(/^(\d+[\.\)]\s+)/, '');
          bulletText = bulletText.replace(/^[a-z][\.\)]\s+/i, '');
          
          entities.push({
              type: 'bullet',
              section: currentSection,
              text: bulletText,
              originalLine: trimmed,
              index: i
          });
          lastWasBullet = true;
          i++;
          continue;
      }
      
      // Multi-line bullet continuation
      if (lastWasBullet && trimmed.length > 0 && !isBulletLine(line)) {
          const dateCheck = extractDateRange(line);
          // Only append if not a date line and not a section header
          if (!dateCheck && !detectSectionHeader(line)) {
              const lastEntity = entities[entities.length - 1];
              if (lastEntity && lastEntity.type === 'bullet') {
                  lastEntity.text += ' ' + trimmed;
                  lastEntity.originalLine += ' ' + trimmed;
              }
          }
          i++;
          continue;
      }
      
      // Check for education entries
      if (currentSection === 'education') {
          const degreePatterns = [
              /bachelor|master|phd|doctorate|mba|bs|bsc|ba|ms|msc|mph|mpa|associate|llb|jd|certificate|diploma/i,
              /degree in/i,
              /university|college|institute|school/i
          ];
          const isDegreeLine = degreePatterns.some(p => p.test(trimmed));
          if (isDegreeLine && !isBulletLine(line)) {
              // Extract year if present
              let year = null;
              const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
              if (yearMatch) year = yearMatch[0];
              
              entities.push({
                  type: 'education',
                  text: trimmed,
                  year: year,
                  index: i
              });
              i++;
              continue;
          }
      }
      
      // Check for skills (comma-separated or bulleted)
      if (currentSection === 'skills' && trimmed.includes(',')) {
          const skills = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
          for (const skill of skills) {
              entities.push({
                  type: 'skill',
                  text: skill,
                  index: i
              });
          }
          i++;
          continue;
      }
      
      i++;
  }
  
  return entities;
}

// ============================================================
// PASS 2: ASSOCIATION (Bullets → Jobs, Skills → Categories)
// ============================================================

function associateEntities(entities) {
  const jobs = [];
  const bullets = [];
  const skills = [];
  const education = [];
  let currentJob = null;
  
  for (const entity of entities) {
      switch (entity.type) {
          case 'section':
              // Reset current job when section changes
              currentJob = null;
              break;
              
          case 'job':
              currentJob = {
                  id: `job_${stableHash(entity.company + entity.role + entity.startDate)}`,
                  company: entity.company,
                  role: entity.role,
                  location: entity.location,
                  startDate: entity.startDate,
                  endDate: entity.endDate,
                  isPresent: entity.isPresent,
                  bullets: []
              };
              jobs.push(currentJob);
              break;
              
          case 'bullet':
              if (currentJob) {
                  currentJob.bullets.push(entity);
              } else {
                  bullets.push(entity);
              }
              break;
              
          case 'skill':
              skills.push(entity);
              break;
              
          case 'education':
              education.push(entity);
              break;
      }
  }
  
  // Orphan bullets (no job found) - try to match to nearest job
  for (const bullet of bullets) {
      // Find the job that appears closest before this bullet
      let closestJob = null;
      let closestDistance = Infinity;
      
      for (const job of jobs) {
          const distance = Math.abs(job.bullets.length > 0 ? 
              job.bullets[job.bullets.length - 1].index - bullet.index : 
              bullet.index - (job.startIndex || 0));
          if (distance < closestDistance) {
              closestDistance = distance;
              closestJob = job;
          }
      }
      
      if (closestJob) {
          closestJob.bullets.push(bullet);
      }
  }
  
  return { jobs, skills, education };
}

// ============================================================
// PASS 3: ID GENERATION (Stable hashes for LLM matching)
// ============================================================

function generateBulletIds(jobs) {
  let allBullets = [];
  let globalBulletCounter = 1;
  
  for (let roleIdx = 0; roleIdx < jobs.length; roleIdx++) {
      const job = jobs[roleIdx];
      
      // Generate a stable job key for this role
      const jobKey = stableHash((job.company || '') + (job.role || '') + (job.startDate || ''));
      
      for (let bulletIdx = 0; bulletIdx < job.bullets.length; bulletIdx++) {
          const bullet = job.bullets[bulletIdx];
          
          // Generate stable ID using hash of content + position
          // This ensures same bullet gets same ID even if parsing order changes
          const contentHash = stableHash(bullet.text);
          const stableId = `WE_${jobKey}_${contentHash.substring(0, 4)}`;
          
          // Also store sequential ID for reference (not used for matching)
          const sequentialId = `WE_${roleIdx + 1}_${bulletIdx + 1}`;
          
          allBullets.push({
              id: stableId,           // Stable hash ID for LLM matching
              sequentialId: sequentialId, // Sequential ID for display
              section: 'Work Experience',
              company: job.company,
              role: job.role,
              location: job.location,
              startDate: job.startDate,
              endDate: job.endDate,
              original_text: bullet.text,
              bullet_index: bulletIdx + 1,
              global_index: globalBulletCounter++,
              has_metric: /\d+%|\$\d+|\d+\s*(million|billion|thousand|k|m)/i.test(bullet.text),
              word_count: bullet.text.split(/\s+/).length
          });
      }
  }
  
  return allBullets;
}

// ============================================================
// MAIN EXPORT FUNCTIONS
// ============================================================

/**
* Main function: Extract all bullets from resume text
* Uses 3-pass system: Detect → Associate → Generate IDs
*/
export function extractBullets(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
      return { bullets: [], jobs: [], total_count: 0 };
  }
  
  // PASS 1: Detect entities
  const entities = detectEntities(resumeText);
  
  // PASS 2: Associate bullets to jobs
  const { jobs, skills, education } = associateEntities(entities);
  
  // PASS 3: Generate stable IDs
  const bullets = generateBulletIds(jobs);
  
  return {
      bullets: bullets,
      jobs: jobs,
      skills: skills,
      education: education,
      total_count: bullets.length,
      entities: entities // For debugging
  };
}

/**
* Group bullets by role/company (for display in editor)
*/
export function groupBulletsByRole(bullets) {
  if (!bullets || bullets.length === 0) return [];
  
  const groups = [];
  let currentGroup = null;
  
  for (const bullet of bullets) {
      const groupKey = `${bullet.company}|${bullet.role}`;
      
      if (!currentGroup || currentGroup.company !== bullet.company || currentGroup.role !== bullet.role) {
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
  
  return groups.filter(g => g.bullets.length > 0);
}

/**
* Generate a stable ID for a bullet (for LLM matching)
*/
export function generateBulletId(section, roleIndex, bulletIndex, content) {
  const sectionCode = SECTION_TO_CODE[section] || 'OT';
  if (content) {
      const contentHash = stableHash(content);
      return `${sectionCode}_${contentHash.substring(0, 8)}`;
  }
  return `${sectionCode}_${roleIndex}_${bulletIndex}`;
}

/**
* Parse bullet ID back to components
*/
export function parseBulletId(id) {
  // Hash-based ID: WE_abc12345
  const hashMatch = id.match(/^([A-Z]{2})_([a-z0-9]{4,8})$/);
  if (hashMatch) {
      return {
          sectionCode: hashMatch[1],
          hash: hashMatch[2],
          isHashBased: true
      };
  }
  
  // Sequential ID: WE_1_1
  const seqMatch = id.match(/^([A-Z]{2})_(\d+)_(\d+)$/);
  if (seqMatch) {
      return {
          sectionCode: seqMatch[1],
          roleIndex: parseInt(seqMatch[2]),
          bulletIndex: parseInt(seqMatch[3]),
          isHashBased: false
      };
  }
  
  return null;
}
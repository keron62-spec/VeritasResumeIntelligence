// src/utils/bulletParser.js

/**
 * Enhanced bullet point and section parser for resumes
 * Extracts: Work Experience, Education, Skills, Certifications, Projects, 
 *           Publications, Volunteer, Awards, Languages, and Custom sections
 * 100% deterministic using pattern matching and section detection
 */

// ============================================================
// SECTION HEADERS (Case insensitive)
// ============================================================
const SECTION_HEADERS = {
  // Core Sections
  work_experience: [
      'work experience', 'experience', 'employment', 'work history',
      'professional experience', 'career history', 'relevant experience',
      'professional background', 'work', 'employment history'
  ],
  education: [
      'education', 'academic background', 'qualifications', 'education history',
      'degrees', 'academic credentials', 'schooling', 'educational background'
  ],
  skills: [
      'skills', 'technical skills', 'core competencies', 'expertise',
      'skills summary', 'competencies', 'professional skills', 'key skills',
      'technology skills', 'technical proficiencies'
  ],
  
  // Specialized Sections
  certifications: [
      'certifications', 'certificates', 'professional certifications', 'licenses',
      'certification', 'licenses & certifications', 'credentials',
      'industry certifications', 'professional licenses'
  ],
  projects: [
      'projects', 'key projects', 'personal projects', 'project portfolio',
      'featured projects', 'academic projects', 'side projects'
  ],
  publications: [
      'publications', 'papers', 'articles', 'research publications',
      'published work', 'books', 'journal articles', 'conference papers',
      'white papers', 'technical publications'
  ],
  volunteer: [
      'volunteer', 'volunteer experience', 'community service', 'volunteer work',
      'civic engagement', 'community involvement', 'pro bono'
  ],
  awards: [
      'awards', 'honors', 'recognition', 'achievements',
      'honors & awards', 'accolades', 'distinctions'
  ],
  languages: [
      'languages', 'language proficiency', 'foreign languages',
      'spoken languages', 'language skills'
  ],
  
  // Leadership & Organizations
  leadership: [
      'leadership', 'leadership experience', 'board memberships',
      'executive leadership', 'team leadership'
  ],
  organizations: [
      'organizations', 'professional affiliations', 'memberships',
      'association memberships', 'professional organizations'
  ],
  
  // Conference & Speaking
  speaking: [
      'speaking engagements', 'conferences', 'presentations',
      'invited talks', 'keynote speeches', 'workshops'
  ],
  
  // Patents & Intellectual Property
  patents: [
      'patents', 'intellectual property', 'ip', 'patent applications',
      'registered patents', 'patent filings'
  ],
  
  // Other Common Sections
  interests: [
      'interests', 'hobbies', 'personal interests', 'activities'
  ],
  references: [
      'references', 'professional references', 'available upon request'
  ]
};

// ============================================================
// COMMON BULLET CHARACTERS
// ============================================================
const BULLET_CHARS = ['•', '·', '●', '◦', '➢', '➤', '►', '‣', '-', '*', '+', '→', '✓', '✔', '▪', '▫'];

// ============================================================
// DATE PARSING HELPER
// ============================================================
function parseDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.trim().toLowerCase();
  
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

// ============================================================
// PARSE JOB HEADER (Company, Role, Dates, Location)
// ============================================================
function parseJobHeader(lines, startIdx) {
  let currentIdx = startIdx;
  let company = null;
  let location = null;
  let startDate = null;
  let endDate = null;
  let role = null;
  
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
  
  // Split by common separators
  const parts = remaining.split(/[•·●◦➢➤►‣|,;]/).map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length >= 1) company = parts[0];
  if (parts.length >= 2) location = parts[1];
  
  // Next line often contains role title (if not already captured)
  if (currentIdx + 1 < lines.length) {
      const roleLine = lines[currentIdx + 1].trim();
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

// ============================================================
// PARSE BULLETS FROM A BLOCK OF TEXT
// ============================================================
function extractBulletsFromBlock(blockText, section, context = {}) {
  const bullets = [];
  const lines = blockText.split('\n');
  
  let currentCompany = context.company || null;
  let currentRole = context.role || null;
  let bulletIndex = 1;
  let isParsingBullets = true;
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      
      // Check if this line starts a new job entry (contains company pattern)
      const hasCompanyIndicator = /[A-Z][a-z]+\s+(Agency|Limited|Group|Organization|Company|Corp|Inc|Ltd|PLC|LLC|University|College|Institute)/i.test(line);
      const hasDateRange = /\d{4}\s*[-–—]\s*\d{4}|\d{4}\s*[-–—]\s*Present/i.test(line);
      
      if ((hasCompanyIndicator || hasDateRange) && section === 'work_experience' && isParsingBullets) {
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
      } else if (section === 'skills') {
          // For skills section, treat comma-separated or space-separated lists
          const skillsFromLine = extractSkillsFromLine(line);
          for (const skill of skillsFromLine) {
              bullets.push({
                  id: `${section.substring(0, 2).toUpperCase()}_skill_${bulletIndex}`,
                  section: section,
                  company: null,
                  role: null,
                  original_text: skill,
                  bullet_index: bulletIndex
              });
              bulletIndex++;
          }
      } else if (section === 'certifications') {
          // For certifications, each line might be a certification or comma-separated
          const certsFromLine = extractCertificationsFromLine(line);
          for (const cert of certsFromLine) {
              bullets.push({
                  id: `${section.substring(0, 2).toUpperCase()}_cert_${bulletIndex}`,
                  section: section,
                  company: null,
                  role: null,
                  original_text: cert,
                  bullet_index: bulletIndex
              });
              bulletIndex++;
          }
      } else if (section === 'publications') {
          // For publications, each line is likely a citation
          if (line.length > 15) {
              bullets.push({
                  id: `${section.substring(0, 2).toUpperCase()}_pub_${bulletIndex}`,
                  section: section,
                  company: null,
                  role: null,
                  original_text: line,
                  bullet_index: bulletIndex,
                  citation: line
              });
              bulletIndex++;
          }
      }
  }
  
  return bullets;
}

// ============================================================
// EXTRACT SKILLS FROM A LINE (comma-separated or space-separated)
// ============================================================
function extractSkillsFromLine(line) {
  const skills = [];
  
  // Check if comma-separated
  if (line.includes(',')) {
      const parts = line.split(',');
      for (const part of parts) {
          const skill = part.trim();
          if (skill.length > 1 && skill.length < 50) {
              skills.push(skill);
          }
      }
  } else {
      // Try to detect common skill patterns
      const words = line.split(/\s+/);
      let currentSkill = [];
      for (const word of words) {
          if (word.length > 2 && /[A-Za-z]/.test(word)) {
              currentSkill.push(word);
          } else if (currentSkill.length > 0) {
              if (currentSkill.length > 0) {
                  skills.push(currentSkill.join(' '));
                  currentSkill = [];
              }
          }
      }
      if (currentSkill.length > 0) {
          skills.push(currentSkill.join(' '));
      }
  }
  
  return skills;
}

// ============================================================
// EXTRACT CERTIFICATIONS FROM A LINE
// ============================================================
function extractCertificationsFromLine(line) {
  const certs = [];
  
  if (line.includes(',')) {
      const parts = line.split(',');
      for (const part of parts) {
          const cert = part.trim();
          if (cert.length > 2 && cert.length < 60) {
              certs.push(cert);
          }
      }
  } else if (line.includes(';')) {
      const parts = line.split(';');
      for (const part of parts) {
          const cert = part.trim();
          if (cert.length > 2 && cert.length < 60) {
              certs.push(cert);
          }
      }
  } else {
      certs.push(line.trim());
  }
  
  return certs;
}

// ============================================================
// EXTRACT METADATA FROM BLOCK (dates, location, etc.)
// ============================================================
function extractMetadataFromBlock(blockText, section) {
  const metadata = {
      startDate: null,
      endDate: null,
      location: null,
      institution: null,
      degree: null
  };
  
  const lines = blockText.split('\n');
  for (const line of lines) {
      const trimmed = line.trim();
      
      // Extract dates
      const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|\bPresent\b)/i;
      const dateMatch = trimmed.match(datePattern);
      if (dateMatch) {
          metadata.startDate = dateMatch[1];
          metadata.endDate = dateMatch[2] === 'Present' ? 'Present' : dateMatch[2];
      }
      
      // For education section, try to extract degree and institution
      if (section === 'education') {
          const degreeMatch = trimmed.match(/^(Bachelor|Master|PhD|Associate|B\.S\.|B\.A\.|M\.S\.|M\.A\.|MBA|MPH|MDP)/i);
          if (degreeMatch) {
              metadata.degree = trimmed;
          }
          
          // Look for "University", "College", "Institute", "School"
          const institutionMatch = trimmed.match(/([A-Z][a-z]+ (?:University|College|Institute|School))/i);
          if (institutionMatch) {
              metadata.institution = institutionMatch[1];
          }
      }
  }
  
  return metadata;
}

// ============================================================
// DETECT SECTION BOUNDARIES IN RESUME
// ============================================================
function detectSectionBoundaries(lines) {
  const boundaries = [];
  
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      for (const [sectionName, headers] of Object.entries(SECTION_HEADERS)) {
          for (const header of headers) {
              // Match exact header or header followed by colon
              if (line === header || line === header + ':' || line.startsWith(header + ' ') || line.startsWith(header + '\t')) {
                  boundaries.push({ index: i, section: sectionName, line: line });
                  break;
              }
          }
      }
  }
  
  // Sort boundaries by line index
  boundaries.sort((a, b) => a.index - b.index);
  return boundaries;
}

// ============================================================
// EXTRACT TEXT FOR A SECTION
// ============================================================
function extractSectionText(lines, startIdx, endIdx) {
  return lines.slice(startIdx, endIdx).join('\n');
}

// ============================================================
// MAIN FUNCTION: EXTRACT ALL SECTIONS FROM RESUME
// ============================================================
export function extractBullets(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
      return { bullets: [], sections: {}, total_count: 0, categorized: {} };
  }
  
  const lines = resumeText.split('\n');
  const sectionBoundaries = detectSectionBoundaries(lines);
  
  const sections = {};
  const categorizedBullets = {
      work_experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      publications: [],
      volunteer: [],
      awards: [],
      languages: [],
      leadership: [],
      organizations: [],
      speaking: [],
      patents: [],
      interests: [],
      references: [],
      other: []
  };
  
  const allBullets = [];
  
  // Extract content for each section
  for (let i = 0; i < sectionBoundaries.length; i++) {
      const boundary = sectionBoundaries[i];
      const nextBoundary = sectionBoundaries[i + 1];
      const startIdx = boundary.index + 1;
      const endIdx = nextBoundary ? nextBoundary.index : lines.length;
      
      const sectionText = extractSectionText(lines, startIdx, endIdx);
      sections[boundary.section] = sectionText;
      
      // Extract bullets from this section
      const metadata = extractMetadataFromBlock(sectionText, boundary.section);
      const context = { company: metadata.institution, role: metadata.degree };
      const bullets = extractBulletsFromBlock(sectionText, boundary.section, context);
      
      // Add to categorized collections
      if (categorizedBullets[boundary.section]) {
          categorizedBullets[boundary.section].push(...bullets);
      } else {
          categorizedBullets.other.push(...bullets);
      }
      
      allBullets.push(...bullets);
  }
  
  // If no sections detected, try to extract bullets from entire text
  if (allBullets.length === 0) {
      const bullets = extractBulletsFromBlock(resumeText, 'unknown', {});
      allBullets.push(...bullets);
      categorizedBullets.other.push(...bullets);
  }
  
  return {
      bullets: allBullets,
      sections: sections,
      categorized: categorizedBullets,
      total_count: allBullets.length,
      section_summary: {
          work_experience: categorizedBullets.work_experience.length,
          education: categorizedBullets.education.length,
          skills: categorizedBullets.skills.length,
          certifications: categorizedBullets.certifications.length,
          projects: categorizedBullets.projects.length,
          publications: categorizedBullets.publications.length,
          volunteer: categorizedBullets.volunteer.length,
          awards: categorizedBullets.awards.length,
          languages: categorizedBullets.languages.length,
          other: categorizedBullets.other.length
      }
  };
}

// ============================================================
// GROUP BULLETS BY ROLE (for Work Experience section)
// ============================================================
export function groupBulletsByRole(bullets) {
  const groups = [];
  let currentGroup = null;
  
  // Filter only work experience bullets
  const workBullets = bullets.filter(b => b.section === 'work_experience' || b.section === 'work_experience' || b.section === 'Work Experience');
  
  for (const bullet of workBullets) {
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

// ============================================================
// HELPER: Get all skills as simple array
// ============================================================
export function getSkillsArray(resumeText) {
  const result = extractBullets(resumeText);
  return result.categorized.skills.map(s => s.original_text);
}

// ============================================================
// HELPER: Get all certifications as simple array
// ============================================================
export function getCertificationsArray(resumeText) {
  const result = extractBullets(resumeText);
  return result.categorized.certifications.map(c => c.original_text);
}

// ============================================================
// HELPER: Get all projects with their bullets
// ============================================================
export function getProjectsWithBullets(resumeText) {
  const result = extractBullets(resumeText);
  return result.categorized.projects.map(p => ({
      name: p.original_text,
      bullets: []
  }));
}

// ============================================================
// HELPER: Get all publications
// ============================================================
export function getPublicationsArray(resumeText) {
  const result = extractBullets(resumeText);
  return result.categorized.publications.map(p => p.citation || p.original_text);
}
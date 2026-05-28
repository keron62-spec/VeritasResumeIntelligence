// src/utils/bulletParser.js
// ============================================================
// VERITAS RESUME PARSER - V4.0
// Rebuilt from scratch. Clean, tested, production-ready.
//
// OUTPUT CONTRACT (what ResumeEditor.jsx expects):
//
//   parseResume(text) → {
//     jobs: [{
//       title: string,
//       company: string,
//       dates: string,          // "01/2021 - Present"
//       bullets: string[]       // plain strings, NOT objects
//     }],
//     skills: string[],
//     education: [{
//       text: string,           // degree line as-is
//       institution: string,
//       year: string
//     }],
//     certifications: string[],
//     projects: [],
//     publications: []
//   }
//
//   groupBulletsByJob(jobs) → same jobs array (pass-through for compatibility)
//
// ARCHITECTURE:
//   Single pass through lines.
//   Section detection gates which parser is active.
//   Job detection uses a look-ahead window (up to 3 lines) to find a
//   date range — this is the anchor that confirms a job block.
//   No confidence thresholds. No multi-pass association. No orphan matching.
//   When a date is found, everything between here and the date is the header.
//
// TESTED ON:
//   - Standard 3-section resume (CARPHA/PAHO style)
//   - Company-first layout (company on line 1, title on line 2)
//   - Title-first layout (title on line 1, company on line 2)
//   - "Role at Company" single-line format
//   - "Company – Role" single-line format
//   - Numbered bullets (1. 2. 3.)
//   - Month YYYY dates (January 2021 – Present)
//   - Year-only dates (2019 – 2022)
//   - Multi-line bullet continuation
//   - Empty string / null input (no crash)
// ============================================================


// ============================================================
// SECTION HEADER PATTERNS
// ============================================================
const SECTION_PATTERNS = {
    experience:     /^(work\s+experience|experience|employment|work\s+history|professional\s+experience|career\s+history|relevant\s+experience)$/i,
    education:      /^(education|academic\s+background|qualifications|academic\s+qualifications|degrees?)$/i,
    skills:         /^(skills|technical\s+skills|core\s+competencies|expertise|competencies|key\s+skills|tools\s+(&|and)\s+technologies)$/i,
    certifications: /^(certifications?|certificates?|licenses?|professional\s+certifications?|credentials?)$/i,
    projects:       /^(projects?|personal\s+projects?|key\s+projects?|project\s+portfolio)$/i,
    publications:   /^(publications?|papers?|articles?|research)$/i,
    summary:        /^(professional\s+summary|summary|profile|objective|about\s+me|executive\s+summary|career\s+objective)$/i,
  };
  
  // ============================================================
  // DATE RANGE PATTERN
  // Matches: MM/YYYY, Month YYYY, YYYY — with a separator — to the same or Present/Current
  // ============================================================
  const DATE_RANGE_RE = /(\d{1,2}\/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current)/i;
  
  
  // ============================================================
  // LINE CLASSIFICATION HELPERS
  // ============================================================
  
  function isBullet(line) {
    // Standard bullet characters with a space after
    if (/^[•·●◦➢➤►‣]\s+/.test(line)) return true;
    // Dash/hyphen/asterisk/plus with space — but NOT a date range like "2019 - 2022"
    if (/^[-—–*+]\s+/.test(line) && !DATE_RANGE_RE.test(line)) return true;
    // Numbered: "1. " or "1) " or "a. " or "a) "
    if (/^(\d+|[a-z])[.)]\s+/i.test(line)) return true;
    return false;
  }
  
  function cleanBullet(line) {
    return line
      .replace(/^[•·●◦➢➤►‣]\s+/, '')
      .replace(/^[-—–*+]\s+/, '')
      .replace(/^(\d+|[a-z])[.)]\s+/i, '')
      .trim();
  }
  
  function isLikelyJobTitle(line) {
    if (!line || line.length === 0 || line.length > 80) return false;
    if (isBullet(line)) return false;
    if (DATE_RANGE_RE.test(line)) return false;
    return /\b(coordinator|manager|analyst|specialist|officer|associate|director|lead|advisor|consultant|engineer|developer|designer|architect|administrator|supervisor|intern|head|chief|president|vice|deputy|senior|junior|principal|executive|scientist|researcher|planner|strategist|technician|programmer|accountant|auditor|lawyer|counsel|physician|nurse|pharmacist|epidemiologist|statistician)\b/i.test(line);
  }
  
  function isLikelyCompany(line) {
    if (!line || line.length === 0 || line.length > 80) return false;
    if (isBullet(line)) return false;
    if (DATE_RANGE_RE.test(line)) return false;
    // All-caps acronym (e.g. CARPHA, PAHO, WHO, IDB, UNDP)
    if (/^[A-Z]{2,10}$/.test(line)) return true;
    // Known org-type keywords
    return /\b(inc\.|llc|corp\.|ltd\.|limited|authority|agency|ministry|organization|organisation|university|college|institute|school|foundation|hospital|health|bank|group|company|services?|solutions?|systems?|consulting|international|national|regional|caribbean|paho|carpha|caricom|who|unicef|undp|unops|idb|iadb|cdb|world\s+bank|government|department|bureau|commission|council|secretariat|programme|program)\b/i.test(line);
  }
  
  function parseSkillLine(line) {
    // Split on comma, pipe, or semicolon
    return line
      .split(/[,|;]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 60);
  }
  
  
  // ============================================================
  // MAIN EXPORT: parseResume
  // ============================================================
  
  export function parseResume(text) {
    if (!text || typeof text !== 'string') {
      return { jobs: [], skills: [], education: [], certifications: [], projects: [], publications: [] };
    }
  
    const result = {
      jobs:           [],
      skills:         [],
      education:      [],
      certifications: [],
      projects:       [],
      publications:   []
    };
  
    const lines = text.split('\n').map(l => l.trim());
    let currentSection = 'unknown';
    let currentJob     = null;
    let i              = 0;
  
    while (i < lines.length) {
      const line = lines[i];
  
      // Skip blank lines
      if (!line) { i++; continue; }
  
      // ---- CHECK FOR SECTION HEADER ----
      let matched = false;
      for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(line)) {
          currentSection = sectionName;
          // When we leave the experience section, close the current job
          if (sectionName !== 'experience') currentJob = null;
          matched = true;
          break;
        }
      }
      if (matched) { i++; continue; }
  
      // ============================================================
      // EXPERIENCE SECTION
      // ============================================================
      if (currentSection === 'experience') {
  
        // --- Is this line itself a date range? ---
        const directDateMatch = line.match(DATE_RANGE_RE);
        if (directDateMatch) {
          // Attach dates to the current job if one exists
          if (currentJob) {
            currentJob.dates = `${directDateMatch[1]} - ${directDateMatch[2]}`;
          }
          i++; continue;
        }
  
        // --- Is this a bullet? ---
        if (isBullet(line)) {
          const bulletText = cleanBullet(line);
          if (bulletText.length > 3) {
            if (currentJob) {
              currentJob.bullets.push(bulletText);
            } else if (result.jobs.length > 0) {
              // Orphan bullet — attach to last known job
              result.jobs[result.jobs.length - 1].bullets.push(bulletText);
            }
          }
          i++; continue;
        }
  
        // --- Multi-line bullet continuation ---
        // If previous line was a bullet and this line is not a new header/bullet/date,
        // append it to the last bullet (handles wrapped text from PDF extraction)
        if (
          currentJob &&
          currentJob.bullets.length > 0 &&
          !isLikelyJobTitle(line) &&
          !isLikelyCompany(line) &&
          line.length < 140
        ) {
          // Look ahead — if there's a date within the next 2 lines, this is a NEW job header, not continuation
          let dateComingSoon = false;
          for (let look = 1; look <= 2; look++) {
            if (i + look < lines.length && DATE_RANGE_RE.test(lines[i + look])) {
              dateComingSoon = true; break;
            }
          }
          if (!dateComingSoon) {
            currentJob.bullets[currentJob.bullets.length - 1] += ' ' + line;
            i++; continue;
          }
        }
  
        // --- Potential job header line ---
        // Look ahead up to 3 lines for a date range. That confirms this is a job block.
        if (line.length > 0 && line.length < 80) {
          let dateAheadIdx = -1;
          let dateAheadStr = '';
  
          for (let look = 1; look <= 3; look++) {
            if (i + look >= lines.length) break;
            const lookLine = lines[i + look];
            if (!lookLine) continue;
            const lookDate = lookLine.match(DATE_RANGE_RE);
            if (lookDate) {
              dateAheadIdx = i + look;
              dateAheadStr = `${lookDate[1]} - ${lookDate[2]}`;
              break;
            }
          }
  
          if (dateAheadIdx !== -1) {
            // Collect all non-empty lines from current position up to (not including) the date line
            const headerLines = [];
            for (let h = i; h < dateAheadIdx; h++) {
              if (lines[h].trim()) headerLines.push(lines[h].trim());
            }
  
            let title   = '';
            let company = '';
  
            if (headerLines.length === 0) {
              // Shouldn't happen but be safe
              title = 'Unknown Role';
  
            } else if (headerLines.length === 1) {
              // Only one line — we don't know if it's title or company
              // Use content to guess: if it looks like a job title, use it as title
              title = headerLines[0];
  
            } else {
              // Two or more lines: determine which is title and which is company
              const line0 = headerLines[0];
              const line1 = headerLines[1];
  
              const line0isCompany = isLikelyCompany(line0) && !isLikelyJobTitle(line0);
              const line1isTitle   = isLikelyJobTitle(line1);
  
              if (line0isCompany && line1isTitle) {
                // Company came first — swap
                title   = line1;
                company = line0;
              } else {
                // Normal order: title first, company second
                title   = line0;
                company = line1;
              }
  
              // If there's a third header line and company is still empty, it might be a department
              if (headerLines.length >= 3 && !company) {
                company = headerLines[1];
              }
            }
  
            // Handle "Role at Company" single-line format
            const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|]\s*(.+))?$/i);
            if (atMatch) {
              title   = atMatch[1].trim();
              company = atMatch[2].trim();
            }
  
            // Handle "Company – Role" or "Company - Role" single-line format
            if (!atMatch) {
              const hyphenMatch = title.match(/^(.+?)\s+[-–—]\s+(.+)$/);
              if (hyphenMatch) {
                // Figure out which side is the company
                if (isLikelyCompany(hyphenMatch[1]) && isLikelyJobTitle(hyphenMatch[2])) {
                  company = hyphenMatch[1].trim();
                  title   = hyphenMatch[2].trim();
                } else if (isLikelyJobTitle(hyphenMatch[1])) {
                  title   = hyphenMatch[1].trim();
                  company = hyphenMatch[2].trim();
                }
                // Otherwise leave title as full line (ambiguous)
              }
            }
  
            currentJob = {
              title:   title   || 'Unknown Role',
              company: company || '',
              dates:   dateAheadStr,
              bullets: []
            };
            result.jobs.push(currentJob);
            i = dateAheadIdx + 1; // skip past the date line
            continue;
          }
        }
  
      }
  
      // ============================================================
      // EDUCATION SECTION
      // ============================================================
      else if (currentSection === 'education') {
        const isDegree = (
          /\b(bachelor|master|phd|ph\.d|doctorate|mba|b\.sc?|m\.sc?|b\.a\.|m\.a\.|mph|mpa|llb|jd|associate|diploma|certificate)\b/i.test(line) ||
          /\bdegree\b/i.test(line) ||
          /\bgraduated\b/i.test(line)
        );
  
        if (isDegree) {
          // Pull year from this line or the next two
          const yearInLine  = line.match(/\b(19|20)\d{2}\b/);
          const nextLine    = lines[i + 1] || '';
          const twoAhead    = lines[i + 2] || '';
          const yearInNext  = nextLine.match(/\b(19|20)\d{2}\b/);
          const yearInTwo   = twoAhead.match(/\b(19|20)\d{2}\b/);
          const yearStr     = (yearInLine || yearInNext || yearInTwo)?.[0] || '';
  
          // Institution is the line immediately after the degree line if it looks like a company/institution
          const institution = isLikelyCompany(nextLine) ? nextLine : '';
  
          result.education.push({
            text:        line,
            institution: institution,
            year:        yearStr
          });
        }
      }
  
      // ============================================================
      // SKILLS SECTION
      // ============================================================
      else if (currentSection === 'skills') {
        if (isBullet(line)) {
          result.skills.push(cleanBullet(line));
        } else if (line.includes(',') || line.includes('|') || line.includes(';')) {
          result.skills.push(...parseSkillLine(line));
        } else if (line.length > 0 && line.length < 60) {
          // Single skill on its own line
          result.skills.push(line);
        }
      }
  
      // ============================================================
      // CERTIFICATIONS SECTION
      // ============================================================
      else if (currentSection === 'certifications') {
        if (isBullet(line)) {
          result.certifications.push(cleanBullet(line));
        } else if (line.length > 0) {
          result.certifications.push(line);
        }
      }
  
      // ============================================================
      // PROJECTS SECTION
      // ============================================================
      else if (currentSection === 'projects') {
        if (isBullet(line)) {
          if (result.projects.length === 0) {
            result.projects.push({ name: 'Projects', bullets: [] });
          }
          result.projects[result.projects.length - 1].bullets.push(cleanBullet(line));
        } else if (line.length > 0 && !isBullet(line)) {
          result.projects.push({ name: line, bullets: [] });
        }
      }
  
      // ============================================================
      // PUBLICATIONS SECTION
      // ============================================================
      else if (currentSection === 'publications') {
        if (line.length > 0) {
          result.publications.push(line);
        }
      }
  
      i++;
    }
  
    // ---- POST-PROCESS: Fallback certification scan ----
    // If no certifications section was found, scan the full text for known cert patterns
    if (result.certifications.length === 0) {
      const certFallbackPatterns = [
        /\b(pmp|prince2|cissp|cism|cisa|csm|psm|pmi-acp|capm)\b/i,
        /\b(aws|azure|gcp)\s+(certified|associate|professional|architect|developer)\b/i,
        /\b(comptia|itil|six\s+sigma|togaf|cpa|cfa|frm|acca|cma)\b/i,
        /\bcertif(ied|ication|icate)\b.{0,60}\b(pmi|isc2|axelos|scrum\.org|isaca)\b/i,
      ];
      for (const l of lines) {
        if (
          certFallbackPatterns.some(p => p.test(l)) &&
          l.length < 120 &&
          !result.certifications.includes(l)
        ) {
          result.certifications.push(l);
        }
      }
    }
  
    // ---- POST-PROCESS: Deduplicate and clean ----
    result.skills         = [...new Set(result.skills.filter(s => s && s.length > 1))];
    result.certifications = [...new Set(result.certifications.filter(s => s && s.length > 1))];
  
    return result;
  }
  
  
  // ============================================================
  // COMPATIBILITY EXPORT: groupBulletsByJob
  // ResumeEditor imports this but the new editor uses roles[] directly.
  // This is a pass-through so the import doesn't break.
  // ============================================================
  
  export function groupBulletsByJob(jobs) {
    if (!jobs || !Array.isArray(jobs)) return [];
    return jobs;
  }
  
  
  // ============================================================
  // LEGACY COMPATIBILITY: extractBullets
  // Some other parts of the codebase may call extractBullets(text).
  // This wraps parseResume and returns the old expected shape.
  // ============================================================
  
  export function extractBullets(resumeText) {
    const parsed = parseResume(resumeText);
    const bullets = [];
    let globalIndex = 1;
  
    for (let roleIdx = 0; roleIdx < parsed.jobs.length; roleIdx++) {
      const job = parsed.jobs[roleIdx];
      for (let bulletIdx = 0; bulletIdx < job.bullets.length; bulletIdx++) {
        const text = job.bullets[bulletIdx];
        bullets.push({
          id:           `WE_${roleIdx + 1}_${bulletIdx + 1}`,
          section:      'Work Experience',
          role:         job.title,
          company:      job.company,
          startDate:    job.dates ? job.dates.split(' - ')[0] : '',
          endDate:      job.dates ? job.dates.split(' - ')[1] : '',
          original_text: text,
          has_metric:   /\d+%|\$\d+|\d+\s*(million|billion|thousand|k\b)/i.test(text),
          word_count:   text.split(/\s+/).length,
          global_index: globalIndex++,
        });
      }
    }
  
    return {
      bullets,
      jobs:        parsed.jobs,
      skills:      parsed.skills,
      education:   parsed.education,
      total_count: bullets.length,
    };
  }
// src/utils/bulletParser.js
// Production parser built for ResumeEditor.jsx state shape

const DEBUG = false;
const log = DEBUG ? console.log.bind(console) : () => {};

// ==========================================
// PATTERNS
// ==========================================

const SECTION_PATTERNS = {
  experience: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?(?:professional\s+)?(?:work\s+)?experience\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?employment\s*(?:history)?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?career\s+(?:history|experience)\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?relevant\s+experience\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?selected\s+experience\s*[:;]?\s*$/i,
  ],
  education: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?education\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?academic\s+(?:background|history)\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?qualifications\s*[:;]?\s*$/i,
  ],
  skills: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?skills?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?technical\s+skills?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?core\s+competencies\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?expertise\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?tools?\s*(?:and|&)\s*technologies\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?proficiencies\s*[:;]?\s*$/i,
  ],
  projects: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?projects?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?personal\s+projects?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?key\s+projects?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?project\s+portfolio\s*[:;]?\s*$/i,
  ],
  certifications: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?certifications?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?certificates?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?licenses?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?professional\s+certifications?\s*[:;]?\s*$/i,
  ],
  publications: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?publications?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?papers?\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?research\s*[:;]?\s*$/i,
  ],
  summary: [
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?summary\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?professional\s+summary\s*[:;]?\s*$/i,
    /^(?:[\s•·●◦➢➤►‣\-*]*\s*)?profile\s*[:;]?\s*$/i,
  ]
};

const BULLET_PATTERNS = [
  /^[\s]*[•·●◦➢➤►‣✓✔]\s+/,
  /^[\s]*[\-\*\+]\s+/,
  /^[\s]*\d+[\.\)]\s+/,
  /^[\s]*[a-zA-Z][\.\)]\s+/,
  /^[\s]*\[\s*[xX\s]?\]\s+/,
  /^[\s]*[→⇒›>]\s+/,
];

const DATE_REGEXES = [
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\s*[-–—]\s*(?:[A-Za-z]{3,9}\s+(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\b/i,
  /\b\d{1,2}\/(?:19|20)\d{2}\s*[-–—]\s*(?:\d{1,2}\/(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b\d{1,2}\/(?:19|20)\d{2}\b/,
  /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b(?:19|20)\d{2}\b/,
  /\b(?:Present|Current|Ongoing|Now)\b/i,
];

const COMPANY_KEYWORDS = /\b(?:inc\.?|llc|ltd\.?|corp\.?|corporation|university|college|institute|school|agency|health|organization|foundation|group|consulting|partners|llp|plc|gmbh|co\.?)\b/i;

const DEGREE_PATTERNS = [
  { regex: /\b(B\.?S\.?|Bachelor(?:'s|s)?\s+(?:of\s+)?(?:Science|Arts|Engineering|Business|Technology)|B\.?A\.?|B\.?E\.?|B\.?Tech|B\.?S\.?c\.?)\b/i, type: 'Bachelor' },
  { regex: /\b(M\.?S\.?|Master(?:'s|s)?\s+(?:of\s+)?(?:Science|Arts|Engineering|Business)|M\.?A\.?|M\.?E\.?|M\.?Tech|MBA|M\.?B\.?A\.?)\b/i, type: 'Master' },
  { regex: /\b(Ph\.?D\.?|Doctorate|D\.?Sc\.?|Doctor\s+of\s+Philosophy)\b/i, type: 'PhD' },
  { regex: /\b(A\.?S\.?|Associate(?:'s|s)?|A\.?A\.?)\b/i, type: 'Associate' },
  { regex: /\b(High\s+School|Diploma|GED|Certificate)\b/i, type: 'Other' },
];

// ==========================================
// UTILITIES
// ==========================================

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isBulletLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return BULLET_PATTERNS.some(p => p.test(trimmed));
}

function cleanBulletText(line) {
  const trimmed = line.trim();
  for (const p of BULLET_PATTERNS) {
    if (p.test(trimmed)) return trimmed.replace(p, '').trim();
  }
  return trimmed;
}

function isDateLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return DATE_REGEXES.some(r => r.test(trimmed));
}

function extractDateFromText(text) {
  for (const r of DATE_REGEXES) {
    const m = text.match(r);
    if (m) return m[0];
  }
  return '';
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  return dateStr
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

function isSectionHeader(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  for (const patterns of Object.values(SECTION_PATTERNS)) {
    for (const p of patterns) {
      if (p.test(trimmed)) return true;
    }
  }
  return false;
}

// ==========================================
// JOB HEADER LOGIC
// ==========================================

function parseJobHeader(headerText) {
  let trimmed = headerText.trim();
  if (!trimmed) return { company: '', title: '' };

  // Strip embedded dates so they don't pollute company/title
  const embeddedDate = extractDateFromText(trimmed);
  if (embeddedDate) {
    trimmed = trimmed.replace(embeddedDate, '').replace(/[,\-–—|]\s*$/, '').trim();
  }

  // "Title at Company"
  let m = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (m) return { company: m[2].trim(), title: m[1].trim() };

  // "Company | Title" or "Company - Title"
  m = trimmed.match(/^(.+?)\s+[-–—|]\s+(.+)$/);
  if (m) {
    const [first, second] = [m[1].trim(), m[2].trim()];
    const firstIsCompany = COMPANY_KEYWORDS.test(first) && !COMPANY_KEYWORDS.test(second);
    const secondIsCompany = COMPANY_KEYWORDS.test(second) && !COMPANY_KEYWORDS.test(first);
    if (secondIsCompany) return { company: second, title: first };
    if (firstIsCompany) return { company: first, title: second };
    return { company: first, title: second };
  }

  // "Title, Company"
  m = trimmed.match(/^(.+?),\s*(.+)$/);
  if (m) {
    const [first, second] = [m[1].trim(), m[2].trim()];
    const secondIsCompany = COMPANY_KEYWORDS.test(second) && !COMPANY_KEYWORDS.test(first);
    const firstIsCompany = COMPANY_KEYWORDS.test(first) && !COMPANY_KEYWORDS.test(second);
    if (secondIsCompany) return { company: second, title: first };
    if (firstIsCompany) return { company: first, title: second };
    if (second.length < first.length) return { company: second, title: first };
    return { company: first, title: second };
  }

  if (COMPANY_KEYWORDS.test(trimmed)) return { company: trimmed, title: '' };
  return { company: '', title: trimmed };
}

function isJobHeaderLine(line, nextLine, prevWasBullet) {
  const trimmed = line.trim();
  if (!trimmed || isBulletLine(trimmed) || isDateLine(trimmed) || isSectionHeader(trimmed)) return false;

  // Strong signals
  if (/\s[-–—|]\s/.test(trimmed)) return true;
  if (/\s+at\s+/i.test(trimmed)) return true;
  if (nextLine && isDateLine(nextLine)) return true;

  // Contains company keywords and date
  if (COMPANY_KEYWORDS.test(trimmed) && extractDateFromText(trimmed)) return true;

  // After bullets, require more structure to avoid swallowing continuations
  if (prevWasBullet) {
    if (trimmed.length < 50 && (trimmed.includes(',') || COMPANY_KEYWORDS.test(trimmed))) return true;
  }

  return false;
}

function isContinuationLine(line, prevBulletText) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isBulletLine(trimmed) || isDateLine(trimmed) || isSectionHeader(trimmed)) return false;
  if (isJobHeaderLine(trimmed, '', true)) return false;

  const prevEnded = prevBulletText ? prevBulletText.trim().slice(-1) : '';
  if ([':', ',', ';'].includes(prevEnded)) return true;
  if (/^[a-z]/.test(trimmed)) return true;
  if (trimmed.length < 40 && !/[.!?]$/.test(trimmed)) return true;

  return false;
}

// ==========================================
// SECTION SPLITTING
// ==========================================

function splitIntoSections(text) {
  log('📑 Splitting into sections...');
  const lines = text.split('\n');
  const sections = {
    experience: [], education: [], skills: [], projects: [],
    certifications: [], publications: [], summary: [], unknown: []
  };
  let current = 'unknown';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      sections[current].push(line);
      continue;
    }

    let found = null;
    for (const [name, patterns] of Object.entries(SECTION_PATTERNS)) {
      for (const p of patterns) {
        if (p.test(trimmed)) { found = name; break; }
      }
      if (found) break;
    }

    if (found) {
      current = found;
      log(`  Section: ${found}`);
      continue;
    }

    sections[current].push(line);
  }

  return sections;
}

// ==========================================
// EXPERIENCE PARSER
// ==========================================

function parseExperience(lines) {
  log('💼 Parsing experience...');
  if (!lines.length) return [];

  const jobs = [];
  let currentJob = null;
  let state = 'seeking_header';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (!trimmed) {
      if (state === 'in_bullets' && currentJob && currentJob.bullets.length > 0) {
        if (isJobHeaderLine(nextLine, lines[i + 2] ? lines[i + 2].trim() : '', true)) {
          jobs.push(currentJob);
          currentJob = null;
          state = 'seeking_header';
        }
      }
      continue;
    }

    const isBul = isBulletLine(trimmed);
    const isDate = isDateLine(trimmed);
    const isHead = isJobHeaderLine(trimmed, nextLine, state === 'in_bullets');

    if (state === 'seeking_header') {
      if (isHead) {
        currentJob = createJob();
        populateJobHeader(currentJob, trimmed);
        state = 'in_header';
      } else if (isDate) {
        currentJob = createJob();
        currentJob.dates = normalizeDate(trimmed);
        state = 'in_header';
      } else if (isBul) {
        currentJob = createJob();
        currentJob.bullets.push(cleanBulletText(trimmed));
        state = 'in_bullets';
      }
      continue;
    }

    if (state === 'in_header') {
      if (isDate) {
        currentJob.dates = normalizeDate(trimmed);
      } else if (isBul) {
        currentJob.bullets.push(cleanBulletText(trimmed));
        state = 'in_bullets';
      } else if (isHead) {
        jobs.push(currentJob);
        currentJob = createJob();
        populateJobHeader(currentJob, trimmed);
      } else {
        const dateInLine = extractDateFromText(trimmed);
        if (dateInLine) {
          currentJob.dates = normalizeDate(dateInLine);
        } else if (!currentJob.title && !currentJob.company) {
          const parsed = parseJobHeader(trimmed);
          if (parsed.title || parsed.company) {
            currentJob.title = parsed.title;
            currentJob.company = parsed.company;
          }
        }
      }
      continue;
    }

    if (state === 'in_bullets') {
      if (isHead) {
        jobs.push(currentJob);
        currentJob = createJob();
        populateJobHeader(currentJob, trimmed);
        state = 'in_header';
      } else if (isDate) {
        jobs.push(currentJob);
        currentJob = createJob();
        currentJob.dates = normalizeDate(trimmed);
        state = 'in_header';
      } else if (isBul) {
        currentJob.bullets.push(cleanBulletText(trimmed));
      } else {
        const lastBullet = currentJob.bullets[currentJob.bullets.length - 1] || '';
        if (isContinuationLine(trimmed, lastBullet)) {
          currentJob.bullets[currentJob.bullets.length - 1] += ' ' + trimmed;
        } else {
          currentJob.bullets.push(trimmed);
        }
      }
    }
  }

  if (currentJob) jobs.push(currentJob);

  for (const job of jobs) {
    if (!job.dates && job.header) {
      const d = extractDateFromText(job.header);
      if (d) job.dates = normalizeDate(d);
    }
    if (job.dates) {
      const parts = job.dates.split(' - ');
      job.startDate = parts[0] || '';
      job.endDate = parts[1] || '';
    }
  }

  log(`  Jobs: ${jobs.length}`);
  return jobs;
}

function createJob() {
  return { title: '', company: '', dates: '', startDate: '', endDate: '', bullets: [], header: '' };
}

function populateJobHeader(job, line) {
  const parsed = parseJobHeader(line);
  job.title = parsed.title;
  job.company = parsed.company;
  job.header = line.trim();
  const embeddedDate = extractDateFromText(line);
  if (embeddedDate) job.dates = normalizeDate(embeddedDate);
}

// ==========================================
// EDUCATION PARSER
// ==========================================

function parseEducation(lines) {
  log('🎓 Parsing education...');
  const entries = [];
  let buffer = [];

  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.join(' ').trim();
    buffer = [];
    if (!text) return;

    let degree = '';
    let institution = '';
    let year = '';
    let field = '';

    const dateMatch = extractDateFromText(text);
    if (dateMatch) year = dateMatch;

    for (const dp of DEGREE_PATTERNS) {
      const m = text.match(dp.regex);
      if (m) { degree = m[0]; break; }
    }

    let remaining = text.replace(degree, '').replace(year, '').replace(/[,\-–—|]\s*$/, '').trim();

    const instPatterns = [
      /(?:at|from)\s+([^,;]+)/i,
      /([^,;]+(?:University|College|Institute|School|Academy)[^,;]*)/i,
    ];
    for (const p of instPatterns) {
      const m = remaining.match(p);
      if (m) { institution = m[1].trim(); break; }
    }

    if (!institution) {
      const phrases = remaining.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 3);
      if (phrases.length) institution = phrases.reduce((a, b) => a.length > b.length ? a : b);
    }

    if (degree && institution) {
      const between = text.replace(degree, '').replace(institution, '').replace(year, '').trim();
      const cleaned = between.replace(/^[,\-–—|]\s*/, '').replace(/[,\-–—|]\s*$/, '').trim();
      if (cleaned && cleaned.length > 3 && cleaned.length < 100) field = cleaned;
    }

    entries.push({ text, degree, institution, year, field });
  };

  for (const line of lines) {
    if (line.trim() === '') flush();
    else buffer.push(line.trim());
  }
  flush();

  log(`  Education: ${entries.length}`);
  return entries;
}

// ==========================================
// SKILLS PARSER
// ==========================================

function parseSkills(lines) {
  log('🔧 Parsing skills...');
  const raw = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let text = isBulletLine(trimmed) ? cleanBulletText(trimmed) : trimmed;
    text = text.replace(/^[^:]+:\s*/, '');

    const parts = text.split(/[,;|•·●◦➢➤►‣]/)
      .map(p => p.trim())
      .filter(p => p && p.length > 1 && p.length < 50);

    raw.push(...parts);
  }

  const seen = new Set();
  const unique = [];
  for (const s of raw) {
    const cleaned = s.replace(/\.$/, '').trim();
    const lc = cleaned.toLowerCase();
    if (!seen.has(lc) && cleaned.length > 1) {
      seen.add(lc);
      unique.push(cleaned);
    }
  }

  log(`  Skills: ${unique.length}`);
  return unique;
}

// ==========================================
// CERTIFICATIONS PARSER
// ==========================================

function parseCertifications(lines) {
  log('🏆 Parsing certifications...');
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const text = isBulletLine(trimmed) ? cleanBulletText(trimmed) : trimmed;
    const date = extractDateFromText(text) || '';
    let body = text;
    if (date) body = body.replace(date, '').replace(/[,\-–—|]\s*$/, '').trim();

    let name = body;
    let issuer = '';
    const m = body.match(/^(.+?)\s+(?:[-–—|]\s+|,\s+)(.+)$/);
    if (m) {
      name = m[1].trim();
      issuer = m[2].trim();
    }

    let formatted = name;
    if (issuer) formatted += ` (${issuer})`;
    if (date) formatted += ` - ${date}`;

    out.push(formatted);
  }

  log(`  Certifications: ${out.length}`);
  return out;
}

// ==========================================
// PROJECTS PARSER
// ==========================================

function parseProjects(lines) {
  log('🚀 Parsing projects...');
  if (!lines.length) return [];

  const nonEmpty = lines.filter(l => l.trim());
  const bulletRatio = nonEmpty.filter(l => isBulletLine(l)).length / (nonEmpty.length || 1);
  const isBulletList = bulletRatio > 0.6;

  const projects = [];
  let current = null;

  const pushCurrent = () => {
    if (current && (current.name || current.bullets.length)) projects.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { pushCurrent(); continue; }

    if (isBulletLine(trimmed)) {
      if (!current) current = { name: '', bullets: [] };
      current.bullets.push(cleanBulletText(trimmed));
    } else {
      if (!current || current.bullets.length > 0) {
        pushCurrent();
        current = { name: trimmed, bullets: [] };
      } else {
        current.name = trimmed;
      }
    }
  }
  pushCurrent();

  if (isBulletList && projects.length === 1 && projects[0].name === '' && projects[0].bullets.length > 1) {
    return projects[0].bullets.map(b => ({ name: '', bullets: [b] }));
  }

  log(`  Projects: ${projects.length}`);
  return projects;
}

// ==========================================
// PUBLICATIONS PARSER
// ==========================================

function parsePublications(lines) {
  log('📝 Parsing publications...');
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    out.push(isBulletLine(trimmed) ? cleanBulletText(trimmed) : trimmed);
  }
  return out;
}

// ==========================================
// MAIN EXPORT
// ==========================================

export function parseResume(resumeText) {
  log('🔍 ========== RESUME PARSER ==========');

  if (!resumeText || typeof resumeText !== 'string') {
    return {
      success: false,
      error: 'No resume text provided',
      jobs: [], skills: [], education: [], certifications: [],
      projects: [], publications: [], allBullets: [],
      stats: { jobCount: 0, bulletCount: 0, skillCount: 0, educationCount: 0 }
    };
  }

  const normalized = normalizeText(resumeText);
  const sections = splitIntoSections(normalized);

  const jobs = parseExperience(sections.experience);
  const skills = parseSkills(sections.skills);
  const education = parseEducation(sections.education);
  const certifications = parseCertifications(sections.certifications);
  const projects = parseProjects(sections.projects);
  const publications = parsePublications(sections.publications);

  let bulletId = 1;
  const allBullets = [];

  for (const job of jobs) {
    for (const b of job.bullets) {
      allBullets.push({
        id: `bullet_${bulletId++}`,
        original_text: b,
        company: job.company,
        role: job.title,
        startDate: job.startDate,
        section: 'Work Experience'
      });
    }
  }

  for (const project of projects) {
    for (const b of project.bullets) {
      allBullets.push({
        id: `bullet_${bulletId++}`,
        original_text: b,
        company: project.name,
        role: 'Project',
        startDate: '',
        section: 'Projects'
      });
    }
  }

  const stats = {
    jobCount: jobs.length,
    bulletCount: allBullets.length,
    skillCount: skills.length,
    educationCount: education.length,
    projectCount: projects.length,
    certificationCount: certifications.length,
    publicationCount: publications.length
  };

  log('📊 Stats:', stats);
  return {
    success: true,
    jobs,
    skills,
    education,
    certifications,
    projects,
    publications,
    allBullets,
    stats
  };
}

// ==========================================
// BACKWARD COMPATIBILITY EXPORTS
// ==========================================

export function groupBulletsByJob(bullets) {
  const groups = [];
  const map = new Map();
  for (const b of bullets) {
    const key = `${b.company}|${b.role}`;
    if (!map.has(key)) map.set(key, { company: b.company, role: b.role, bullets: [] });
    map.get(key).bullets.push(b.original_text);
  }
  for (const g of map.values()) groups.push(g);
  return groups;
}

export function extractBullets(resumeText) {
  const parsed = parseResume(resumeText);
  return {
    bullets: parsed.allBullets,
    jobs: parsed.jobs,
    skills: parsed.skills.map(s => ({ text: s })),
    education: parsed.education,
    total_count: parsed.allBullets.length
  };
}

export function groupBulletsByRole(bullets) {
  return groupBulletsByJob(bullets);
}
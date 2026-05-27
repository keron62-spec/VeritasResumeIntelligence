// src/utils/resumeParser.js — Production-Ready Rewrite

const DEBUG = false;
const log = DEBUG ? console.log.bind(console) : () => {};

// ==========================================
// PATTERNS
// ==========================================

const SECTION_PATTERNS = {
  experience: [
    /^[\s●◦➢➤►‣\-*]*\s*(?:professional\s+)?(?:work\s+)?experience\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*employment\s*(?:history)?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*career\s+(?:history|experience)\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*relevant\s+experience\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*selected\s+experience\s*[:;]?\s*$/i,
  ],
  education: [
    /^[\s●◦➢➤►‣\-*]*\s*education\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*academic\s+(?:background|history)\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*qualifications\s*[:;]?\s*$/i,
  ],
  skills: [
    /^[\s●◦➢➤►‣\-*]*\s*skills?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*technical\s+skills?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*core\s+competencies\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*expertise\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*tools?\s*(?:and|&)\s*technologies\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*proficiencies\s*[:;]?\s*$/i,
  ],
  projects: [
    /^[\s●◦➢➤►‣\-*]*\s*projects?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*personal\s+projects?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*key\s+projects?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*project\s+portfolio\s*[:;]?\s*$/i,
  ],
  certifications: [
    /^[\s●◦➢➤►‣\-*]*\s*certifications?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*certificates?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*licenses?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*professional\s+certifications?\s*[:;]?\s*$/i,
  ],
  publications: [
    /^[\s●◦➢➤►‣\-*]*\s*publications?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*papers?\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*research\s*[:;]?\s*$/i,
  ],
  summary: [
    /^[\s●◦➢➤►‣\-*]*\s*summary\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*professional\s+summary\s*[:;]?\s*$/i,
    /^[\s●◦➢➤►‣\-*]*\s*profile\s*[:;]?\s*$/i,
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

// Restricted to realistic years (1900–2099) to avoid false positives
const DATE_REGEXES = [
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\s*[-–—]\s*(?:[A-Za-z]{3,9}\s+(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(?:19|20)\d{2}\b/i,
  /\b\d{1,2}\/(?:19|20)\d{2}\s*[-–—]\s*(?:\d{1,2}\/(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b\d{1,2}\/(?:19|20)\d{2}\b/,
  /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|Present|Current|Ongoing|Now)\b/i,
  /\b(?:19|20)\d{2}\b/,
];

const COMPANY_KEYWORDS = /\b(?:inc\.?|llc|ltd\.?|corp\.?|corporation|university|college|institute|school|agency|health|organization|foundation|group|consulting|partners|llp|plc|gmbh|co\.?)\b/i;
const DECORATIVE_LINE = /^[\s]*[-–—_=*]{3,}[\s]*$/;

// ==========================================
// UTILITIES
// ==========================================

function isBulletLine(line) {
  const trimmed = line.trim();
  if (!trimmed || /^Present|Current$/i.test(trimmed)) return false;
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
  if (/^(?:Present|Current|Ongoing|Now)$/i.test(trimmed)) return true;
  return DATE_REGEXES.some(r => r.test(trimmed));
}

function extractDateFromText(text) {
  for (const r of DATE_REGEXES) {
    const m = text.match(r);
    if (m) return m[0];
  }
  return '';
}

function isDecorative(line) {
  return DECORATIVE_LINE.test(line.trim());
}

/** 
 * Score how likely a line is to be a job header.
 * Returns a number; >= 4 is a header candidate.
 */
function getJobHeaderScore(line, prevLine, nextLine) {
  const trimmed = line.trim();
  if (!trimmed) return -100;
  if (isDateLine(trimmed) && !/[^0-9\/\-\–\—\sA-Za-z]/.test(trimmed)) return -100;

  let score = 0;

  // Structural signals
  if (/\s[-–—|]\s/.test(trimmed)) score += 5;
  if (/\s+at\s+/i.test(trimmed)) score += 4;
  if (isDateLine(nextLine)) score += 4;

  // Content signals
  if (COMPANY_KEYWORDS.test(trimmed)) score += 2;
  if (trimmed.length < 60) score += 1;
  if (trimmed.length > 120) score -= 2;

  // Context signals
  if (prevLine === '' || isBulletLine(prevLine)) score += 2;

  // Bulleted headers (e.g., "• Google - Software Engineer")
  if (isBulletLine(trimmed)) {
    if (/\s[-–—|]\s/.test(trimmed) || /\s+at\s+/i.test(trimmed) || extractDateFromText(trimmed)) {
      score += 3;
    } else {
      score -= 2;
    }
  }

  return score;
}

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
    // Default: first is company, second is title (more common)
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
    // Heuristic: shorter is usually the company
    if (second.length < first.length) return { company: second, title: first };
    return { company: first, title: second };
  }

  if (COMPANY_KEYWORDS.test(trimmed)) return { company: trimmed, title: '' };
  return { company: '', title: trimmed };
}

// ==========================================
// SECTIONS
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
    if (isDecorative(line)) continue;

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
    if (trimmed) sections[current].push(line);
  }

  log('  Sizes:', Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.length])));
  return sections;
}

// ==========================================
// EXPERIENCE / JOBS
// ==========================================

function extractJobBlocks(lines) {
  log('💼 Extracting job blocks...');
  if (!lines.length) return [];

  const jobs = [];
  let current = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prev = i > 0 ? lines[i - 1].trim() : '';
    const next = i + 1 < lines.length ? lines[i + 1].trim() : '';
    const nextNext = i + 2 < lines.length ? lines[i + 2].trim() : '';

    // Empty lines only split if the next line looks like a header
    if (trimmed === '') {
      if (current.length > 0 && next && getJobHeaderScore(next, trimmed, nextNext) >= 5) {
        jobs.push([...current]);
        current = [];
      }
      continue;
    }

    const score = getJobHeaderScore(trimmed, prev, next);
    const isHeader = score >= 4;

    if (current.length > 0 && isHeader) {
      // Definite split if preceded by bullet or empty line
      if (isBulletLine(prev) || prev === '' || score >= 6) {
        jobs.push([...current]);
        current = [];
      }
      // Moderate header + substantial existing content = split
      else if (score >= 4 && current.length > 2) {
        jobs.push([...current]);
        current = [];
      }
      // Otherwise treat as continuation (multi-line header)
    }

    current.push(line);
  }

  if (current.length) jobs.push(current);
  log(`  Jobs found: ${jobs.length}`);
  return jobs;
}

function parseJobBlock(jobLines, idx) {
  log(`  Job #${idx + 1} (${jobLines.length} lines)`);
  let headerLines = [];
  let dates = '';
  const bullets = [];
  let state = 'header'; // header -> dates -> bullets

  for (let i = 0; i < jobLines.length; i++) {
    const line = jobLines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isDate = isDateLine(trimmed);
    const isBullet = isBulletLine(trimmed);

    if (state === 'header') {
      if (isDate) {
        dates = trimmed;
        state = 'dates';
      } else if (isBullet) {
        // First-line bulleted header? e.g. "• Google - SWE, Jan 2020"
        const looksLikeHeader = i === 0 && (
          /\s[-–—|]\s/.test(trimmed) ||
          /\s+at\s+/i.test(trimmed) ||
          extractDateFromText(trimmed)
        );
        if (looksLikeHeader) {
          headerLines.push(cleanBulletText(trimmed));
        } else {
          state = 'bullets';
          bullets.push(cleanBulletText(trimmed));
        }
      } else {
        headerLines.push(trimmed);
      }
    }
    else if (state === 'dates') {
      if (isBullet) {
        state = 'bullets';
        bullets.push(cleanBulletText(trimmed));
      } else if (isDate) {
        dates += ' ' + trimmed;
      } else if (bullets.length === 0) {
        // Location/metadata before bullets start
        headerLines.push(trimmed);
      } else {
        state = 'bullets';
        bullets.push(trimmed);
      }
    }
    else if (state === 'bullets') {
      if (isBullet) {
        bullets.push(cleanBulletText(trimmed));
      } else if (isDate) {
        // Date after bullets = probably mis-split; append to last bullet
        if (bullets.length) bullets[bullets.length - 1] += ' [' + trimmed + ']';
      } else {
        // Continuation of last bullet?
        const last = bullets[bullets.length - 1] || '';
        const lastEnded = /[.!?;:,]$/.test(last.trim());
        const indented = /^[\s]+/.test(line);

        if (!lastEnded && indented) {
          bullets[bullets.length - 1] += ' ' + trimmed;
        } else if (!lastEnded && trimmed.length < 60 && !indented) {
          // Short unindented line after bullet — could be new job header that
          // slipped through, or a malformed continuation. Safer to start new bullet.
          bullets.push(trimmed);
        } else {
          bullets[bullets.length - 1] += ' ' + trimmed;
        }
      }
    }
  }

  const header = headerLines.join(' ').trim();
  const { company, title } = parseJobHeader(header);
  if (!dates && header) dates = extractDateFromText(header) || '';

  log(`    → ${title} @ ${company} | ${bullets.length} bullets`);
  return { header, company, title, dates, bullets };
}

// ==========================================
// SKILLS
// ==========================================

function parseSkillsSection(lines) {
  log('🔧 Parsing skills...');
  const raw = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let text = isBulletLine(trimmed) ? cleanBulletText(trimmed) : trimmed;

    // Strip "Category: " prefix
    text = text.replace(/^[^:]+:\s*/, '');

    // Split by common delimiters
    const parts = text.split(/[,;|•·●◦➢➤►‣]/)
      .map(p => p.trim())
      .filter(p => p && p.length > 1);

    raw.push(...parts);
  }

  const cleaned = raw.map(s => s.replace(/\.$/, '').trim()).filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const s of cleaned) {
    const lc = s.toLowerCase();
    if (!seen.has(lc)) { seen.add(lc); unique.push(s); }
  }

  log(`  Unique skills: ${unique.length}`);
  return unique;
}

// ==========================================
// EDUCATION
// ==========================================

function parseEducationSection(lines) {
  log('🎓 Parsing education...');
  const out = [];
  let buffer = [];

  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.join(' ').trim();
    buffer = [];
    if (!text) return;

    let institution = '', degree = '', field = '', dates = '', gpa = '';

    dates = extractDateFromText(text) || '';
    const gpaMatch = text.match(/\b(?:GPA|gpa)[\s:]*([\d\.]+)\s*(?:\/\s*[\d\.]+)?\b/);
    if (gpaMatch) gpa = gpaMatch[1];

    const degreePatterns = [
      /\b(B\.?S\.?|Bachelor(?:'s|s)?\s+(?:of\s+)?(?:Science|Arts|Engineering|Business|Technology)|B\.?A\.?|B\.?E\.?|B\.?Tech)\b/i,
      /\b(M\.?S\.?|Master(?:'s|s)?\s+(?:of\s+)?(?:Science|Arts|Engineering|Business)|M\.?A\.?|M\.?E\.?|M\.?Tech|MBA)\b/i,
      /\b(Ph\.?D\.?|Doctorate|D\.?Sc\.?)\b/i,
      /\b(A\.?S\.?|Associate(?:'s|s)?|A\.?A\.?)\b/i,
      /\b(High\s+School|Diploma|GED|Certificate)\b/i,
    ];
    for (const p of degreePatterns) {
      const m = text.match(p);
      if (m) { degree = m[0]; break; }
    }

    // Institution extraction
    const stripped = text
      .replace(dates, '')
      .replace(degree, '')
      .replace(/GPA[\s:]*[\d\.]+(?:\/[\d\.]+)?/i, '')
      .trim();
    const instMatch = stripped.match(/(?:at|from)\s+([^,;]+)/i);
    if (instMatch) {
      institution = instMatch[1].trim();
    } else {
      const phrases = stripped.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 3);
      if (phrases.length) institution = phrases.reduce((a, b) => a.length > b.length ? a : b);
    }

    out.push({ text, institution, degree, field, dates, gpa });
  };

  for (const line of lines) {
    if (line.trim() === '') flush();
    else buffer.push(line.trim());
  }
  flush();

  log(`  Entries: ${out.length}`);
  return out;
}

// ==========================================
// CERTIFICATIONS
// ==========================================

function parseCertificationsSection(lines) {
  log('🏆 Parsing certifications...');
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const text = isBulletLine(trimmed) ? cleanBulletText(trimmed) : trimmed;

    const date = extractDateFromText(text) || '';
    let body = text;
    if (date) body = body.replace(date, '').replace(/[,\-–—|]\s*$/, '').trim();

    let name = body, issuer = '';
    const m = body.match(/^(.+?)\s+(?:[-–—|]\s+|,\s+)(.+)$/);
    if (m) {
      name = m[1].trim();
      issuer = m[2].trim();
    }

    out.push({ text, name, issuer, date });
  }

  log(`  Entries: ${out.length}`);
  return out;
}

// ==========================================
// PROJECTS
// ==========================================

function parseProjectsSection(lines) {
  log('🚀 Parsing projects...');
  if (!lines.length) return [];

  const nonEmpty = lines.filter(l => l.trim());
  const bulletRatio = nonEmpty.filter(l => isBulletLine(l)).length / nonEmpty.length;
  const isBulletList = bulletRatio > 0.7;

  const projects = [];
  let current = null;
  let hasNames = false;

  const pushCurrent = () => {
    if (!current) return;
    if (current.bullets.length || current.name) projects.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { pushCurrent(); continue; }

    if (isBulletLine(trimmed)) {
      if (!current) current = { name: '', description: '', bullets: [] };
      current.bullets.push(cleanBulletText(trimmed));
    } else {
      hasNames = true;
      pushCurrent();
      current = { name: trimmed, description: '', bullets: [] };
    }
  }
  pushCurrent();

  // If no explicit project names were found, treat each bullet as its own project
  if (!hasNames && projects.length === 1 && projects[0].bullets.length > 1) {
    const bullets = projects[0].bullets;
    return bullets.map(b => ({ name: '', description: b, bullets: [b] }));
  }

  log(`  Projects: ${projects.length}`);
  return projects;
}

// ==========================================
// MAIN
// ==========================================

export function parseResume(resumeText) {
  log('🔍 ========== RESUME PARSER ==========');

  if (!resumeText || typeof resumeText !== 'string') {
    return {
      success: false, error: 'No resume text provided',
      sections: {}, jobs: [], skills: [], education: [],
      projects: [], certifications: [], publications: [],
      allBullets: [],
      stats: { jobCount: 0, bulletCount: 0, skillCount: 0, educationCount: 0 }
    };
  }

  const sections = splitIntoSections(resumeText);

  const jobBlocks = extractJobBlocks(sections.experience);
  const jobs = jobBlocks.map((b, i) => parseJobBlock(b, i));

  const skills = parseSkillsSection(sections.skills);
  const education = parseEducationSection(sections.education);
  const projects = parseProjectsSection(sections.projects);
  const certifications = parseCertificationsSection(sections.certifications);
  const publications = sections.publications.filter(l => l.trim()).map(l => l.trim());

  let bulletId = 1;
  const allBullets = [];

  for (const job of jobs) {
    for (const b of job.bullets) {
      allBullets.push({
        id: `bullet_${bulletId++}`,
        original_text: b,
        company: job.company,
        role: job.title,
        startDate: job.dates,
        section: 'Work Experience'
      });
    }
  }

  for (const p of projects) {
    for (const b of p.bullets) {
      allBullets.push({
        id: `bullet_${bulletId++}`,
        original_text: b,
        company: p.name,
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
  log('🔍 ========== DONE ==========');

  return {
    success: true,
    sections,
    jobs,
    skills,
    education,
    projects,
    certifications,
    publications,
    allBullets,
    stats
  };
}

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
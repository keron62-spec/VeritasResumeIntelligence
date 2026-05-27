// src/utils/simpleResumeParser.js

/**
 * SIMPLE RESUME PARSER - WITH DEBUGGING LOGS
 * 
 * Philosophy: 
 * - Do ONE thing: extract sections, jobs, and bullets
 * - No complex entity association
 * - Return raw structure, let UI handle enrichment
 * - Fault-tolerant - if one section fails, others still work
 * - Extensive console logging for debugging
 */

// Section headers to split on (case insensitive, exact or starts with)
const SECTION_HEADERS = {
    experience: ['experience', 'work experience', 'employment', 'professional experience', 'career history'],
    education: ['education', 'academic background', 'qualifications', 'education history'],
    skills: ['skills', 'technical skills', 'core competencies', 'expertise', 'tools & technologies'],
    projects: ['projects', 'personal projects', 'key projects', 'project portfolio'],
    certifications: ['certifications', 'certificates', 'licenses', 'professional certifications'],
    publications: ['publications', 'papers', 'articles']
};

// Bullet characters (including dash with space)
const BULLET_PATTERNS = [
    /^[•·●◦➢➤►‣]\s+/,           // Bullet characters
    /^[\-\*\+]\s+/,               // Dash, asterisk, plus with space
    /^\d+[\.\)]\s+/,              // Numbered: "1. " or "1) "
    /^[a-zA-Z][\.\)]\s+/,         // Lettered: "a. " or "a) "
    /^\[\s*\]\s+/,                // Checkbox: "[ ] "
    /^✓\s+/,                      // Checkmark
    /^►\s+/,                      // Arrow
];

/**
 * Checks if a line starts with a bullet character
 */
function isBulletLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Special: "Present" or dates are not bullets
    if (trimmed === 'Present' || trimmed === 'Current') return false;
    if (trimmed.match(/^\d{1,2}\/\d{4}/)) return false;
    
    for (const pattern of BULLET_PATTERNS) {
        if (pattern.test(trimmed)) return true;
    }
    return false;
}

/**
 * Removes bullet characters from the start of a line
 */
function cleanBulletText(line) {
    const trimmed = line.trim();
    for (const pattern of BULLET_PATTERNS) {
        if (pattern.test(trimmed)) {
            const cleaned = trimmed.replace(pattern, '').trim();
            console.log(`  🔹 Cleaned bullet: "${trimmed.substring(0, 50)}..." → "${cleaned.substring(0, 50)}..."`);
            return cleaned;
        }
    }
    return trimmed;
}

/**
 * Checks if a line looks like a date (for job separation)
 */
function isDateLine(line) {
    const trimmed = line.trim();
    // MM/YYYY, MM/YYYY - MM/YYYY, YYYY, etc.
    const result = /^\d{1,2}\/\d{4}/.test(trimmed) || 
           /^\d{4}\s*[-–—]\s*\d{4}/.test(trimmed) ||
           /^\d{4}$/.test(trimmed) ||
           /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i.test(trimmed);
    
    if (result) {
        console.log(`  📅 Date line detected: "${trimmed}"`);
    }
    return result;
}

/**
 * Parses a job header line to extract company and title
 * Handles common formats: "Company - Title", "Company | Title", "Company, Title"
 */
function parseJobHeader(line) {
    console.log(`  🏷️ Parsing job header: "${line}"`);
    const trimmed = line.trim();
    
    // Pattern 1: "Company - Title"
    let match = trimmed.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (match) {
        console.log(`    ✓ Pattern 1 (Company - Title): company="${match[1].trim()}", title="${match[2].trim()}"`);
        return { company: match[1].trim(), title: match[2].trim() };
    }
    
    // Pattern 2: "Company | Title"
    match = trimmed.match(/^(.+?)\s+\|\s+(.+)$/);
    if (match) {
        console.log(`    ✓ Pattern 2 (Company | Title): company="${match[1].trim()}", title="${match[2].trim()}"`);
        return { company: match[1].trim(), title: match[2].trim() };
    }
    
    // Pattern 3: "Title at Company"
    match = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
    if (match) {
        console.log(`    ✓ Pattern 3 (Title at Company): company="${match[2].trim()}", title="${match[1].trim()}"`);
        return { company: match[2].trim(), title: match[1].trim() };
    }
    
    // Pattern 4: "Title, Company" (comma separated)
    match = trimmed.match(/^(.+?),\s*(.+)$/);
    if (match) {
        // Guess which is company vs title based on length and keywords
        const first = match[1].trim();
        const second = match[2].trim();
        const companyKeywords = /inc|llc|ltd|corp|university|agency|health|organization|foundation|group|consulting/i;
        
        if (companyKeywords.test(second) || second.length > first.length) {
            console.log(`    ✓ Pattern 4 (Title, Company): company="${second}", title="${first}"`);
            return { company: second, title: first };
        }
        console.log(`    ✓ Pattern 4 (Company, Title): company="${first}", title="${second}"`);
        return { company: first, title: second };
    }
    
    // Pattern 5: Just a single line - treat as company or title only
    console.log(`    ⚠️ No pattern matched, treating as title only: "${trimmed}"`);
    return { company: null, title: trimmed };
}

/**
 * Splits resume text into sections based on headers
 */
function splitIntoSections(text) {
    console.log('\n📑 STEP 1: Splitting into sections...');
    const lines = text.split('\n');
    const sections = {
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        publications: [],
        unknown: []
    };
    
    let currentSection = 'unknown';
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Check for section headers
        let foundSection = null;
        for (const [sectionName, headers] of Object.entries(SECTION_HEADERS)) {
            for (const header of headers) {
                if (lineLower === header || lineLower.startsWith(header + ':') || lineLower.startsWith(header + ' ')) {
                    foundSection = sectionName;
                    console.log(`  📌 Found section header: "${line}" → ${sectionName}`);
                    break;
                }
            }
            if (foundSection) break;
        }
        
        if (foundSection) {
            currentSection = foundSection;
            i++;
            continue;
        }
        
        // Add line to current section
        if (line) {
            sections[currentSection].push(lines[i]);
        }
        i++;
    }
    
    // Log section stats
    console.log('\n  Section stats:');
    for (const [name, content] of Object.entries(sections)) {
        console.log(`    ${name}: ${content.length} lines`);
    }
    
    return sections;
}

/**
 * Extracts job blocks from experience section text
 * Jobs are separated by blank lines or date lines followed by content
 */
function extractJobBlocks(experienceLines) {
    console.log('\n💼 STEP 2: Extracting job blocks from experience section...');
    console.log(`  Total experience lines: ${experienceLines.length}`);
    
    const jobs = [];
    let currentJobLines = [];
    let i = 0;
    
    while (i < experienceLines.length) {
        const line = experienceLines[i];
        const trimmed = line.trim();
        const nextLine = i + 1 < experienceLines.length ? experienceLines[i + 1].trim() : '';
        
        // Check if this line starts a new job (has date on same line or next line)
        const hasDateOnThisLine = isDateLine(trimmed);
        const hasDateOnNextLine = isDateLine(nextLine);
        
        // Empty line indicates job separator
        if (trimmed === '') {
            if (currentJobLines.length > 0) {
                console.log(`  📄 Job block ${jobs.length + 1} completed (${currentJobLines.length} lines)`);
                jobs.push([...currentJobLines]);
                currentJobLines = [];
            }
            i++;
            continue;
        }
        
        // New job starts if we have content and hit a date line
        const isPotentialJobStart = !isBulletLine(trimmed) && !isDateLine(trimmed) && trimmed.length < 60;
        
        if (currentJobLines.length > 0 && (hasDateOnThisLine || (isPotentialJobStart && hasDateOnNextLine))) {
            console.log(`  📄 Job block ${jobs.length + 1} completed (${currentJobLines.length} lines)`);
            jobs.push([...currentJobLines]);
            currentJobLines = [];
        }
        
        currentJobLines.push(experienceLines[i]);
        i++;
    }
    
    if (currentJobLines.length > 0) {
        console.log(`  📄 Job block ${jobs.length + 1} completed (${currentJobLines.length} lines)`);
        jobs.push(currentJobLines);
    }
    
    console.log(`\n  Total job blocks found: ${jobs.length}`);
    return jobs;
}

/**
 * Parses a job block into { header, dates, bullets }
 */
function parseJobBlock(jobLines, jobIndex) {
    console.log(`\n  🔍 Parsing Job Block #${jobIndex + 1}:`);
    let header = '';
    let dates = '';
    const bulletLines = [];
    let foundBullet = false;
    
    for (let i = 0; i < jobLines.length; i++) {
        const line = jobLines[i];
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        console.log(`    Line ${i + 1}: "${trimmed.substring(0, 60)}${trimmed.length > 60 ? '...' : ''}"`);
        
        // Check if it's a date line (separate line or part of header)
        if (isDateLine(trimmed)) {
            dates = trimmed;
            console.log(`      → Detected as DATE line`);
            continue;
        }
        
        // Check if it's a bullet point
        if (isBulletLine(trimmed)) {
            foundBullet = true;
            const cleaned = cleanBulletText(trimmed);
            bulletLines.push(cleaned);
            console.log(`      → Detected as BULLET (${bulletLines.length})`);
            continue;
        }
        
        // Not a bullet and not a date - part of header (but only if we haven't found bullets yet)
        if (!foundBullet && !isDateLine(trimmed)) {
            if (header) {
                header += ' ' + trimmed;
                console.log(`      → Appended to HEADER: "${trimmed.substring(0, 40)}..."`);
            } else {
                header = trimmed;
                console.log(`      → Set as HEADER: "${trimmed.substring(0, 40)}..."`);
            }
        } else if (foundBullet) {
            // Multi-line bullet continuation
            const lastIndex = bulletLines.length - 1;
            if (lastIndex >= 0) {
                const oldText = bulletLines[lastIndex];
                bulletLines[lastIndex] += ' ' + trimmed;
                console.log(`      → Appended to BULLET ${lastIndex + 1}: "${trimmed.substring(0, 40)}..."`);
            }
        }
    }
    
    console.log(`    📊 Parsed result:`);
    console.log(`      Header: "${header.substring(0, 80)}${header.length > 80 ? '...' : ''}"`);
    console.log(`      Dates: "${dates}"`);
    console.log(`      Bullets found: ${bulletLines.length}`);
    
    // Parse header into company and title
    const { company, title } = parseJobHeader(header);
    
    console.log(`      Company: "${company || '(not detected)'}"`);
    console.log(`      Title: "${title || '(not detected)'}"`);
    
    return {
        header,
        company: company || '',
        title: title || '',
        dates,
        bullets: bulletLines
    };
}

/**
 * MAIN FUNCTION: Parse resume into structured data
 * Returns a simple, reliable structure that always contains all bullets
 */
export function parseResume(resumeText) {
    console.log('\n🔍 ========== SIMPLE RESUME PARSER ==========');
    console.log(`📄 Input text length: ${resumeText?.length || 0} characters`);
    console.log(`📄 First 200 chars: ${resumeText?.substring(0, 200)}...`);
    
    if (!resumeText || typeof resumeText !== 'string') {
        console.error('❌ Invalid input: resumeText is empty or not a string');
        return {
            success: false,
            error: 'No resume text provided',
            sections: {},
            jobs: [],
            skills: [],
            education: [],
            projects: [],
            certifications: [],
            publications: [],
            allBullets: [],
            stats: { jobCount: 0, bulletCount: 0, skillCount: 0, educationCount: 0 }
        };
    }
    
    // Step 1: Split into sections
    const sections = splitIntoSections(resumeText);
    
    // Step 2: Extract jobs from experience section
    const jobBlocks = extractJobBlocks(sections.experience);
    const jobs = jobBlocks.map((block, idx) => parseJobBlock(block, idx));
    
    console.log(`\n📊 Total jobs parsed: ${jobs.length}`);
    
    // Step 3: Parse skills section
    console.log('\n🔧 STEP 3: Parsing skills section...');
    const skills = [];
    for (const line of sections.skills) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        console.log(`  Processing skill line: "${trimmed.substring(0, 60)}..."`);
        
        // Check for comma-separated skills
        if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map(p => p.trim()).filter(p => p);
            console.log(`    → Comma-separated: found ${parts.length} skills`);
            skills.push(...parts);
        } 
        // Check for bullet-separated skills (with bullets)
        else if (isBulletLine(trimmed)) {
            const cleaned = cleanBulletText(trimmed);
            console.log(`    → Bullet format: "${cleaned}"`);
            skills.push(cleaned);
        }
        // Check for pipe-separated
        else if (trimmed.includes('|')) {
            const parts = trimmed.split('|').map(p => p.trim()).filter(p => p);
            console.log(`    → Pipe-separated: found ${parts.length} skills`);
            skills.push(...parts);
        }
        // Check for bullet characters as separators (•)
        else if (trimmed.includes('•')) {
            const parts = trimmed.split('•').map(p => p.trim()).filter(p => p);
            console.log(`    → Bullet-char separated: found ${parts.length} skills`);
            skills.push(...parts);
        }
        else if (trimmed.length > 0) {
            console.log(`    → Plain text: "${trimmed}"`);
            skills.push(trimmed);
        }
    }
    
    // Deduplicate skills
    const uniqueSkills = [...new Set(skills)];
    console.log(`\n  Total skills found: ${skills.length} (${uniqueSkills.length} unique)`);
    
    // Step 4: Parse education section
    console.log('\n🎓 STEP 4: Parsing education section...');
    const education = sections.education
        .filter(line => line.trim())
        .map(line => {
            console.log(`  Education line: "${line.trim().substring(0, 60)}..."`);
            return { text: line.trim() };
        });
    console.log(`  Total education entries: ${education.length}`);
    
    // Step 5: Parse projects section
    console.log('\n🚀 STEP 5: Parsing projects section...');
    const projectBlocks = extractJobBlocks(sections.projects);
    const projects = projectBlocks.map((block, idx) => {
        console.log(`  Project #${idx + 1}:`);
        const parsed = parseJobBlock(block, idx);
        return {
            name: parsed.title || parsed.header,
            bullets: parsed.bullets
        };
    });
    console.log(`  Total projects found: ${projects.length}`);
    
    // Step 6: Certifications
    console.log('\n🏆 STEP 6: Parsing certifications...');
    const certifications = sections.certifications
        .filter(line => line.trim())
        .map(line => {
            console.log(`  Certification: "${line.trim().substring(0, 60)}..."`);
            return line.trim();
        });
    console.log(`  Total certifications: ${certifications.length}`);
    
    // Step 7: Publications
    console.log('\n📝 STEP 7: Parsing publications...');
    const publications = sections.publications
        .filter(line => line.trim())
        .map(line => {
            console.log(`  Publication: "${line.trim().substring(0, 60)}..."`);
            return line.trim();
        });
    console.log(`  Total publications: ${publications.length}`);
    
    // Generate a flat list of all bullets with their job context
    console.log('\n📋 Generating flat bullet list...');
    let bulletId = 1;
    const allBullets = [];
    
    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        console.log(`  Job #${i + 1}: "${job.title}" @ "${job.company}" - ${job.bullets.length} bullets`);
        for (let j = 0; j < job.bullets.length; j++) {
            allBullets.push({
                id: `bullet_${bulletId++}`,
                original_text: job.bullets[j],
                company: job.company,
                role: job.title,
                startDate: job.dates,
                section: 'Work Experience'
            });
            console.log(`    Bullet ${j + 1}: "${job.bullets[j].substring(0, 60)}..."`);
        }
    }
    
    const stats = {
        jobCount: jobs.length,
        bulletCount: allBullets.length,
        skillCount: uniqueSkills.length,
        educationCount: education.length,
        projectCount: projects.length,
        certificationCount: certifications.length,
        publicationCount: publications.length
    };
    
    console.log('\n📊 FINAL STATS:');
    console.log(`  Jobs: ${stats.jobCount}`);
    console.log(`  Bullets: ${stats.bulletCount}`);
    console.log(`  Skills: ${stats.skillCount}`);
    console.log(`  Education: ${stats.educationCount}`);
    console.log(`  Projects: ${stats.projectCount}`);
    console.log(`  Certifications: ${stats.certificationCount}`);
    console.log(`  Publications: ${stats.publicationCount}`);
    console.log('\n🔍 ========== PARSING COMPLETE ==========\n');
    
    return {
        success: true,
        sections,
        jobs,
        skills: uniqueSkills,
        education,
        projects,
        certifications,
        publications,
        allBullets,
        stats
    };
}

/**
 * Group bullets by role/company for display in editor
 */
export function groupBulletsByJob(bullets) {
    console.log('\n📦 Grouping bullets by job...');
    const groups = [];
    const groupMap = new Map();
    
    for (const bullet of bullets) {
        const key = `${bullet.company}|${bullet.role}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                company: bullet.company,
                role: bullet.role,
                bullets: []
            });
        }
        groupMap.get(key).bullets.push(bullet.original_text);
    }
    
    for (const group of groupMap.values()) {
        groups.push(group);
    }
    
    console.log(`  Created ${groups.length} job groups`);
    return groups;
}

/**
 * Legacy export for backward compatibility
 */
export function extractBullets(resumeText) {
    console.warn('⚠️ extractBullets() is deprecated. Use parseResume() instead.');
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
    console.warn('⚠️ groupBulletsByRole() is deprecated. Use groupBulletsByJob() instead.');
    return groupBulletsByJob(bullets);
}
// src/components/ResumeEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ============================================================
// DETERMINISTIC SCORING LIBRARIES
// ============================================================
import { calculateATSScore, calculateFitScore, calculateCredibilityScore, calculateSemanticPosition } from '../utils/scoreCalculator.js';
import { calculateDeterministicBloom, analyzeBulletBloom } from '../utils/deterministicBloom.js';
import { parseResume, groupBulletsByJob } from '../utils/bulletParser.js';
import { detectSeniorityFromText } from '../utils/seniorityDetector.js';
import { parseJobDescription, extractEducationRequired, extractYearsRequired as extractJDYears } from '../utils/jdParser.js';
import { analyzeVerbs } from '../utils/verbs.js';
import { detectBuzzwords } from '../utils/buzzwords.js';
import { calculateMetricStrength } from '../utils/metricsPatterns.js';
import { calculateRIASECDeterministic } from '../utils/riasec.js';
import { countTechnicalSkills } from '../utils/skillDictionary.js';
import { extractPersonalInfo, formatContactLine } from '../utils/personalInfoExtractor.js';

// ============================================================
// PDF STYLES (Using only built-in fonts)
// ============================================================
const createPDFStyles = (template) => {
    let fontFamily = 'Helvetica';
    if (template === 'classic' || template === 'harvard' || template === 'legal') fontFamily = 'Times-Roman';
    if (template === 'executive') fontFamily = 'Times-Roman';
    if (template === 'modern' || template === 'veritas_signature') fontFamily = 'Helvetica';
    if (template === 'consultancy') fontFamily = 'Helvetica';
    if (template === 'diplomat') fontFamily = 'Helvetica';
    if (template === 'faang') fontFamily = 'Courier';
    if (template === 'ats') fontFamily = 'Helvetica';

    const styles = {
        page: { padding: 50, fontSize: 10.5, fontFamily: fontFamily, lineHeight: 1.5 },
        header: { textAlign: 'center', marginBottom: 20, borderBottom: template === 'classic' ? 2 : template === 'executive' ? 1 : 1, borderBottomColor: template === 'classic' ? '#000' : '#c9a84c', paddingBottom: 10 },
        name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase', letterSpacing: template === 'classic' ? 2 : 1 },
        contactRow: { fontSize: 9, color: '#666', textAlign: 'center', marginTop: 5 },
        sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 15, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, backgroundColor: template === 'ats' ? '#f0f0f0' : 'transparent', padding: template === 'ats' ? 4 : 0 },
        roleHeader: { fontWeight: 'bold', marginTop: 10, marginBottom: 2, fontSize: 11 },
        companyText: { fontSize: 10, color: '#666', marginBottom: 4, fontStyle: 'italic' },
        dateText: { fontSize: 9, color: '#666', marginBottom: 6 },
        bullet: { marginLeft: 12, marginBottom: 4, fontSize: 10 },
        skillsText: { fontSize: 9, marginBottom: 8, lineHeight: 1.4 }
    };
    return StyleSheet.create(styles);
};

// ============================================================
// PDF Document Component
// ============================================================
const ResumePDF = ({ personalInfo, summary, roles, skills, education, certifications, projects, publications, selectedTemplate }) => {
    const styles = createPDFStyles(selectedTemplate);
    const rolesPerPage = [];
    let currentPage = [];
    let currentBulletCount = 0;
    const MAX_BULLETS_PER_PAGE = 12;
    
    for (const role of roles) {
        if (currentBulletCount + role.bullets.length > MAX_BULLETS_PER_PAGE && currentPage.length > 0) {
            rolesPerPage.push(currentPage);
            currentPage = [role];
            currentBulletCount = role.bullets.length;
        } else {
            currentPage.push(role);
            currentBulletCount += role.bullets.length;
        }
    }
    if (currentPage.length > 0) rolesPerPage.push(currentPage);
    
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
                    <Text style={styles.contactRow}>
                        {[personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.location].filter(Boolean).join(' | ')}
                    </Text>
                </View>
                {summary && (<><Text style={styles.sectionTitle}>Professional Summary</Text><Text style={{ fontSize: 10, marginBottom: 12 }}>{summary}</Text></>)}
                <Text style={styles.sectionTitle}>Experience</Text>
                {(rolesPerPage[0] || []).map((role, idx) => (
                    <View key={idx} style={{ marginBottom: 12 }}>
                        <Text style={styles.roleHeader}>{role.title}</Text>
                        <Text style={styles.companyText}>{role.company}</Text>
                        <Text style={styles.dateText}>{role.startDate} – {role.endDate || 'Present'}</Text>
                        {role.bullets.map((bullet, bidx) => (<Text key={bidx} style={styles.bullet}>• {bullet.text}</Text>))}
                    </View>
                ))}
                {rolesPerPage.length === 1 && (
                    <>
                        {skills.length > 0 && (<><Text style={styles.sectionTitle}>Skills</Text><Text style={styles.skillsText}>{skills.join(' • ')}</Text></>)}
                        {education.length > 0 && education.some(e => e.degree) && (<><Text style={styles.sectionTitle}>Education</Text>{education.map((edu, idx) => (<View key={idx} style={{ marginBottom: 8 }}><Text style={styles.roleHeader}>{edu.degree}</Text><Text style={styles.companyText}>{edu.institution} {edu.year && `(${edu.year})`}</Text></View>))}</>)}
                    </>
                )}
            </Page>
            {rolesPerPage.slice(1).map((pageRoles, pageIdx) => (
                <Page key={pageIdx} size="LETTER" style={styles.page}>
                    {pageRoles.map((role, idx) => (
                        <View key={idx} style={{ marginBottom: 12 }}>
                            <Text style={styles.roleHeader}>{role.title}</Text>
                            <Text style={styles.companyText}>{role.company}</Text>
                            <Text style={styles.dateText}>{role.startDate} – {role.endDate || 'Present'}</Text>
                            {role.bullets.map((bullet, bidx) => (<Text key={bidx} style={styles.bullet}>• {bullet.text}</Text>))}
                        </View>
                    ))}
                    {pageIdx === rolesPerPage.length - 2 && (
                        <>
                            {skills.length > 0 && (<><Text style={styles.sectionTitle}>Skills</Text><Text style={styles.skillsText}>{skills.join(' • ')}</Text></>)}
                            {education.length > 0 && education.some(e => e.degree) && (<><Text style={styles.sectionTitle}>Education</Text>{education.map((edu, idx) => (<View key={idx} style={{ marginBottom: 8 }}><Text style={styles.roleHeader}>{edu.degree}</Text><Text style={styles.companyText}>{edu.institution} {edu.year && `(${edu.year})`}</Text></View>))}</>)}
                        </>
                    )}
                </Page>
            ))}
        </Document>
    );
};

// ============================================================
// TEMPLATE STYLES (10 Total)
// ============================================================
const TEMPLATES = {
    classic: { name: 'Classic Corporate', icon: '📄', fontFamily: "'Times New Roman', 'Georgia', serif", headerStyle: { borderBottom: '2px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '2px' }, sectionStyle: { borderBottom: '1px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '1px' } },
    modern: { name: 'Modern Minimal', icon: '✨', fontFamily: "'Helvetica', 'Arial', sans-serif", headerStyle: { color: '#c9a84c', fontWeight: 600 }, sectionStyle: { color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 } },
    executive: { name: 'Executive', icon: '👑', fontFamily: "'Georgia', 'Times New Roman', serif", headerStyle: { color: '#2c1810', borderTop: '6px solid #c9a84c', paddingTop: '20px' }, sectionStyle: { color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700 } },
    ats: { name: 'ATS Optimized', icon: '🤖', fontFamily: "'Arial', sans-serif", headerStyle: { fontWeight: 700 }, sectionStyle: { backgroundColor: '#f0f0f0', padding: '6px 10px', fontWeight: 700, textTransform: 'uppercase' } },
    veritas_signature: { name: 'Veritas Signature', icon: '👁️', fontFamily: "'Helvetica', 'Arial', sans-serif", headerStyle: { textAlign: 'center', marginBottom: '24px' }, nameStyle: { fontSize: 32, fontWeight: '800', color: '#1a1f2e' }, sectionStyle: { color: '#c9a84c', borderBottom: '1px solid #e6e4dd', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginTop: 24, marginBottom: 12, paddingBottom: 4 } },
    consultancy: { name: 'Consulting', icon: '📊', fontFamily: "'Helvetica', 'Arial', sans-serif", headerStyle: { borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 15 }, sectionStyle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '0.5px solid #000', paddingBottom: 2, marginTop: 16, marginBottom: 6 }, roleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }, dateText: { textAlign: 'right', fontSize: 9.5 } },
    diplomat: { name: 'International Development', icon: '🌐', fontFamily: "'Helvetica', 'Arial', sans-serif", headerStyle: { marginBottom: 20 }, nameStyle: { fontSize: 20, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase', color: '#1a3a5c' }, sectionStyle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#1a3a5c', borderBottom: '0.5px solid #1a3a5c', paddingBottom: 3, marginTop: 18, marginBottom: 8 } },
    harvard: { name: 'Ivy League', icon: '🏛️', fontFamily: "'Times New Roman', 'Georgia', serif", headerStyle: { textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 8, marginBottom: 12 }, sectionStyle: { borderBottom: '1px solid #000', textTransform: 'uppercase', fontWeight: 'bold', marginTop: 16, marginBottom: 8, fontSize: 12 }, roleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }, dateText: { textAlign: 'right', fontWeight: 'normal' } },
    faang: { name: 'Silicon Valley Tech', icon: '💻', fontFamily: "'Courier New', monospace", headerStyle: { textAlign: 'left', marginBottom: 16 }, nameStyle: { fontSize: 28, fontWeight: '900', letterSpacing: '-0.5px' }, sectionStyle: { color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginTop: 20, marginBottom: 10 } },
    legal: { name: 'Legal', icon: '⚖️', fontFamily: "'Times New Roman', 'Georgia', serif", headerStyle: { textAlign: 'center', marginBottom: 20 }, nameStyle: { fontSize: 26, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 }, sectionStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid #000', borderBottom: '1px solid #000', paddingTop: 4, paddingBottom: 4, marginTop: 20, marginBottom: 12 } }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function extractJDFeatures(jdText) {
    if (!jdText) return null;
    const seniority = detectSeniorityFromText(jdText);
    const yearsRequired = extractJDYears(jdText);
    const sections = parseJobDescription(jdText);
    const words = jdText.split(/\s+/);
    const criticalKeywords = new Set();
    for (const word of words) {
        const clean = word.replace(/[^\w]/g, '');
        if (clean.length > 3 && /[A-Z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note)$/i.test(clean)) {
            criticalKeywords.add(clean.toLowerCase());
        }
    }
    let jdBloomLevel = 3.5;
    const responsibilitiesText = (sections.responsibilities || []).join(' ').toLowerCase();
    const isExecutiveBloom = /\b(architect|transform|orchestrate|spearhead|found|direct|own|p&l|board|strategic)\b/i.test(responsibilitiesText) && (/\blead\b/i.test(responsibilitiesText) || /\bstrateg/i.test(responsibilitiesText));
    if (isExecutiveBloom) jdBloomLevel = 5.5;
    else if (responsibilitiesText.match(/manage|drive|deliver|execute|implement|evaluate|assess|recommend|lead|strateg/i)) jdBloomLevel = 4.5;
    else if (responsibilitiesText.match(/coordinate|analyze|investigate|examine|facilitate|support|assist/i)) jdBloomLevel = 3.5;
    else jdBloomLevel = 2.5;
    return { seniority: seniority.level, seniority_level_num: { entry: 1, mid: 2, senior: 3, executive: 4 }[seniority.level] || 2, years_required: yearsRequired || 3, critical_keywords: Array.from(criticalKeywords).slice(0, 50), jd_bloom_level: jdBloomLevel };
}

function calculateKeywordMatchRate(resumeText, jdKeywords) {
    if (!jdKeywords || jdKeywords.length === 0) return 0;
    const lowerResume = resumeText.toLowerCase();
    let matchCount = 0;
    for (const keyword of jdKeywords) { if (lowerResume.includes(keyword)) matchCount++; }
    return Math.round((matchCount / jdKeywords.length) * 100);
}

function extractEducationFromText(text) {
    const educationList = [];
    const lines = text.split('\n');
    const degreePatterns = [/^(bachelor(?:'s)?|b\.?sc?\.?|b\.?a\.?)\s+(?:of|in)\s+/i, /^(master(?:'s)?|m\.?sc?\.?|m\.?a\.?|mba|mph|mpa)\s+(?:of|in)\s+/i, /^(ph\.?d\.?|doctorate|doctor of)\s+/i, /^(associate(?:'s)?)\s+(?:of|in|degree)\s+/i, /degree\s+in\s+/i, /graduated\s+(?:from|with)/i];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (degreePatterns.some(pattern => pattern.test(line))) {
            educationList.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, degree: line, institution: lines[i + 1]?.trim() || '', year: lines[i + 2]?.match(/\d{4}/)?.[0] || '' });
            i += 2;
        }
    }
    if (educationList.length === 0) { educationList.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, degree: '', institution: '', year: '' }); }
    return educationList;
}

function extractCertificationsFromText(text) {
    const certs = [];
    const lines = text.split('\n');
    const certPatterns = [/\b(certified|certification|certificate)\b/i, /\bpmp\b|\bcissp\b|\bcsm\b|\bpsm\b/i, /\b(aws|azure|gcp)\s+(certified|certification|associate|professional|architect|developer)\b/i, /\b(issued|awarded|completed)\s+by\b/i, /\bcredential\b/i];
    for (const line of lines) { if (certPatterns.some(pattern => pattern.test(line)) && line.trim().length > 0) { certs.push(line.trim()); } }
    return certs;
}

function extractProjectsFromText(text) {
    const projectsList = [];
    const lowerText = text.toLowerCase();
    const projectSection = lowerText.match(/projects?:?([\s\S]*?)(?:\n\n|\n(?=[A-Z][a-z]+:))/i);
    if (projectSection) {
        const projectLines = projectSection[1].split('\n');
        let currentProject = null;
        for (const line of projectLines) {
            if (line.trim().match(/^[A-Z][a-z]+/)) {
                if (currentProject) projectsList.push(currentProject);
                currentProject = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name: line.trim(), bullets: [] };
            } else if (currentProject && line.trim().match(/^[•\-*]/)) { currentProject.bullets.push(line.trim().replace(/^[•\-*]\s*/, '')); }
        }
        if (currentProject) projectsList.push(currentProject);
    }
    return projectsList;
}

function extractPublicationsFromText(text) {
    const pubs = [];
    const lines = text.split('\n');
    const pubKeywords = ['publication', 'paper', 'journal', 'conference', 'doi'];
    for (const line of lines) { if (pubKeywords.some(keyword => line.toLowerCase().includes(keyword))) { pubs.push(line.trim()); } }
    return pubs;
}

function extractSkillsFromText(text) {
    const skillsFound = new Set();
    const lowerText = text.toLowerCase();
    const commonSkills = ['python', 'sql', 'excel', 'power bi', 'tableau', 'project management', 'data analysis', 'stakeholder management', 'agile', 'scrum', 'jira', 'leadership', 'communication', 'strategic planning', 'risk management'];
    for (const skill of commonSkills) { if (lowerText.includes(skill)) skillsFound.add(skill); }
    return Array.from(skillsFound);
}

// ============================================================
// MODAL COMPONENTS
// ============================================================
const AddSectionModal = ({ isOpen, onClose, onAdd, sectionPosition, setSectionPosition, availablePositions }) => {
    const [sectionName, setSectionName] = useState('');
    const [sectionType, setSectionType] = useState('bulleted');
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '450px', maxWidth: '90%' }}>
                <h3 style={{ marginBottom: '16px', color: '#c9a84c' }}>Add New Section</h3>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>Section Name</label>
                    <input type="text" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="e.g., Publications, Awards, Languages" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px' }} autoFocus />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>Section Type</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" value="bulleted" checked={sectionType === 'bulleted'} onChange={(e) => setSectionType(e.target.value)} /> Bulleted List</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="radio" value="text" checked={sectionType === 'text'} onChange={(e) => setSectionType(e.target.value)} /> Free Text</label>
                    </div>
                </div>
                {availablePositions && availablePositions.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>Position</label>
                        <select value={sectionPosition} onChange={(e) => setSectionPosition(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px' }}>
                            {availablePositions.map(pos => (<option key={pos.value} value={pos.value}>{pos.label}</option>))}
                        </select>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => { onAdd(sectionName, sectionType, sectionPosition); onClose(); }} style={{ padding: '8px 16px', background: '#c9a84c', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1f2e', fontWeight: 500 }}>Add Section</button>
                </div>
            </div>
        </div>
    );
};

const ExportChecklistModal = ({ isOpen, onClose, onConfirm, checklist }) => {
    if (!isOpen) return null;
    const allCriticalMet = checklist.critical.every(item => item.met);
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '450px', maxWidth: '90%' }}>
                <h3 style={{ marginBottom: '16px', color: '#c9a84c' }}>Export Checklist</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>Please review before exporting your resume.</p>
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '12px' }}>Critical Fields (Required)</div>
                    {checklist.critical.map((item, idx) => (<div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '11px' }}><span style={{ color: item.met ? '#10b981' : '#ef4444' }}>{item.met ? '✅' : '❌'}</span><span style={{ color: item.met ? '#10b981' : '#ef4444' }}>{item.label}</span></div>))}
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '12px' }}>Recommended Fields (Optional)</div>
                    {checklist.recommended.map((item, idx) => (<div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '11px' }}><span>{item.met ? '✅' : '⚠️'}</span><span>{item.label}</span></div>))}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '8px 16px', background: allCriticalMet ? '#10b981' : '#f59e0b', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 500 }}>{allCriticalMet ? 'Export PDF' : 'Export with Missing Fields'}</button>
                </div>
            </div>
        </div>
    );
};

const AILoadingOverlay = ({ message }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', minWidth: '280px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #e6e4dd', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#1a1f2e', fontSize: '14px' }}>{message || 'AI is parsing your resume...'}</p>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>This may take 5-10 seconds</p>
        </div>
    </div>
);

const AIParseComparisonModal = ({ isOpen, onClose, deterministicRoles, aiRoles, onAcceptAI }) => {
    if (!isOpen) return null;
    const deterministicCount = deterministicRoles.reduce((acc, r) => acc + r.bullets.length, 0);
    const aiCount = aiRoles.reduce((acc, r) => acc + r.bullets.length, 0);
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflowY: 'auto', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd', background: '#f8f7f4' }}>
                    <h3 style={{ margin: 0, color: '#c9a84c' }}>🤖 AI Parse Results</h3>
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>Compare deterministic parser vs AI parser results. Choose which version to use.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
                    <div style={{ border: '1px solid #3b82f6', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#3b82f6', padding: '12px', color: 'white', fontWeight: 600 }}>🔍 Deterministic Parser</div>
                        <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ fontSize: '12px', marginBottom: '8px' }}><strong>{deterministicRoles.length}</strong> roles, <strong>{deterministicCount}</strong> bullets</div>
                            {deterministicRoles.slice(0, 5).map((role, i) => (<div key={i} style={{ marginBottom: '12px', fontSize: '11px', padding: '8px', background: '#f8f7f4', borderRadius: '4px' }}><strong>{role.title}</strong> @ {role.company}<br />{role.bullets.length} bullets</div>))}
                            {deterministicRoles.length > 5 && <div style={{ fontSize: '11px', color: '#6b7280' }}>+{deterministicRoles.length - 5} more roles</div>}
                        </div>
                    </div>
                    <div style={{ border: '1px solid #8b5cf6', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#8b5cf6', padding: '12px', color: 'white', fontWeight: 600 }}>🤖 AI Parser (Gemini 3.1)</div>
                        <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ fontSize: '12px', marginBottom: '8px' }}><strong>{aiRoles.length}</strong> roles, <strong>{aiCount}</strong> bullets</div>
                            {aiRoles.slice(0, 5).map((role, i) => (<div key={i} style={{ marginBottom: '12px', fontSize: '11px', padding: '8px', background: '#f8f7f4', borderRadius: '4px' }}><strong>{role.title}</strong> @ {role.company}<br />{role.bullets.length} bullets</div>))}
                            {aiRoles.length > 5 && <div style={{ fontSize: '11px', color: '#6b7280' }}>+{aiRoles.length - 5} more roles</div>}
                        </div>
                    </div>
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid #e6e4dd', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onAcceptAI} style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Use AI Parser Results</button>
                </div>
            </div>
        </div>
    );
};

const SkillsAdvancedEditor = ({ skills, setSkills, onSave }) => {
    const [subcategories, setSubcategories] = useState([{ name: 'Core Competencies', skills: [] }, { name: 'Tools & Technologies', skills: [] }]);
    const [displayMode, setDisplayMode] = useState('chips');
    const [columnCount, setColumnCount] = useState(2);
    useEffect(() => {
        if (skills.length > 0 && subcategories[0].skills.length === 0) {
            const midPoint = Math.ceil(skills.length / 2);
            setSubcategories([{ name: 'Core Competencies', skills: skills.slice(0, midPoint) }, { name: 'Tools & Technologies', skills: skills.slice(midPoint) }]);
        }
    }, [skills]);
    const addSubcategory = () => setSubcategories([...subcategories, { name: 'New Category', skills: [] }]);
    const updateSubcategoryName = (idx, name) => { const updated = [...subcategories]; updated[idx].name = name; setSubcategories(updated); };
    const addSkillToSubcategory = (idx, skill) => { if (skill && !subcategories[idx].skills.includes(skill)) { const updated = [...subcategories]; updated[idx].skills.push(skill); setSubcategories(updated); } };
    const removeSkillFromSubcategory = (catIdx, skillIdx) => { const updated = [...subcategories]; updated[catIdx].skills.splice(skillIdx, 1); setSubcategories(updated); };
    const saveSkills = () => { const allSkills = subcategories.flatMap(cat => cat.skills); setSkills(allSkills); if (onSave) onSave(allSkills); };
    return (<div><div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}><label>Display as:</label><select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px' }}><option value="chips">Chips (colored badges)</option><option value="comma">Comma-separated text</option><option value="multi-column">Multi-column list</option></select>{displayMode === 'multi-column' && (<><label>Columns:</label><input type="number" min="1" max="4" value={columnCount} onChange={(e) => setColumnCount(Math.min(4, Math.max(1, parseInt(e.target.value) || 2)))} style={{ width: '60px', padding: '4px 8px', borderRadius: '4px' }} /></>)}</div>{subcategories.map((cat, catIdx) => (<div key={catIdx} style={{ marginBottom: '20px', padding: '12px', background: '#f8f7f4', borderRadius: '8px' }}><input type="text" value={cat.name} onChange={(e) => updateSubcategoryName(catIdx, e.target.value)} style={{ fontWeight: 600, marginBottom: '8px', background: 'transparent', border: 'none', fontSize: '12px', width: '100%' }} /><div style={{ display: displayMode === 'multi-column' ? 'grid' : 'flex', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, flexWrap: 'wrap', gap: '8px' }}>{cat.skills.map((skill, skillIdx) => (<span key={skillIdx} style={{ padding: '4px 10px', background: displayMode === 'chips' ? 'rgba(201,168,76,0.15)' : 'transparent', borderRadius: '20px', fontSize: '11px', color: '#c9a84c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{skill}<button onClick={() => removeSkillFromSubcategory(catIdx, skillIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button></span>))}</div><div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}><input type="text" placeholder="Add skill..." onKeyPress={(e) => { if (e.key === 'Enter') { addSkillToSubcategory(catIdx, e.target.value); e.target.value = ''; } }} style={{ flex: 1, padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e6e4dd' }} /><button onClick={() => { const input = document.activeElement; if (input && input.tagName === 'INPUT') { addSkillToSubcategory(catIdx, input.value); input.value = ''; } }} style={{ padding: '4px 10px', fontSize: '11px' }}>Add</button></div></div>))}<button onClick={addSubcategory} style={{ padding: '6px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c' }}>+ Add Category</button><div style={{ marginTop: '16px' }}><button onClick={saveSkills} style={{ padding: '6px 12px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Skills to Resume</button></div></div>);
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ResumeEditor({ result, jdText, resumeText, hiddenBriefAnalysis, onClose }) {
    // State
    const bulletAnalysis = result?.bullet_analysis;
    const summaryAnalysis = result?.summary_analysis;
    const skillExtractor = result?.skill_extractor;
    const [editMode, setEditMode] = useState(true);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('veritas_signature');
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [showJDContext, setShowJDContext] = useState(false);
    const [showHiddenBrief, setShowHiddenBrief] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [showExportChecklist, setShowExportChecklist] = useState(false);
    const [showAIParseComparison, setShowAIParseComparison] = useState(false);
    const [advancedSkills, setAdvancedSkills] = useState(false);
    const [dateFormat, setDateFormat] = useState('MM/YYYY');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isAIParsing, setIsAIParsing] = useState(false);
    const [aiParsedData, setAiParsedData] = useState(null);
    const [sectionPosition, setSectionPosition] = useState('bottom');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', linkedin: '', location: '' });
    const [summary, setSummary] = useState('');
    const [summaryVersion, setSummaryVersion] = useState('original');
    const [roles, setRoles] = useState([]);
    const [skills, setSkills] = useState([]);
    const [education, setEducation] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [projects, setProjects] = useState([]);
    const [publications, setPublications] = useState([]);
    const [customSections, setCustomSections] = useState([]);
    const [jdFeatures, setJdFeatures] = useState(null);
    const [liveScores, setLiveScores] = useState({ fit_score: 0, fit_label: 'Calculating...', bloom_gap: { candidate: 0, jd_required: 0, meets: false, delta: 0 }, ats_score: 0, semantic_position: 0, semantic_label: 'Perfectly positioned', credibility_score: 0, verb_strength: 0, metric_strength: 0, buzzword_count: 0, riasec_code: '' });
    const [stateHistory, setStateHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const stateRef = useRef({});
    const debounceTimer = useRef(null);
    const previewRef = useRef(null);
    const summaryVersionsRef = useRef({ original: '', veritas: '', hiddenBrief: '' });
    const autosaveTimer = useRef(null);

    // Update state ref
    useEffect(() => { stateRef.current = { roles: JSON.parse(JSON.stringify(roles)), summary, skills: [...skills], personalInfo: { ...personalInfo }, education: JSON.parse(JSON.stringify(education)), certifications: [...certifications], projects: JSON.parse(JSON.stringify(projects)), publications: [...publications], customSections: JSON.parse(JSON.stringify(customSections)) }; }, [roles, summary, skills, personalInfo, education, certifications, projects, publications, customSections]);
    
    // Undo/Redo
    const saveSnapshot = useCallback(() => { const snapshot = JSON.parse(JSON.stringify(stateRef.current)); setStateHistory(prev => [...prev.slice(0, historyIndex + 1), snapshot]); setHistoryIndex(prev => prev + 1); setHasUnsavedChanges(true); }, [historyIndex]);
    const undo = useCallback(() => { if (historyIndex > 0) { const snapshot = stateHistory[historyIndex - 1]; setRoles(snapshot.roles || []); setSummary(snapshot.summary || ''); setSkills(snapshot.skills || []); setPersonalInfo(snapshot.personalInfo || { name: '', email: '', phone: '', linkedin: '', location: '' }); setEducation(snapshot.education || []); setCertifications(snapshot.certifications || []); setProjects(snapshot.projects || []); setPublications(snapshot.publications || []); setCustomSections(snapshot.customSections || []); setHistoryIndex(prev => prev - 1); setHasUnsavedChanges(true); } }, [historyIndex, stateHistory]);
    const redo = useCallback(() => { if (historyIndex < stateHistory.length - 1) { const snapshot = stateHistory[historyIndex + 1]; setRoles(snapshot.roles || []); setSummary(snapshot.summary || ''); setSkills(snapshot.skills || []); setPersonalInfo(snapshot.personalInfo || {}); setEducation(snapshot.education || []); setCertifications(snapshot.certifications || []); setProjects(snapshot.projects || []); setPublications(snapshot.publications || []); setCustomSections(snapshot.customSections || []); setHistoryIndex(prev => prev + 1); setHasUnsavedChanges(true); } }, [historyIndex, stateHistory]);

    // Autosave
    useEffect(() => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); autosaveTimer.current = setInterval(() => { if (hasUnsavedChanges && roles.length > 0) { const draft = { roles, summary, skills, personalInfo, education, certifications, projects, publications, customSections, selectedTemplate, timestamp: Date.now() }; localStorage.setItem('veritas_resume_autosave', JSON.stringify(draft)); console.log('💾 Autosaved draft'); } }, 30000); return () => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); }; }, [roles, summary, skills, personalInfo, education, certifications, projects, publications, customSections, selectedTemplate, hasUnsavedChanges]);

    // Warn before close
    useEffect(() => { const handleBeforeUnload = (e) => { if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'; } }; window.addEventListener('beforeunload', handleBeforeUnload); return () => window.removeEventListener('beforeunload', handleBeforeUnload); }, [hasUnsavedChanges]);

    // Auto-collapse right sidebar in preview mode
    useEffect(() => { if (previewMode && showRightSidebar) setShowRightSidebar(false); }, [previewMode]);

    // Load saved sidebar states
    useEffect(() => { const savedLeft = localStorage.getItem('veritas_left_sidebar_open'); if (savedLeft !== null) setIsLeftSidebarOpen(savedLeft === 'true'); const savedRight = localStorage.getItem('veritas_right_sidebar_open'); if (savedRight !== null) setShowRightSidebar(savedRight === 'true'); }, []);
    const toggleLeftSidebar = () => { const newState = !isLeftSidebarOpen; setIsLeftSidebarOpen(newState); localStorage.setItem('veritas_left_sidebar_open', newState); };
    const toggleRightSidebar = () => { const newState = !showRightSidebar; setShowRightSidebar(newState); localStorage.setItem('veritas_right_sidebar_open', newState); };

    // Keyboard shortcuts
    useEffect(() => { const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); } if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDraft(); } if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); handleExportClick(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [undo, redo]);

    // Parse resume
    useEffect(() => {
        if (!resumeText) return;
        const parsed = parseResume(resumeText);
        const parsedRoles = (parsed.jobs || []).map((job, jobIndex) => ({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${jobIndex}-${Math.random()}`, title: job.title || 'Untitled Role', company: job.company || 'Unknown Company', startDate: job.dates ? job.dates.split(' - ')[0] || '' : '', endDate: job.dates ? job.dates.split(' - ')[1] || '' : '', bullets: (job.bullets || []).map((bulletText, bulletIndex) => ({ id: crypto.randomUUID ? crypto.randomUUID() : `bullet_${jobIndex}_${bulletIndex}_${Date.now()}`, text: bulletText, original: bulletText, veritas: null, hiddenBrief: null, showAlternatives: false })) }));
        setRoles(parsedRoles);
        setSkills(parsed.skills || []);
        setEducation((parsed.education || []).map((edu, idx) => ({ id: crypto.randomUUID ? crypto.randomUUID() : `edu_${idx}_${Date.now()}`, degree: edu.text || '', institution: '', year: edu.year || '' })));
        setCertifications(parsed.certifications || []);
        setProjects(parsed.projects || []);
        setPublications(parsed.publications || []);
        const extracted = extractPersonalInfo(resumeText);
        if (extracted.location && !extracted.location.includes('Google') && !extracted.location.includes('Collab')) { setPersonalInfo(extracted); }
        if (summaryAnalysis) { const originalText = summaryAnalysis.original_text || ''; setSummary(originalText); summaryVersionsRef.current = { original: originalText, veritas: summaryAnalysis.veritas_transformed_summary || '', hiddenBrief: summaryAnalysis.hb_transformed_summary || '' }; }
        setTimeout(() => saveSnapshot(), 100);
    }, [resumeText, summaryAnalysis]);

    // AI Parser
    const runAIParser = async () => {
        if (!resumeText || resumeText.trim().length < 100) { alert('Please provide valid resume text (minimum 100 characters)'); return; }
        setIsAIParsing(true);
        try {
            const response = await fetch('https://ats-stage-2-parser.keron62.workers.dev/parse/full', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText }) });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'AI parsing failed');
            const aiRoles = (data.jobs || []).map((job, idx) => ({ id: `ai_job_${Date.now()}_${idx}`, title: job.title || 'Untitled Role', company: job.company || 'Unknown Company', startDate: job.startDate || '', endDate: job.endDate || '', bullets: (job.bullets || []).map((bulletText, bulletIdx) => ({ id: `ai_bullet_${idx}_${bulletIdx}_${Date.now()}`, text: bulletText, original: bulletText, veritas: null, hiddenBrief: null, showAlternatives: false })) }));
            setAiParsedData({ roles: aiRoles, skills: data.skills || [], education: (data.education || []).map((edu, idx) => ({ id: `ai_edu_${idx}_${Date.now()}`, degree: edu, institution: '', year: '' })) });
            setShowAIParseComparison(true);
        } catch (error) { console.error('AI Parser error:', error); alert(`AI parsing failed: ${error.message}`); }
        finally { setIsAIParsing(false); }
    };
    const acceptAIResults = () => { if (aiParsedData) { setRoles(aiParsedData.roles); if (aiParsedData.skills) setSkills(aiParsedData.skills); if (aiParsedData.education) setEducation(aiParsedData.education); saveSnapshot(); setShowAIParseComparison(false); alert('✅ AI parser results applied!'); } };

    // JD Features
    useEffect(() => { if (jdText) setJdFeatures(extractJDFeatures(jdText)); }, [jdText]);

    // Bullet Functions
    const updateBullet = (roleId, bulletId, newText) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: role.bullets.map(b => b.id === bulletId ? { ...b, text: newText } : b) } : role)); };
    const applyVeritasVersion = (roleId, bulletId) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: role.bullets.map(b => b.id === bulletId && b.veritas ? { ...b, text: b.veritas } : b) } : role)); saveSnapshot(); };
    const applyHBVersion = (roleId, bulletId) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: role.bullets.map(b => b.id === bulletId && b.hiddenBrief ? { ...b, text: b.hiddenBrief } : b) } : role)); saveSnapshot(); };
    const resetBullet = (roleId, bulletId) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: role.bullets.map(b => b.id === bulletId && b.original ? { ...b, text: b.original } : b) } : role)); saveSnapshot(); };
    const addBullet = (roleId) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: [...role.bullets, { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text: '', original: '', veritas: null, hiddenBrief: null, showAlternatives: false }] } : role)); saveSnapshot(); };
    const deleteBullet = (roleId, bulletId) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, bullets: role.bullets.filter(b => b.id !== bulletId) } : role)); saveSnapshot(); };
    const updateRoleTitle = (roleId, newTitle) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, title: newTitle } : role)); };
    const updateRoleCompany = (roleId, newCompany) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, company: newCompany } : role)); };
    const updateRoleDates = (roleId, startDate, endDate) => { setRoles(prev => prev.map(role => role.id === roleId ? { ...role, startDate, endDate } : role)); };
    const addRole = () => { setRoles(prev => [...prev, { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title: 'New Role', company: 'Company Name', startDate: '', endDate: '', bullets: [] }]); saveSnapshot(); };
    const deleteRole = (roleId) => { setRoles(prev => prev.filter(role => role.id !== roleId)); saveSnapshot(); };
    const moveRole = (roleId, direction) => { setRoles(prev => { const idx = prev.findIndex(r => r.id === roleId); if (direction === 'up' && idx === 0) return prev; if (direction === 'down' && idx === prev.length - 1) return prev; const newRoles = [...prev]; const swapIdx = direction === 'up' ? idx - 1 : idx + 1; [newRoles[idx], newRoles[swapIdx]] = [newRoles[swapIdx], newRoles[idx]]; return newRoles; }); saveSnapshot(); };
    const addSkill = (skill) => { if (skill && !skills.includes(skill)) { setSkills(prev => [...prev, skill]); saveSnapshot(); } };
    const removeSkill = (skillToRemove) => { setSkills(prev => prev.filter(s => s !== skillToRemove)); saveSnapshot(); };
    const addEducation = () => { setEducation(prev => [...prev, { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, degree: '', institution: '', year: '' }]); saveSnapshot(); };
    const updateEducation = (id, field, value) => { setEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)); };
    const deleteEducation = (id) => { setEducation(prev => prev.filter(edu => edu.id !== id)); saveSnapshot(); };
    const updateCertification = (index, value) => { setCertifications(prev => { const updated = [...prev]; updated[index] = value; return updated; }); };
    const addCertification = () => { setCertifications(prev => [...prev, '']); saveSnapshot(); };
    const deleteCertification = (index) => { setCertifications(prev => prev.filter((_, i) => i !== index)); saveSnapshot(); };
    const addCustomSection = (name, type, position) => { setCustomSections(prev => [...prev, { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name, type, content: type === 'bulleted' ? [] : '' }]); saveSnapshot(); };
    const updateSummary = (newText) => { setSummary(newText); };
    const switchSummaryVersion = (version) => { const versions = summaryVersionsRef.current; if (version === 'original' && versions.original) { setSummary(versions.original); setSummaryVersion('original'); } else if (version === 'veritas' && versions.veritas) { setSummary(versions.veritas); setSummaryVersion('veritas'); } else if (version === 'hiddenBrief' && versions.hiddenBrief) { setSummary(versions.hiddenBrief); setSummaryVersion('hiddenBrief'); } saveSnapshot(); };
    const updatePersonalInfo = (field, value) => { setPersonalInfo(prev => ({ ...prev, [field]: value })); };

    // Build resume text for scoring
    const buildResumeText = useCallback(() => { let text = ''; if (personalInfo.name) text += `${personalInfo.name}\n`; if (personalInfo.email || personalInfo.phone) text += `${personalInfo.email} | ${personalInfo.phone}\n`; text += `\n`; if (summary) text += `${summary}\n\n`; for (const role of roles) { text += `${role.title} @ ${role.company}\n`; for (const bullet of role.bullets) text += `• ${bullet.text}\n`; text += `\n`; } if (skills.length) text += `Skills: ${skills.join(', ')}\n`; return text; }, [personalInfo, summary, roles, skills]);

    // Live scoring
    const updateLiveScores = useCallback(() => {
        if (!roles.length && !summary) return;
        const fullResumeText = buildResumeText();
        const candidateSeniority = detectSeniorityFromText(fullResumeText);
        const candidateYears = candidateSeniority.years_detected || 0;
        const candidateLevelNum = { entry: 1, mid: 2, senior: 3, executive: 4 }[candidateSeniority.level] || 2;
        const keywordMatchRate = jdFeatures ? calculateKeywordMatchRate(fullResumeText, jdFeatures.critical_keywords) : 0;
        const atsResult = calculateATSScore(fullResumeText, jdText, { keywordMatchRate, skillsCount: skills.length });
        let fitResult = { score: 50, label: 'Moderate' };
        if (jdFeatures) { const levelGap = candidateLevelNum - jdFeatures.seniority_level_num; const yearsGap = candidateYears - (jdFeatures.years_required || 3); fitResult = calculateFitScore({ keywordMatchRate, levelGap, yearsGap, matchingCertifications: 0, skillsMatchRate: 50 }); }
        let candidateBloomLevel = 3.5, bloomDelta = 0, bloomMeetsExpectation = true;
        if (roles.length > 0) { const bulletTexts = roles.flatMap(r => r.bullets.map(b => b.text)); if (bulletTexts.length) { const bloomAnalysis = analyzeBulletBloom(bulletTexts); candidateBloomLevel = bloomAnalysis.averageLevel; } }
        if (jdFeatures) { bloomDelta = candidateBloomLevel - jdFeatures.jd_bloom_level; bloomMeetsExpectation = bloomDelta >= -0.3; }
        const semanticResult = calculateSemanticPosition(fullResumeText, candidateYears);
        const credibilityResult = calculateCredibilityScore(fullResumeText, { titles: roles.map(r => ({ title: r.title })) });
        const verbAnalysis = analyzeVerbs(fullResumeText);
        const metricStrength = calculateMetricStrength(fullResumeText);
        const buzzwords = detectBuzzwords(fullResumeText);
        const riasecResult = calculateRIASECDeterministic(fullResumeText, null, false);
        setLiveScores({ fit_score: fitResult.score, fit_label: fitResult.label, bloom_gap: { candidate: Math.round(candidateBloomLevel * 10) / 10, jd_required: jdFeatures?.jd_bloom_level || 3.5, meets: bloomMeetsExpectation, delta: Math.round(bloomDelta * 10) / 10 }, ats_score: atsResult.total, semantic_position: semanticResult.position_score, semantic_label: semanticResult.position_label, credibility_score: credibilityResult.score, verb_strength: Math.round(verbAnalysis.averageStrength * 10), metric_strength: metricStrength, buzzword_count: buzzwords.total, riasec_code: riasecResult.candidate_codes || 'N/A' });
    }, [roles, summary, skills, jdFeatures, jdText, buildResumeText]);
    useEffect(() => { if (debounceTimer.current) clearTimeout(debounceTimer.current); debounceTimer.current = setTimeout(() => updateLiveScores(), 500); return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }; }, [roles, summary, skills, personalInfo, updateLiveScores]);

    // Export
    const getExportChecklist = () => { const hasName = !!personalInfo.name.trim(); const hasEmail = !!personalInfo.email.trim() && personalInfo.email.includes('@'); const hasPhone = !!personalInfo.phone.trim(); const hasLinkedIn = !!personalInfo.linkedin.trim(); const hasExperience = roles.some(r => r.bullets.length > 0); const hasEducation = education.length > 0 && education.some(e => e.degree.trim()); const hasSkills = skills.length > 0; return { critical: [{ label: 'Full Name', met: hasName }, { label: 'Email Address', met: hasEmail }, { label: 'Phone Number', met: hasPhone }, { label: 'LinkedIn URL', met: hasLinkedIn }, { label: 'Experience Section (at least 1 bullet)', met: hasExperience }, { label: 'Education Section', met: hasEducation }, { label: 'Skills Section (at least 3 skills)', met: skills.length >= 3 }], recommended: [{ label: 'Professional Summary', met: !!summary.trim() }, { label: 'Certifications (if applicable)', met: certifications.length > 0 }, { label: 'Projects (if applicable)', met: projects.length > 0 }] }; };
    const handleExportClick = () => setShowExportChecklist(true);
    const handleExportConfirm = async () => {
        setShowExportChecklist(false); setIsGeneratingPDF(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<ResumePDF personalInfo={personalInfo} summary={summary} roles={roles} skills={skills} education={education} certifications={certifications} projects={projects} publications={publications} selectedTemplate={selectedTemplate} />).toBlob();
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `veritas-resume-${Date.now()}.pdf`; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) { console.error('PDF export error:', error); alert('Failed to generate PDF. Please try again.'); }
        finally { setIsGeneratingPDF(false); }
    };
    const saveDraft = () => { const draft = { roles, summary, skills, personalInfo, education, certifications, projects, publications, customSections, selectedTemplate, timestamp: Date.now() }; localStorage.setItem('veritas_resume_draft', JSON.stringify(draft)); setHasUnsavedChanges(false); alert('Draft saved!'); };
    const loadDraft = () => { try { const draftJson = localStorage.getItem('veritas_resume_draft'); if (!draftJson) { alert('No saved draft found'); return; } const draft = JSON.parse(draftJson); if (!Array.isArray(draft.roles)) throw new Error('Invalid draft structure'); setRoles(draft.roles || []); setSummary(draft.summary || ''); setSkills(Array.isArray(draft.skills) ? draft.skills : []); setPersonalInfo(draft.personalInfo || { name: '', email: '', phone: '', linkedin: '', location: '' }); setEducation(Array.isArray(draft.education) ? draft.education : []); setCertifications(Array.isArray(draft.certifications) ? draft.certifications : []); setProjects(Array.isArray(draft.projects) ? draft.projects : []); setPublications(Array.isArray(draft.publications) ? draft.publications : []); setCustomSections(Array.isArray(draft.customSections) ? draft.customSections : []); setSelectedTemplate(draft.selectedTemplate || 'veritas_signature'); saveSnapshot(); setHasUnsavedChanges(false); alert('Draft loaded!'); } catch (err) { console.error('Failed to load draft:', err); alert('Failed to load draft. The saved data may be corrupted. Starting fresh.'); localStorage.removeItem('veritas_resume_draft'); } };

    const formatDate = (dateStr) => { if (!dateStr) return ''; if (dateFormat === 'MM/YYYY' && dateStr.match(/^\d{1,2}\/\d{4}$/)) return dateStr; if (dateFormat === 'Month YYYY') { const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; const match = dateStr.match(/^(\d{1,2})\/(\d{4})$/); if (match) return `${months[parseInt(match[1]) - 1]} ${match[2]}`; } return dateStr; };
    const getScoreColor = (score) => { if (score >= 80) return '#10b981'; if (score >= 60) return '#f59e0b'; return '#ef4444'; };
    const getBloomColor = (delta) => { if (delta >= 0) return '#10b981'; if (delta >= -0.5) return '#f59e0b'; return '#ef4444'; };
    const currentTemplate = TEMPLATES[selectedTemplate];
    const exportChecklist = getExportChecklist();

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3f0', position: 'relative' }}>
            {/* Left Sidebar Toggle Button */}
            <button onClick={toggleLeftSidebar} style={{ position: 'fixed', left: isLeftSidebarOpen ? 280 : 10, top: 80, zIndex: 150, background: '#c9a84c', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', transition: 'left 0.3s ease' }}>{isLeftSidebarOpen ? '◀' : '▶'}</button>
            
            {/* Left Sidebar */}
            <div style={{ width: isLeftSidebarOpen ? '280px' : '0px', overflow: isLeftSidebarOpen ? 'auto' : 'hidden', background: 'white', borderRight: '1px solid #e6e4dd', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.3s ease' }}>
                {isLeftSidebarOpen && (<>
                    {/* Logo */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd', display: 'flex', justifyContent: 'center' }}>
                        <img src="https://raw.githubusercontent.com/keron62-spec/VeritasResumeIntelligence/refs/heads/main/public/images/veritaslogo.jpeg?raw=true" alt="Veritas Logo" style={{ maxWidth: '120px', height: 'auto' }} />
                    </div>
                    {/* Template Selector */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd' }}><h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', marginBottom: '12px', textTransform: 'uppercase' }}>🎨 Templates</h3><select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e6e4dd', fontSize: '12px' }}>{Object.entries(TEMPLATES).map(([key, t]) => (<option key={key} value={key}>{t.icon} {t.name}</option>))}</select></div>
                    {/* AI Parser Button */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd' }}><button onClick={runAIParser} disabled={isAIParsing} style={{ width: '100%', padding: '10px', background: isAIParsing ? '#6b21a5' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: isAIParsing ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 500 }}>{isAIParsing ? '⏳ AI Parsing...' : '🤖 AI Parser (Gemini 3.1)'}</button></div>
                    {/* Mode Controls */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', flexDirection: 'column', gap: '8px' }}><button onClick={() => setEditMode(!editMode)} className="btn-secondary" style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>{editMode ? '👁️ Preview Mode' : '✏️ Edit Mode'}</button><button onClick={() => setPreviewMode(!previewMode)} style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>{previewMode ? '📝 Hide Preview' : '👁️ Show Preview'}</button></div>
                    {/* Draft Controls */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', gap: '8px' }}><button onClick={saveDraft} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>💾 Save</button><button onClick={loadDraft} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>📂 Load</button></div>
                    {/* Undo/Redo */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', gap: '8px' }}><button onClick={undo} disabled={historyIndex <= 0} style={{ flex: 1, padding: '6px', fontSize: '11px', background: historyIndex <= 0 ? '#f5f3f0' : 'white', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}>↩️ Undo</button><button onClick={redo} disabled={historyIndex >= stateHistory.length - 1} style={{ flex: 1, padding: '6px', fontSize: '11px', background: historyIndex >= stateHistory.length - 1 ? '#f5f3f0' : 'white', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: historyIndex >= stateHistory.length - 1 ? 'not-allowed' : 'pointer' }}>↪️ Redo</button></div>
                    {/* Export & Back */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}><button onClick={handleExportClick} disabled={isGeneratingPDF} className="btn-primary" style={{ padding: '10px', fontSize: '12px', fontWeight: 600, width: '100%', background: '#c9a84c', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1f2e' }}>{isGeneratingPDF ? '⏳ Generating...' : '📥 Export PDF'}</button><button onClick={() => onClose && onClose()} style={{ padding: '10px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>← Back to Analysis</button></div>
                    {/* Change Summary */}
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #e6e4dd' }}><h3 style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '8px', textTransform: 'uppercase' }}>Changes ({stateHistory.length})</h3><div style={{ fontSize: '10px', color: stateHistory.length ? '#10b981' : '#6b7280' }}>{stateHistory.length ? '✓ Ready to undo/redo' : 'No changes yet'}</div></div>
                </>)}
            </div>
            
            {/* Main Editor Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', transition: 'margin-left 0.3s ease' }}>
                {/* Character count for summary */}
                <div style={{ fontSize: '11px', textAlign: 'right', marginBottom: '8px', color: '#6b7280' }}>{summary.length} characters ({Math.round(summary.length / 5)} words)</div>
                
                {previewMode ? (
                    <div ref={previewRef} style={{ fontFamily: currentTemplate.fontFamily, maxWidth: '8.5in', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px', ...currentTemplate.headerStyle }}><div style={{ fontSize: currentTemplate.nameStyle?.fontSize || '28px', fontWeight: currentTemplate.nameStyle?.fontWeight || 700, color: currentTemplate.nameStyle?.color || '#1a1f2e', ...currentTemplate.nameStyle }}>{personalInfo.name || 'Your Name'}</div><div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>{[personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.location].filter(Boolean).join(' | ')}</div></div>
                        {summary && (<div style={{ marginBottom: '20px' }}><div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Professional Summary</div><div style={{ fontSize: '12px', lineHeight: '1.5' }}>{summary}</div></div>)}
                        <div><div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', ...currentTemplate.sectionStyle }}>Experience</div>{roles.slice(0, 5).map((role, idx) => (<div key={idx} style={{ marginBottom: '16px' }}>{currentTemplate.roleRow ? (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...currentTemplate.roleRow }}><div><span style={{ fontWeight: 600, fontSize: '12px' }}>{role.title}</span><span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>@ {role.company}</span></div><div style={{ fontSize: '10px', color: '#666', ...currentTemplate.dateText }}>{formatDate(role.startDate)} - {formatDate(role.endDate) || 'Present'}</div></div>) : (<div><div style={{ fontWeight: 600, fontSize: '12px' }}>{role.title} @ {role.company}</div><div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{formatDate(role.startDate)} - {formatDate(role.endDate) || 'Present'}</div></div>)}{role.bullets.slice(0, 3).map((bullet, bidx) => (<div key={bidx} style={{ fontSize: '11px', marginLeft: '12px', marginTop: '4px' }}>• {bullet.text}</div>))}{role.bullets.length > 3 && <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '12px', fontStyle: 'italic' }}>... and {role.bullets.length - 3} more</div>}</div>))}{roles.length > 5 && <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>... and {roles.length - 5} more roles</div>}</div>
                        {skills.length > 0 && (<div style={{ marginTop: '20px' }}><div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Skills</div><div style={{ fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{skills.slice(0, 15).map(skill => (<span key={skill} style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px' }}>{skill}</span>))}{skills.length > 15 && <span style={{ fontSize: '10px', color: '#6b7280' }}>+{skills.length - 15} more</span>}</div></div>)}
                        {education.length > 0 && education.some(e => e.degree) && (<div style={{ marginTop: '20px' }}><div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Education</div>{education.map((edu, idx) => (<div key={idx} style={{ fontSize: '11px', marginBottom: '8px' }}><strong>{edu.degree}</strong> {edu.institution && `from ${edu.institution}`} {edu.year && `(${edu.year})`}</div>))}</div>)}
                    </div>
                ) : (
                    <>
                        {/* Personal Info Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', padding: '20px' }}><h3 style={{ fontSize: '13px', marginBottom: '16px', color: '#c9a84c' }}>👤 Personal Information</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}><input type="text" placeholder="Full Name" value={personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="email" placeholder="Email" value={personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="tel" placeholder="Phone" value={personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="text" placeholder="LinkedIn URL" value={personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="text" placeholder="Location" value={personalInfo.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div></div>
                        
                        {/* Summary Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', overflow: 'hidden' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8f7f4', borderBottom: '1px solid #e6e4dd' }}><h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>📄 Professional Summary</h3>{(summaryVersionsRef.current.veritas || summaryVersionsRef.current.hiddenBrief) && (<div style={{ display: 'flex', gap: '6px' }}><button onClick={() => switchSummaryVersion('original')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'original' ? '#10b981' : 'transparent', color: summaryVersion === 'original' ? 'white' : '#6b7280', cursor: 'pointer' }}>📄 Original</button>{summaryVersionsRef.current.veritas && <button onClick={() => switchSummaryVersion('veritas')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'veritas' ? '#2563eb' : 'transparent', color: summaryVersion === 'veritas' ? 'white' : '#6b7280', cursor: 'pointer' }}>✨ Veritas</button>}{summaryVersionsRef.current.hiddenBrief && <button onClick={() => switchSummaryVersion('hiddenBrief')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'hiddenBrief' ? '#c9a84c' : 'transparent', color: summaryVersion === 'hiddenBrief' ? '#1a1f2e' : '#6b7280', cursor: 'pointer' }}>🕵️ Hidden Brief</button>}</div>)}</div><div style={{ padding: '20px' }}><textarea value={summary} onChange={(e) => updateSummary(e.target.value)} onBlur={saveSnapshot} disabled={!editMode} rows={4} style={{ width: '100%', padding: '12px', border: `1px solid ${summaryVersion === 'hiddenBrief' ? '#c9a84c' : summaryVersion === 'veritas' ? '#2563eb' : '#e6e4dd'}`, borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Professional summary goes here..." /></div></div>
                        
                        {/* Experience Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', overflow: 'hidden' }}><div style={{ padding: '16px 20px', background: '#f8f7f4', borderBottom: '1px solid #e6e4dd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>📝 Experience ({roles.reduce((acc, r) => acc + r.bullets.length, 0)} bullets)</h3>{editMode && <button onClick={addRole} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Role</button>}</div>
                        {roles.map((role, roleIdx) => (<div key={role.id} style={{ padding: '20px', borderBottom: roleIdx < roles.length - 1 ? '1px solid #e6e4dd' : 'none' }}><div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}><div style={{ flex: 1 }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}><div><label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Job Title</label><input type="text" value={role.title} onChange={(e) => updateRoleTitle(role.id, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div><div><label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Company</label><input type="text" value={role.company} onChange={(e) => updateRoleCompany(role.id, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}><div><label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Start Date</label><input type="text" placeholder="MM/YYYY" value={role.startDate} onChange={(e) => updateRoleDates(role.id, e.target.value, role.endDate)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div><div><label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>End Date (or "Present")</label><input type="text" placeholder="MM/YYYY or Present" value={role.endDate} onChange={(e) => updateRoleDates(role.id, role.startDate, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div>{editMode && (<div style={{ display: 'flex', gap: '4px', marginTop: '18px' }}><button onClick={() => moveRole(role.id, 'up')} disabled={roleIdx === 0} style={{ padding: '4px 8px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '3px', cursor: roleIdx === 0 ? 'not-allowed' : 'pointer' }}>▲</button><button onClick={() => moveRole(role.id, 'down')} disabled={roleIdx === roles.length - 1} style={{ padding: '4px 8px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '3px', cursor: roleIdx === roles.length - 1 ? 'not-allowed' : 'pointer' }}>▼</button><button onClick={() => deleteRole(role.id)} style={{ padding: '4px 8px', fontSize: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>🗑️</button></div>)}</div></div></div>
                        {role.bullets.map((bullet, bulletIdx) => (<div key={bullet.id} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e6e4dd' }}><textarea value={bullet.text} onChange={(e) => updateBullet(role.id, bullet.id, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #e6e4dd', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Enter bullet point..." /><div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>{(bullet.veritas || bullet.hiddenBrief) && <button onClick={() => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, bullets: r.bullets.map(b => b.id === bullet.id ? { ...b, showAlternatives: !b.showAlternatives } : b) } : r))} style={{ fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}>{bullet.showAlternatives ? '▼ Hide transformations' : '▶ Show alternative versions'}</button>}{editMode && <button onClick={() => deleteBullet(role.id, bullet.id)} style={{ fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}>🗑️ Delete</button>}</div>
                        {bullet.showAlternatives && (<div style={{ marginTop: '8px', padding: '10px', background: '#f8f7f4', borderRadius: '6px' }}>{bullet.veritas && bullet.veritas !== bullet.text && (<div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(37,99,235,0.05)', borderRadius: '4px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb', marginBottom: '4px' }}>✨ Veritas Version</div><div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.veritas}</div><button onClick={() => applyVeritasVersion(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button></div>)}{bullet.hiddenBrief && bullet.hiddenBrief !== bullet.text && (<div style={{ padding: '8px', background: 'rgba(201,168,76,0.08)', borderRadius: '4px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '4px' }}>🕵️ Hidden Brief Version</div><div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.hiddenBrief}</div><button onClick={() => applyHBVersion(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#c9a84c', color: '#1a1f2e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button></div>)}{bullet.original && bullet.original !== bullet.text && (<div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16,185,129,0.05)', borderRadius: '4px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>📄 Original Version</div><div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.original}</div><button onClick={() => resetBullet(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Restore Original</button></div>)}</div>)}</div>))}
                        {editMode && <button onClick={() => addBullet(role.id)} style={{ marginTop: '8px', fontSize: '11px', padding: '6px 12px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c' }}>+ Add Bullet</button>}</div>))}
                        {editMode && roles.length === 0 && (<div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No experience entries yet. Click "Add Role" to get started.</div>)}</div>
                        
                        {/* Skills Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>⚙️ Skills ({skills.length})</h3><button onClick={() => setAdvancedSkills(!advancedSkills)} style={{ padding: '4px 10px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}>{advancedSkills ? 'Switch to Simple View' : 'Advanced Mode'}</button></div>{advancedSkills ? <SkillsAdvancedEditor skills={skills} setSkills={setSkills} onSave={saveSnapshot} /> : (<><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>{skills.map((skill, idx) => (<span key={idx} style={{ padding: '6px 12px', background: 'rgba(201,168,76,0.1)', borderRadius: '20px', fontSize: '12px', color: '#c9a84c', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>{skill}{editMode && <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>×</button>}</span>))}</div>{editMode && (<div style={{ display: 'flex', gap: '8px' }}><input type="text" id="new-skill-input" placeholder="Add new skill..." onBlur={saveSnapshot} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '12px' }} onKeyPress={(e) => { if (e.key === 'Enter') { const input = e.target; const newSkill = input.value.trim(); if (newSkill && !skills.includes(newSkill)) { addSkill(newSkill); input.value = ''; } } }} /><button onClick={() => { const input = document.getElementById('new-skill-input'); const newSkill = input.value.trim(); if (newSkill && !skills.includes(newSkill)) { addSkill(newSkill); input.value = ''; } }} style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>+ Add Skill</button></div>)}</>)}</div>
                        
                        {/* Education Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>🎓 Education</h3>{editMode && <button onClick={addEducation} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Education</button>}</div>{education.map((edu) => (<div key={edu.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e6e4dd' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}><input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="text" placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /><input type="text" placeholder="Year" value={edu.year} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} /></div>{editMode && <button onClick={() => deleteEducation(edu.id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>}</div>))}{editMode && education.length === 0 && (<div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>No education entries yet. Click "Add Education" to get started.</div>)}</div>
                        
                        {/* Certifications Section */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>🏆 Certifications</h3>{editMode && <button onClick={addCertification} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Certification</button>}</div>{certifications.map((cert, idx) => (<div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}><input type="text" value={cert} onChange={(e) => updateCertification(idx, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} placeholder="e.g., PMP, AWS Certified Solutions Architect" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />{editMode && <button onClick={() => deleteCertification(idx)} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>}</div>))}{editMode && certifications.length === 0 && (<div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>No certifications added yet. Click "Add Certification" to get started.</div>)}</div>
                        
                        {/* Add Section Button */}
                        {editMode && <button onClick={() => setShowAddSectionModal(true)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '2px dashed #c9a84c', borderRadius: '12px', cursor: 'pointer', color: '#c9a84c', fontSize: '13px', marginBottom: '20px' }}>+ Add Custom Section</button>}
                    </>
                )}
            </div>
            
            {/* Right Sidebar */}
            {showRightSidebar && !previewMode && (<div style={{ width: '300px', background: 'white', borderLeft: '1px solid #e6e4dd', overflowY: 'auto', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.3s ease' }}><div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '12px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>📊 Live Scores</h3><button onClick={toggleRightSidebar} style={{ fontSize: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>✕</button></div><div style={{ marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🎯 JD Fit Score</span><span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.fit_score) }}>{liveScores.fit_score}%</span></div><div style={{ height: '6px', background: '#e6e4dd', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${liveScores.fit_score}%`, height: '100%', background: getScoreColor(liveScores.fit_score), borderRadius: '3px' }} /></div><div style={{ fontSize: '10px', color: liveScores.fit_score >= 80 ? '#10b981' : liveScores.fit_score >= 60 ? '#f59e0b' : '#ef4444', marginTop: '4px' }}>{liveScores.fit_label}</div></div><div style={{ marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🧠 Bloom Gap</span><span style={{ fontSize: '13px', fontWeight: 600, color: getBloomColor(liveScores.bloom_gap.delta) }}>{liveScores.bloom_gap.delta > 0 ? '+' : ''}{liveScores.bloom_gap.delta}</span></div><div style={{ fontSize: '10px', color: '#6b7280' }}>You: {liveScores.bloom_gap.candidate} | JD: {liveScores.bloom_gap.jd_required}</div>{liveScores.bloom_gap.meets ? <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>✓ Meets JD expectations</div> : <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>⚠ Below JD requirements</div>}</div><div style={{ marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>📄 ATS Score</span><span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.ats_score) }}>{liveScores.ats_score}%</span></div><div style={{ height: '4px', background: '#e6e4dd', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${liveScores.ats_score}%`, height: '100%', background: getScoreColor(liveScores.ats_score), borderRadius: '2px' }} /></div></div><div style={{ marginBottom: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🎭 Semantic Position</span><span style={{ fontSize: '13px', fontWeight: 600, color: Math.abs(liveScores.semantic_position) <= 1.5 ? '#10b981' : '#f59e0b' }}>{liveScores.semantic_position > 0 ? '+' : ''}{liveScores.semantic_position}</span></div><div style={{ fontSize: '10px', color: '#6b7280' }}>{liveScores.semantic_label}</div></div><details style={{ marginTop: '12px' }}><summary style={{ fontSize: '10px', cursor: 'pointer', color: '#6b7280' }}>Show details</summary><div style={{ marginTop: '12px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Credibility</span><span style={{ color: getScoreColor(liveScores.credibility_score) }}>{liveScores.credibility_score}%</span></div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Verb Strength</span><span>{liveScores.verb_strength}%</span></div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Metric Quality</span><span>{liveScores.metric_strength}%</span></div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Buzzwords</span><span style={{ color: liveScores.buzzword_count > 3 ? '#ef4444' : '#10b981' }}>{liveScores.buzzword_count}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}><span>RIASEC</span><span>{liveScores.riasec_code}</span></div></div></details></div>
            {jdText && (<div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd' }}><div onClick={() => setShowJDContext(!showJDContext)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Original JD</h3><span>{showJDContext ? '▼' : '▶'}</span></div>{showJDContext && (<div style={{ marginTop: '12px', fontSize: '11px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: '#f8f7f4', borderRadius: '6px' }}>{jdText.substring(0, 1000)}...</div>)}</div>)}
            {hiddenBriefAnalysis && (<div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd' }}><div onClick={() => setShowHiddenBrief(!showHiddenBrief)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>🕵️ Hidden Brief</h3><span>{showHiddenBrief ? '▼' : '▶'}</span></div>{showHiddenBrief && (<div style={{ marginTop: '12px' }}>{hiddenBriefAnalysis.core_problem?.inferred_problem && (<div style={{ marginBottom: '12px' }}><div style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444' }}>Hidden Problem</div><div style={{ fontSize: '11px', marginTop: '4px' }}>{hiddenBriefAnalysis.core_problem.inferred_problem}</div></div>)}{hiddenBriefAnalysis.language_pattern?.resume_framing_tip && (<div><div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c' }}>Framing Tip</div><div style={{ fontSize: '11px', marginTop: '4px' }}>{hiddenBriefAnalysis.language_pattern.resume_framing_tip}</div></div>)}}</div>)}</div>)}</div>)}
            
            {/* Modals */}
            <AddSectionModal isOpen={showAddSectionModal} onClose={() => setShowAddSectionModal(false)} onAdd={addCustomSection} sectionPosition={sectionPosition} setSectionPosition={setSectionPosition} availablePositions={[{ value: 'top', label: 'At the beginning' }, { value: 'after-summary', label: 'After Summary' }, { value: 'after-experience', label: 'After Experience' }, { value: 'bottom', label: 'At the bottom' }]} />
            <ExportChecklistModal isOpen={showExportChecklist} onClose={() => setShowExportChecklist(false)} onConfirm={handleExportConfirm} checklist={exportChecklist} />
            {isAIParsing && <AILoadingOverlay message="🤖 AI is parsing your resume with Gemini 3.1 Flash Lite..." />}
            {showAIParseComparison && aiParsedData && <AIParseComparisonModal isOpen={showAIParseComparison} onClose={() => setShowAIParseComparison(false)} deterministicRoles={roles} aiRoles={aiParsedData.roles} onAcceptAI={acceptAIResults} />}
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .btn-secondary:hover { border-color: #c9a84c; color: #c9a84c; }
                textarea:focus, input:focus, select:focus { outline: none; border-color: #c9a84c; }
            `}</style>
        </div>
    );
}
// src/components/ResumeEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============================================================
// DETERMINISTIC SCORING LIBRARIES
// ============================================================
import { calculateATSScore, calculateFitScore, calculateCredibilityScore, calculateSemanticPosition } from '../utils/scoreCalculator.js';
import { analyzeBulletBloom } from '../utils/deterministicBloom.js';
import { parseResume } from '../utils/bulletParser.js';
import { detectSeniorityFromText } from '../utils/seniorityDetector.js';
import { parseJobDescription, extractYearsRequired as extractJDYears } from '../utils/jdParser.js';
import { analyzeVerbs } from '../utils/verbs.js';
import { detectBuzzwords } from '../utils/buzzwords.js';
import { calculateMetricStrength } from '../utils/metricsPatterns.js';
import { calculateRIASECDeterministic } from '../utils/riasec.js';
import { extractPersonalInfo } from '../utils/personalInfoExtractor.js';

// ============================================================
// DEBOUNCE UTILITY
// ============================================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================
// PDF STYLES
// ============================================================
const createPDFStyles = (templateKey) => {
    const t = TEMPLATES[templateKey];
    if (!t) return StyleSheet.create({ page: { padding: 50, fontSize: 10.5, fontFamily: 'Helvetica' } });
    
    let fontFamily = 'Helvetica';
    if (t.name === 'classic' || t.name === 'harvard' || t.name === 'legal') fontFamily = 'Times-Roman';
    if (t.name === 'executive') fontFamily = 'Times-Roman';
    if (t.name === 'modern' || t.name === 'veritas_signature') fontFamily = 'Helvetica';
    if (t.name === 'consultancy') fontFamily = 'Helvetica';
    if (t.name === 'diplomat') fontFamily = 'Helvetica';
    if (t.name === 'faang') fontFamily = 'Courier';
    if (t.name === 'ats') fontFamily = 'Helvetica';
    
    return StyleSheet.create({
        page: {
            padding: t.pagePadding || 50,
            fontSize: t.fontSize || 10.5,
            fontFamily: fontFamily,
            lineHeight: t.lineHeight || 1.5
        },
        header: {
            textAlign: t.headerStyle?.textAlign || 'center',
            marginBottom: t.headerStyle?.marginBottom || 20,
            paddingBottom: t.headerStyle?.paddingBottom || 10,
            borderBottomWidth: t.headerStyle?.borderBottomWidth,
            borderBottomStyle: t.headerStyle?.borderBottomStyle,
            borderBottomColor: t.headerStyle?.borderBottomColor,
            borderTopWidth: t.headerStyle?.borderTopWidth,
            borderTopStyle: t.headerStyle?.borderTopStyle,
            borderTopColor: t.headerStyle?.borderTopColor
        },
        name: {
            fontSize: t.nameStyle?.fontSize || 24,
            fontWeight: t.nameStyle?.fontWeight || 'bold',
            marginBottom: t.nameStyle?.marginBottom || 5,
            textTransform: t.nameStyle?.textTransform || 'uppercase',
            letterSpacing: t.nameStyle?.letterSpacing || 1,
            color: t.nameStyle?.color || '#1a1f2e'
        },
        targetTitle: {
            fontSize: 12,
            fontWeight: 'normal',
            color: '#666',
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 16
        },
        contactRow: {
            fontSize: t.contactRow?.fontSize || 9,
            color: t.contactRow?.color || '#666',
            textAlign: t.contactRow?.textAlign || 'center',
            marginTop: t.contactRow?.marginTop || 5
        },
        sectionTitle: {
            fontSize: t.sectionStyle?.fontSize || 12,
            fontWeight: t.sectionStyle?.fontWeight || 'bold',
            marginTop: t.sectionStyle?.marginTop || 15,
            marginBottom: t.sectionStyle?.marginBottom || 8,
            textTransform: t.sectionStyle?.textTransform || 'uppercase',
            letterSpacing: t.sectionStyle?.letterSpacing || 1,
            backgroundColor: t.sectionStyle?.backgroundColor || 'transparent',
            padding: t.sectionStyle?.padding || 0,
            color: t.sectionStyle?.color || '#1a1f2e',
            borderBottomWidth: t.sectionStyle?.borderBottomWidth,
            borderBottomStyle: t.sectionStyle?.borderBottomStyle,
            borderBottomColor: t.sectionStyle?.borderBottomColor,
            borderTopWidth: t.sectionStyle?.borderTopWidth,
            borderTopStyle: t.sectionStyle?.borderTopStyle,
            borderTopColor: t.sectionStyle?.borderTopColor
        },
        roleRow: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: t.roleRow?.marginTop || 8
        },
        roleHeader: {
            fontWeight: 'bold',
            marginTop: 10,
            marginBottom: 2,
            fontSize: 11
        },
        companyText: {
            fontSize: 10,
            color: '#666',
            marginBottom: 4,
            fontStyle: 'italic'
        },
        dateText: {
            fontSize: t.dateText?.fontSize || 9,
            color: '#666',
            textAlign: t.dateText?.textAlign || 'right'
        },
        bullet: {
            marginLeft: 12,
            marginBottom: 4,
            fontSize: 10,
            lineHeight: 1.4
        },
        skillsText: {
            fontSize: 9,
            marginBottom: 8,
            lineHeight: 1.4
        },
        skillsGrid: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16
        },
        skillsColumn: {
            flex: 1
        }
    });
};

// ============================================================
// PDF Document Component
// ============================================================
const ResumePDF = ({ personalInfo, targetTitle, summary, roles, skills, education, certifications, projects, publications, selectedTemplate, customSections, dateFormat, formatDate, skillsSeparator, skillsColumns }) => {
    const styles = createPDFStyles(selectedTemplate);
    
    // Safety checks for personalInfo
    const safePersonalInfo = {
        name: personalInfo?.name || '',
        email: personalInfo?.email || '',
        phone: personalInfo?.phone || '',
        linkedin: personalInfo?.linkedin || '',
        location: personalInfo?.location || ''
    };
    
    // Format skills based on separator choice and column count
    const formatSkillsList = (skillsArray) => {
        if (!skillsArray || skillsArray.length === 0) return '';
        if (skillsSeparator === 'pipe') return skillsArray.join(' | ');
        if (skillsSeparator === 'bulleted') {
            // Split into columns
            const columns = Math.min(skillsColumns || 2, 4);
            const itemsPerColumn = Math.ceil(skillsArray.length / columns);
            const columnData = [];
            for (let i = 0; i < columns; i++) {
                columnData.push(skillsArray.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
            }
            return (
                <View style={styles.skillsGrid}>
                    {columnData.map((col, idx) => (
                        <View key={idx} style={styles.skillsColumn}>
                            {col.map((skill, i) => (
                                <Text key={i} style={{ fontSize: 9, marginBottom: 4 }}>• {skill}</Text>
                            ))}
                        </View>
                    ))}
                </View>
            );
        }
        return skillsArray.join(', ');
    };
    
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header - keep wrap={false} */}
                <View style={styles.header} wrap={false}>
                    <Text style={styles.name}>{safePersonalInfo.name || 'Your Name'}</Text>
                    <Text style={styles.contactRow}>
                        {[safePersonalInfo.email, safePersonalInfo.phone, safePersonalInfo.linkedin, safePersonalInfo.location].filter(Boolean).join(' | ')}
                    </Text>
                    {targetTitle && <Text style={styles.targetTitle}>{targetTitle}</Text>}
                </View>
                
                {/* Summary - allow wrap */}
                {summary && (
                    <View>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={{ fontSize: 10, marginBottom: 12 }}>{summary}</Text>
                    </View>
                )}
                
                {/* Experience - allow wrap for pagination */}
                <Text style={styles.sectionTitle}>Experience</Text>
                {roles && roles.map((role, idx) => (
                    <View key={idx} style={{ marginBottom: 12 }}>
                        {styles.roleRow ? (
                            <View style={styles.roleRow}>
                                <View>
                                    <Text style={styles.roleHeader}>{role?.title || 'Untitled'}</Text>
                                    <Text style={styles.companyText}>{role?.company || 'Unknown Company'}</Text>
                                </View>
                                <Text style={styles.dateText}>{formatDate ? formatDate(role?.startDate) : role?.startDate || ''} – {formatDate ? formatDate(role?.endDate) : (role?.endDate || 'Present')}</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.roleHeader}>{role?.title || 'Untitled'}</Text>
                                <Text style={styles.companyText}>{role?.company || 'Unknown Company'}</Text>
                                <Text style={styles.dateText}>{formatDate ? formatDate(role?.startDate) : role?.startDate || ''} – {formatDate ? formatDate(role?.endDate) : (role?.endDate || 'Present')}</Text>
                            </>
                        )}
                        {role?.bullets && role.bullets.map((bullet, bidx) => (
                            <Text key={bidx} style={styles.bullet}>• {bullet?.text || ''}</Text>
                        ))}
                    </View>
                ))}
                
                {/* Skills */}
                {skills && skills.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        {typeof formatSkillsList(skills) === 'string' ? (
                            <Text style={styles.skillsText}>{formatSkillsList(skills)}</Text>
                        ) : (
                            formatSkillsList(skills)
                        )}
                    </View>
                )}
                
                {/* Education */}
                {education && education.length > 0 && education.some(e => e?.degree) && (
                    <View>
                        <Text style={styles.sectionTitle}>Education</Text>
                        {education.map((edu, idx) => (
                            <View key={idx} style={{ marginBottom: 8 }}>
                                <Text style={styles.roleHeader}>{edu?.degree || ''}</Text>
                                <Text style={styles.companyText}>{edu?.institution || ''} {edu?.year && `(${edu.year})`}</Text>
                            </View>
                        ))}
                    </View>
                )}
                
                {/* Certifications - each on new line */}
                {certifications && certifications.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Certifications</Text>
                        {certifications.map((cert, idx) => (
                            <Text key={idx} style={styles.bullet}>• {cert}</Text>
                        ))}
                    </View>
                )}
                
                {/* Projects - bulleted list */}
                {projects && projects.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        {projects.map((project, idx) => (
                            <View key={idx} style={{ marginBottom: 8 }}>
                                <Text style={styles.roleHeader}>{project?.name || 'Untitled Project'}</Text>
                                {project?.bullets && project.bullets.map((bullet, bidx) => (
                                    <Text key={bidx} style={styles.bullet}>• {bullet}</Text>
                                ))}
                            </View>
                        ))}
                    </View>
                )}
                
                {/* Publications - bulleted list */}
                {publications && publications.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Publications</Text>
                        {publications.map((pub, idx) => (
                            <Text key={idx} style={styles.bullet}>• {pub}</Text>
                        ))}
                    </View>
                )}
                
                {/* Custom Sections */}
                {customSections && customSections.map((section, idx) => (
                    <View key={idx}>
                        <Text style={styles.sectionTitle}>{section?.name || 'Section'}</Text>
                        {section?.type === 'bulleted' ? (
                            Array.isArray(section?.content) && section.content.map((item, i) => (
                                <Text key={i} style={styles.bullet}>• {item}</Text>
                            ))
                        ) : (
                            <Text style={{ fontSize: 10, marginBottom: 8 }}>{section?.content || ''}</Text>
                        )}
                    </View>
                ))}
            </Page>
        </Document>
    );
};

// ============================================================
// TEMPLATE STYLES
// ============================================================
const TEMPLATES = {
    classic: {
        name: 'classic',
        icon: '📄',
        fontFamily: "'Times New Roman', 'Georgia', serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: '#1a1a1a', paddingBottom: 10 },
        nameStyle: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 2 },
        sectionStyle: { borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: 'bold' }
    },
    modern: {
        name: 'modern',
        icon: '✨',
        fontFamily: "'Helvetica', 'Arial', sans-serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 24 },
        nameStyle: { fontSize: 28, fontWeight: '600', color: '#1a1f2e' },
        sectionStyle: { color: '#c9a84c', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#e6e4dd', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginTop: 24, marginBottom: 12, paddingBottom: 4 }
    },
    executive: {
        name: 'executive',
        icon: '👑',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 20, borderTopWidth: 6, borderTopStyle: 'solid', borderTopColor: '#c9a84c', paddingTop: 20 },
        nameStyle: { fontSize: 28, fontWeight: 'bold', color: '#2c1810' },
        sectionStyle: { color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginTop: 24, marginBottom: 12 }
    },
    ats: {
        name: 'ats',
        icon: '🤖',
        fontFamily: "'Arial', sans-serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 20 },
        nameStyle: { fontSize: 24, fontWeight: 'bold' },
        sectionStyle: { backgroundColor: '#f0f0f0', padding: 4, fontWeight: 700, textTransform: 'uppercase', marginTop: 15, marginBottom: 8 }
    },
    veritas_signature: {
        name: 'veritas_signature',
        icon: '👁️',
        fontFamily: "'Helvetica', 'Arial', sans-serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 24 },
        nameStyle: { fontSize: 32, fontWeight: '800', color: '#1a1f2e' },
        sectionStyle: { color: '#c9a84c', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#e6e4dd', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginTop: 24, marginBottom: 12, paddingBottom: 4 }
    },
    consultancy: {
        name: 'consultancy',
        icon: '📊',
        fontFamily: "'Helvetica', 'Arial', sans-serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.45,
        headerStyle: { borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: '#000', paddingBottom: 8, marginBottom: 15 },
        nameStyle: { fontSize: 18, fontWeight: 'bold', marginBottom: 3 },
        sectionStyle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#000', paddingBottom: 2, marginTop: 16, marginBottom: 6 },
        roleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
        dateText: { textAlign: 'right', fontSize: 9.5 }
    },
    diplomat: {
        name: 'diplomat',
        icon: '🌐',
        fontFamily: "'Helvetica', 'Arial', sans-serif",
        pagePadding: 55,
        fontSize: 10.5,
        lineHeight: 1.6,
        headerStyle: { marginBottom: 20 },
        nameStyle: { fontSize: 20, fontWeight: 'bold', letterSpacing: 3, textTransform: 'uppercase', color: '#1a3a5c' },
        sectionStyle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, color: '#1a3a5c', borderBottomWidth: 0.5, borderBottomStyle: 'solid', borderBottomColor: '#1a3a5c', paddingBottom: 3, marginTop: 18, marginBottom: 8 }
    },
    harvard: {
        name: 'harvard',
        icon: '🏛️',
        fontFamily: "'Times New Roman', 'Georgia', serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#000', paddingBottom: 8, marginBottom: 12 },
        nameStyle: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
        sectionStyle: { borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#000', textTransform: 'uppercase', fontWeight: 'bold', marginTop: 16, marginBottom: 8, fontSize: 12 },
        roleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
        dateText: { textAlign: 'right', fontWeight: 'normal' }
    },
    faang: {
        name: 'faang',
        icon: '💻',
        fontFamily: "'Courier New', monospace",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'left', marginBottom: 16 },
        nameStyle: { fontSize: 28, fontWeight: '900', letterSpacing: '-0.5px' },
        sectionStyle: { color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginTop: 20, marginBottom: 10 }
    },
    legal: {
        name: 'legal',
        icon: '⚖️',
        fontFamily: "'Times New Roman', 'Georgia', serif",
        pagePadding: 50,
        fontSize: 10.5,
        lineHeight: 1.5,
        headerStyle: { textAlign: 'center', marginBottom: 20 },
        nameStyle: { fontSize: 26, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
        sectionStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: '#000', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#000', paddingTop: 4, paddingBottom: 4, marginTop: 20, marginBottom: 12 }
    }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function safeUUID() {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random()}`;
    }
}

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
    const lowerResume = (resumeText || '').toLowerCase();
    let matchCount = 0;
    for (const keyword of jdKeywords) { if (lowerResume.includes(keyword)) matchCount++; }
    return Math.round((matchCount / jdKeywords.length) * 100);
}

// ============================================================
// FORMAT DATE
// ============================================================
function formatDate(dateStr, dateFormatPreference) {
    if (!dateStr) return '';
    if (dateFormatPreference === 'MM/YYYY' && dateStr.match(/^\d{1,2}\/\d{4}$/)) return dateStr;
    if (dateFormatPreference === 'Month YYYY') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const match = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
        if (match) {
            const monthNum = parseInt(match[1], 10);
            if (monthNum >= 1 && monthNum <= 12) {
                return `${months[monthNum - 1]} ${match[2]}`;
            }
            return match[0];
        }
    }
    return dateStr;
}

// ============================================================
// DRAG AND DROP SECTION REORDERING COMPONENT
// ============================================================
const SectionReorderModal = ({ isOpen, onClose, sections, onReorder, sectionOrder, setSectionOrder, hiddenSections, setHiddenSections }) => {
    const [dragIndex, setDragIndex] = useState(null);
    const [localOrder, setLocalOrder] = useState([]);
    
    useEffect(() => {
        if (sections && sectionOrder) {
            const visibleOrder = sectionOrder.filter(s => !hiddenSections.includes(s));
            setLocalOrder([...visibleOrder]);
        }
    }, [sections, sectionOrder, hiddenSections]);
    
    const handleDragStart = (index) => {
        setDragIndex(index);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const handleDrop = (targetIndex) => {
        if (dragIndex === null) return;
        const newOrder = [...localOrder];
        const draggedItem = newOrder[dragIndex];
        newOrder.splice(dragIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        setLocalOrder(newOrder);
        setDragIndex(null);
    };
    
    const handleSave = () => {
        const allSections = [...localOrder, ...hiddenSections];
        setSectionOrder(allSections);
        onReorder(allSections);
        onClose();
    };
    
    const handleToggleSection = (sectionId) => {
        if (hiddenSections.includes(sectionId)) {
            setHiddenSections(prev => prev.filter(s => s !== sectionId));
            setLocalOrder(prev => [...prev, sectionId]);
        } else {
            setHiddenSections(prev => [...prev, sectionId]);
            setLocalOrder(prev => prev.filter(s => s !== sectionId));
        }
    };
    
    if (!isOpen) return null;
    
    const sectionLabels = {
        'target-title': { label: 'Target Title', icon: '🎯' },
        'summary': { label: 'Professional Summary', icon: '📄' },
        'experience': { label: 'Work Experience', icon: '💼' },
        'skills': { label: 'Skills', icon: '⚙️' },
        'projects': { label: 'Projects', icon: '🚀' },
        'certifications': { label: 'Certifications', icon: '🏆' },
        'education': { label: 'Education', icon: '🎓' },
        'publications': { label: 'Publications', icon: '📝' }
    };
    
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#c9a84c' }}>📋 Reorder Resume Sections</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>Drag and drop to reorder. Click 👁️ to hide/show sections.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {localOrder.map((sectionId, index) => {
                        const info = sectionLabels[sectionId] || { label: sectionId, icon: '📌' };
                        const isHidden = hiddenSections.includes(sectionId);
                        return (
                            <div
                                key={sectionId}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(index)}
                                style={{
                                    padding: '12px 16px',
                                    background: dragIndex === index ? '#e6e4dd' : '#f8f7f4',
                                    border: '1px solid #e6e4dd',
                                    borderRadius: '8px',
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    opacity: isHidden ? 0.5 : 1
                                }}
                            >
                                <span style={{ cursor: 'grab', color: '#6b7280' }}>⋮⋮</span>
                                <span style={{ fontSize: '18px' }}>{info.icon}</span>
                                <span style={{ flex: 1 }}>{info.label}</span>
                                <button
                                    onClick={() => handleToggleSection(sectionId)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: isHidden ? '#10b981' : '#ef4444'
                                    }}
                                    title={isHidden ? 'Show section' : 'Hide section'}
                                >
                                    {isHidden ? '👁️ Show' : '👁️‍🗨️ Hide'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: '8px 16px', background: '#c9a84c', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1f2e', fontWeight: 500 }}>Apply Order</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// FLOATING TEXT FORMATTING TOOLBAR
// ============================================================
const FloatingToolbar = ({ position, onFormat, onClose }) => {
    const toolbarRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    if (!position) return null;
    
    return (
        <div
            ref={toolbarRef}
            style={{
                position: 'fixed',
                top: position.top - 40,
                left: position.left,
                background: '#1a1f2e',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                gap: '8px',
                zIndex: 10000,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
        >
            <button
                onClick={() => onFormat('bold')}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                title="Bold"
            >
                <strong>B</strong>
            </button>
            <button
                onClick={() => onFormat('italic')}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontStyle: 'italic' }}
                title="Italic"
            >
                <em>I</em>
            </button>
            <button
                onClick={() => onFormat('underline')}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
                title="Underline"
            >
                <u>U</u>
            </button>
        </div>
    );
};

// ============================================================
// MODAL COMPONENTS
// ============================================================
const AddSectionModal = ({ isOpen, onClose, onAdd, sectionPosition, setSectionPosition }) => {
    const [sectionName, setSectionName] = useState('');
    const [sectionType, setSectionType] = useState('bulleted');
    if (!isOpen) return null;
    const positions = [
        { value: 'top', label: 'At the beginning' },
        { value: 'after-summary', label: 'After Summary' },
        { value: 'after-experience', label: 'After Experience' },
        { value: 'bottom', label: 'At the bottom' }
    ];
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
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>Position</label>
                    <select value={sectionPosition} onChange={(e) => setSectionPosition(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px' }}>
                        {positions.map(pos => (<option key={pos.value} value={pos.value}>{pos.label}</option>))}
                    </select>
                </div>
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
                    {checklist.critical.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '11px' }}>
                            <span style={{ color: item.met ? '#10b981' : '#ef4444' }}>{item.met ? '✅' : '❌'}</span>
                            <span style={{ color: item.met ? '#10b981' : '#ef4444' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '12px' }}>Recommended Fields (Optional)</div>
                    {checklist.recommended.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '11px' }}>
                            <span>{item.met ? '✅' : '⚠️'}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
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

// ============================================================
// AI Parser Comparison Modal
// ============================================================
const AIParseComparisonModal = ({ isOpen, onClose, deterministicRoles, deterministicSkills, deterministicEducation, aiParsedData, onAcceptAI }) => {
    if (!isOpen || !aiParsedData) return null;
    
    const deterministicCount = deterministicRoles?.reduce((acc, r) => acc + (r?.bullets?.length || 0), 0) || 0;
    const aiCount = aiParsedData.roles?.reduce((acc, r) => acc + (r?.bullets?.length || 0), 0) || 0;
    
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflowY: 'auto', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd', background: '#f8f7f4' }}>
                    <h3 style={{ margin: 0, color: '#c9a84c' }}>🤖 AI Parse Results</h3>
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>Compare deterministic parser vs AI parser results. Choose which version to use.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
                    <div style={{ border: '1px solid #3b82f6', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#3b82f6', padding: '12px', color: 'white', fontWeight: 600 }}>🔍 Deterministic Parser</div>
                        <div style={{ padding: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                            <div><strong>{deterministicRoles?.length || 0}</strong> roles, <strong>{deterministicCount}</strong> bullets</div>
                            <div><strong>{deterministicSkills?.length || 0}</strong> skills</div>
                            <div><strong>{deterministicEducation?.length || 0}</strong> education entries</div>
                            {deterministicRoles?.slice(0, 3).map((role, i) => (
                                <div key={i} style={{ marginTop: '12px', padding: '8px', background: '#f8f7f4', borderRadius: '4px', fontSize: '12px' }}>
                                    <strong>{role?.title || 'Untitled'}</strong> @ {role?.company || 'Unknown'}<br />
                                    {role?.bullets?.length || 0} bullets
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ border: '1px solid #8b5cf6', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#8b5cf6', padding: '12px', color: 'white', fontWeight: 600 }}>🤖 AI Parser (Gemma 4 31B)</div>
                        <div style={{ padding: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                            <div><strong>{aiParsedData.roles?.length || 0}</strong> roles, <strong>{aiCount}</strong> bullets</div>
                            <div><strong>{aiParsedData.skills?.length || 0}</strong> skills</div>
                            <div><strong>{aiParsedData.education?.length || 0}</strong> education entries</div>
                            {aiParsedData.projects?.length > 0 && <div><strong>{aiParsedData.projects.length}</strong> projects</div>}
                            {aiParsedData.certifications?.length > 0 && <div><strong>{aiParsedData.certifications.length}</strong> certifications</div>}
                            {aiParsedData.publications?.length > 0 && <div><strong>{aiParsedData.publications.length}</strong> publications</div>}
                            {aiParsedData.roles?.slice(0, 3).map((role, i) => (
                                <div key={i} style={{ marginTop: '12px', padding: '8px', background: '#f8f7f4', borderRadius: '4px', fontSize: '12px' }}>
                                    <strong>{role?.title || 'Untitled'}</strong> @ {role?.company || 'Unknown'}<br />
                                    {role?.bullets?.length || 0} bullets
                                </div>
                            ))}
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

// ============================================================
// SKILLS ADVANCED EDITOR
// ============================================================
const SkillsAdvancedEditor = ({ skills, setSkills, onSave, skillsSeparator, setSkillsSeparator, skillsColumns, setSkillsColumns }) => {
    const [subcategories, setSubcategories] = useState([
        { name: 'Core Competencies', skills: [] },
        { name: 'Tools & Technologies', skills: [] }
    ]);
    const [prevSkillsLength, setPrevSkillsLength] = useState(0);
    const [dragIndex, setDragIndex] = useState(null);
    const [dragCategoryIndex, setDragCategoryIndex] = useState(null);
    const [dragSourceIsMaster, setDragSourceIsMaster] = useState(false);
    
    useEffect(() => {
        if (skills && skills.length !== prevSkillsLength || prevSkillsLength === 0) {
            const midPoint = Math.ceil(skills.length / 2);
            setSubcategories([
                { name: 'Core Competencies', skills: skills.slice(0, midPoint) },
                { name: 'Tools & Technologies', skills: skills.slice(midPoint) }
            ]);
            setPrevSkillsLength(skills.length);
        }
    }, [skills, prevSkillsLength]);
    
    const addSubcategory = () => {
        setSubcategories([...subcategories, { name: 'New Category', skills: [] }]);
    };
    
    const updateSubcategoryName = (idx, name) => {
        const updated = [...subcategories];
        updated[idx].name = name;
        setSubcategories(updated);
    };
    
    const addSkillToSubcategory = (catIdx, skill) => {
        if (skill && !subcategories[catIdx].skills.includes(skill)) {
            const updated = [...subcategories];
            updated[catIdx].skills.push(skill);
            setSubcategories(updated);
        }
    };
    
    const removeSkillFromSubcategory = (catIdx, skillIdx) => {
        const updated = [...subcategories];
        updated[catIdx].skills.splice(skillIdx, 1);
        setSubcategories(updated);
    };
    
    const handleDragStart = (source, categoryIndex, skillIndex) => {
        if (source === 'master') {
            setDragSourceIsMaster(true);
            setDragCategoryIndex(null);
            setDragIndex(skillIndex);
        } else {
            setDragSourceIsMaster(false);
            setDragCategoryIndex(categoryIndex);
            setDragIndex(skillIndex);
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const handleDrop = (targetCategoryIndex, targetSkillIndex) => {
        if (dragIndex === null) return;
        
        const newSubcategories = [...subcategories];
        
        if (dragSourceIsMaster) {
            const draggedSkill = skills[dragIndex];
            if (draggedSkill && !newSubcategories[targetCategoryIndex].skills.includes(draggedSkill)) {
                newSubcategories[targetCategoryIndex].skills.splice(targetSkillIndex, 0, draggedSkill);
                setSubcategories(newSubcategories);
            }
        } else {
            if (dragCategoryIndex === null) return;
            const draggedSkill = newSubcategories[dragCategoryIndex].skills[dragIndex];
            if (!draggedSkill) return;
            newSubcategories[dragCategoryIndex].skills.splice(dragIndex, 1);
            newSubcategories[targetCategoryIndex].skills.splice(targetSkillIndex, 0, draggedSkill);
            setSubcategories(newSubcategories);
        }
        
        setDragIndex(null);
        setDragCategoryIndex(null);
        setDragSourceIsMaster(false);
    };
    
    const saveSkills = () => {
        const allSkills = subcategories.flatMap(cat => cat.skills);
        setSkills(allSkills);
        if (onSave) onSave();
    };
    
    const renderSkillsPreview = () => {
        const allSkills = subcategories.flatMap(cat => cat.skills);
        if (!allSkills.length) return '';
        if (skillsSeparator === 'pipe') return allSkills.join(' | ');
        if (skillsSeparator === 'bulleted') return allSkills.map(s => `• ${s}`).join('\n');
        return allSkills.join(', ');
    };
    
    return (
        <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '11px', color: '#6b7280' }}>Separator for rendered output:</label>
                <select value={skillsSeparator} onChange={(e) => setSkillsSeparator(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    <option value="comma">Comma-separated (e.g., Skill A, Skill B)</option>
                    <option value="pipe">Pipe-separated (e.g., Skill A | Skill B)</option>
                    <option value="bulleted">Bulleted list</option>
                </select>
                
                {skillsSeparator === 'bulleted' && (
                    <>
                        <label style={{ fontSize: '11px', color: '#6b7280' }}>Columns:</label>
                        <select value={skillsColumns} onChange={(e) => setSkillsColumns(parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            <option value={1}>1 Column</option>
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                        </select>
                    </>
                )}
            </div>
            
            <div style={{ marginBottom: '12px', padding: '10px', background: '#f8f7f4', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Preview (how it will look in PDF):</div>
                <div style={{ fontSize: '11px' }}>{renderSkillsPreview()}</div>
            </div>
            
            <details style={{ marginTop: '12px' }}>
                <summary style={{ fontSize: '11px', cursor: 'pointer', color: '#c9a84c' }}>Edit Skill Categories (Drag & Drop)</summary>
                <div style={{ marginTop: '12px' }}>
                    <div style={{ marginBottom: '12px', padding: '8px', background: '#f8f7f4', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '8px' }}>Master Skills Bucket (drag from here to categories):</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {skills && skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    draggable
                                    onDragStart={() => handleDragStart('master', null, idx)}
                                    onDragEnd={() => {
                                        setDragIndex(null);
                                        setDragCategoryIndex(null);
                                        setDragSourceIsMaster(false);
                                    }}
                                    style={{
                                        padding: '4px 10px',
                                        background: '#e6e4dd',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        cursor: 'grab',
                                        color: '#1a1f2e'
                                    }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {subcategories.map((cat, catIdx) => (
                        <div key={catIdx} style={{ marginBottom: '20px', padding: '12px', background: '#f8f7f4', borderRadius: '8px' }}>
                            <input type="text" value={cat.name} onChange={(e) => updateSubcategoryName(catIdx, e.target.value)} style={{ fontWeight: 600, marginBottom: '8px', background: 'transparent', border: 'none', fontSize: '12px', width: '100%' }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', minHeight: '40px' }}>
                                {cat.skills.map((skill, skillIdx) => (
                                    <span
                                        key={skillIdx}
                                        draggable
                                        onDragStart={() => handleDragStart('category', catIdx, skillIdx)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(catIdx, skillIdx)}
                                        style={{
                                            padding: '4px 10px',
                                            background: 'rgba(201,168,76,0.1)',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            color: '#c9a84c',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'grab'
                                        }}
                                    >
                                        {skill}
                                        <button onClick={() => removeSkillFromSubcategory(catIdx, skillIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>×</button>
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" placeholder="Add skill..." onKeyPress={(e) => { if (e.key === 'Enter') { addSkillToSubcategory(catIdx, e.target.value); e.target.value = ''; } }} style={{ flex: 1, padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e6e4dd' }} />
                                <button onClick={() => {
                                    const input = document.activeElement;
                                    if (input && input.tagName === 'INPUT' && input.value) {
                                        addSkillToSubcategory(catIdx, input.value);
                                        input.value = '';
                                    }
                                }} style={{ padding: '4px 10px', fontSize: '11px' }}>Add</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addSubcategory} style={{ padding: '6px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c' }}>+ Add Category</button>
                    <button onClick={saveSkills} style={{ marginLeft: '12px', padding: '6px 12px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>Apply Skills to Resume</button>
                </div>
            </details>
        </div>
    );
};

// ============================================================
// TOAST NOTIFICATION
// ============================================================
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: colors[type] || '#1a1f2e',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: 10000,
            fontSize: '13px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease'
        }}>
            {message}
        </div>
    );
};

// ============================================================
// SAVED STATE KEY
// ============================================================
const EDITOR_STATE_KEY = 'veritas_editor_saved_state';

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ResumeEditor({ result, jdText, resumeText, setResumeText, hiddenBriefAnalysis, onClose }) {
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
    const [aiParseFailed, setAiParseFailed] = useState(false);
    const [isExtractingPDF, setIsExtractingPDF] = useState(false);
    const [pdfExtractionError, setPdfExtractionError] = useState(null);
    const [aiParsedData, setAiParsedData] = useState(null);
    const [sectionPosition, setSectionPosition] = useState('bottom');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [toast, setToast] = useState(null);
    const [targetTitle, setTargetTitle] = useState('');
    const [summaryVersion, setSummaryVersion] = useState('original');
    const [skillsSeparator, setSkillsSeparator] = useState('comma');
    const [skillsColumns, setSkillsColumns] = useState(2);
    const [sectionOrder, setSectionOrder] = useState(['target-title', 'summary', 'experience', 'skills', 'projects', 'certifications', 'education', 'publications']);
    const [hiddenSections, setHiddenSections] = useState([]);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [floatingToolbar, setFloatingToolbar] = useState(null);
    const [activeTextarea, setActiveTextarea] = useState(null);
    
    const [personalInfo, setPersonalInfo] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        linkedin: '', 
        location: '' 
    });
    const [summary, setSummary] = useState('');
    const [roles, setRoles] = useState([]);
    const [skills, setSkills] = useState([]);
    const [education, setEducation] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [projects, setProjects] = useState([]);
    const [publications, setPublications] = useState([]);
    const [customSections, setCustomSections] = useState([]);
    const [jdFeatures, setJdFeatures] = useState(null);
    const [liveScores, setLiveScores] = useState({
        fit_score: 0,
        fit_label: 'Calculating...',
        bloom_gap: { candidate: 0, jd_required: 0, meets: false, delta: 0 },
        ats_score: 0,
        semantic_position: 0,
        semantic_label: 'Perfectly positioned',
        credibility_score: 0,
        verb_strength: 0,
        metric_strength: 0,
        buzzword_count: 0,
        riasec_code: ''
    });
    const [stateHistory, setStateHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const stateRef = useRef({});
    const debounceTimer = useRef(null);
    const autosaveTimer = useRef(null);
    const fileInputRef = useRef(null);
    const saveDraftRef = useRef(null);
    const handleExportClickRef = useRef(null);
    const summaryVersionsRef = useRef({ original: '', veritas: '', hiddenBrief: '' });
    const isInitialAILoadRef = useRef(false);
    
    const safePersonalInfo = {
        name: personalInfo?.name || '',
        email: personalInfo?.email || '',
        phone: personalInfo?.phone || '',
        linkedin: personalInfo?.linkedin || '',
        location: personalInfo?.location || ''
    };
    
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };
    
// ============================================================
// FIX #7: Manual State Save (No automatic saves)
// ============================================================

// Save function - only called manually
const saveEditorStateImmediate = useCallback(() => {
    const stateToSave = {
        roles,
        summary,
        skills,
        personalInfo: safePersonalInfo,
        education,
        certifications,
        projects,
        publications,
        customSections,
        selectedTemplate,
        targetTitle,
        sectionOrder,
        hiddenSections,
        summaryVersion,
        summaryVersions: summaryVersionsRef.current,
        skillsSeparator,
        skillsColumns,
        timestamp: Date.now()
    };
    localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(stateToSave));
    console.log('💾 Editor state saved to localStorage (manual)');
}, [roles, summary, skills, safePersonalInfo, education, certifications, projects, publications, 
    customSections, selectedTemplate, targetTitle, sectionOrder, hiddenSections, summaryVersion, 
    skillsSeparator, skillsColumns]);

// Save on unmount only
useEffect(() => {
    return () => {
        saveEditorStateImmediate();
        console.log('💾 Editor state saved on unmount');
    };
}, [saveEditorStateImmediate]);

// Save on page hide (user navigates away)
useEffect(() => {
    const handlePageHide = () => {
        saveEditorStateImmediate();
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
}, [saveEditorStateImmediate]);

// Save when user clicks the "Save Draft" button (already exists in saveDraft)
// No automatic saves on state changes - user controls when to save
    
    // Trigger debounced save when relevant state changes
    useEffect(() => {
        if (hasUnsavedChanges) {
            debouncedSaveEditorState();
        }
    }, [roles, summary, skills, safePersonalInfo, education, certifications, projects, publications, 
        customSections, targetTitle, sectionOrder, hiddenSections, skillsSeparator, skillsColumns, 
        hasUnsavedChanges, debouncedSaveEditorState]);
    
    // Load saved state on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(EDITOR_STATE_KEY);
            if (!saved) return;
            
            const state = JSON.parse(saved);
            if (state.roles) setRoles(state.roles);
            if (state.summary !== undefined) setSummary(state.summary);
            if (state.skills) setSkills(state.skills);
            if (state.personalInfo) setPersonalInfo(state.personalInfo);
            if (state.education) setEducation(state.education);
            if (state.certifications) setCertifications(state.certifications);
            if (state.projects) setProjects(state.projects);
            if (state.publications) setPublications(state.publications);
            if (state.customSections) setCustomSections(state.customSections);
            if (state.selectedTemplate) setSelectedTemplate(state.selectedTemplate);
            if (state.targetTitle !== undefined) setTargetTitle(state.targetTitle);
            if (state.sectionOrder) setSectionOrder(state.sectionOrder);
            if (state.hiddenSections) setHiddenSections(state.hiddenSections);
            if (state.summaryVersion) setSummaryVersion(state.summaryVersion);
            if (state.summaryVersions) summaryVersionsRef.current = state.summaryVersions;
            if (state.skillsSeparator) setSkillsSeparator(state.skillsSeparator);
            if (state.skillsColumns) setSkillsColumns(state.skillsColumns);
            
            setHasUnsavedChanges(true);
            showToast('Loaded previous session', 'success');
        } catch (err) {
            console.warn('Failed to load editor state:', err);
        }
    }, [showToast]);
    
    // Update state ref
    useEffect(() => {
        stateRef.current = {
            roles: JSON.parse(JSON.stringify(roles || [])),
            summary: summary || '',
            skills: [...(skills || [])],
            personalInfo: { ...safePersonalInfo },
            education: JSON.parse(JSON.stringify(education || [])),
            certifications: [...(certifications || [])],
            projects: JSON.parse(JSON.stringify(projects || [])),
            publications: [...(publications || [])],
            customSections: JSON.parse(JSON.stringify(customSections || [])),
            targetTitle: targetTitle || ''
        };
    }, [roles, summary, skills, safePersonalInfo, education, certifications, projects, publications, customSections, targetTitle]);

    // Undo/Redo
    const saveSnapshot = useCallback(() => {
        const snapshot = JSON.parse(JSON.stringify(stateRef.current));
        setStateHistory(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
        setHistoryIndex(prev => prev + 1);
        setHasUnsavedChanges(true);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const snapshot = stateHistory[historyIndex - 1];
            setRoles(snapshot.roles || []);
            setSummary(snapshot.summary || '');
            setSkills(snapshot.skills || []);
            setPersonalInfo(snapshot.personalInfo || { name: '', email: '', phone: '', linkedin: '', location: '' });
            setEducation(snapshot.education || []);
            setCertifications(snapshot.certifications || []);
            setProjects(snapshot.projects || []);
            setPublications(snapshot.publications || []);
            setCustomSections(snapshot.customSections || []);
            setTargetTitle(snapshot.targetTitle || '');
            setHistoryIndex(prev => prev - 1);
            setHasUnsavedChanges(true);
            showToast('Undo successful', 'success');
        }
    }, [historyIndex, stateHistory]);

    const redo = useCallback(() => {
        if (historyIndex < stateHistory.length - 1) {
            const snapshot = stateHistory[historyIndex + 1];
            setRoles(snapshot.roles || []);
            setSummary(snapshot.summary || '');
            setSkills(snapshot.skills || []);
            setPersonalInfo(snapshot.personalInfo || { name: '', email: '', phone: '', linkedin: '', location: '' });
            setEducation(snapshot.education || []);
            setCertifications(snapshot.certifications || []);
            setProjects(snapshot.projects || []);
            setPublications(snapshot.publications || []);
            setCustomSections(snapshot.customSections || []);
            setTargetTitle(snapshot.targetTitle || '');
            setHistoryIndex(prev => prev + 1);
            setHasUnsavedChanges(true);
            showToast('Redo successful', 'success');
        }
    }, [historyIndex, stateHistory]);

    // Autosave (separate from editor state - for draft recovery)
    useEffect(() => {
        if (autosaveTimer.current) clearInterval(autosaveTimer.current);
        autosaveTimer.current = setInterval(() => {
            if (hasUnsavedChanges && roles && roles.length > 0) {
                try {
                    const draft = {
                        roles, summary, skills, personalInfo: safePersonalInfo, education, certifications,
                        projects, publications, customSections, selectedTemplate, targetTitle,
                        sectionOrder, timestamp: Date.now()
                    };
                    localStorage.setItem('veritas_resume_autosave', JSON.stringify(draft));
                    console.log('💾 Autosaved draft');
                } catch (e) {
                    console.warn('Autosave failed:', e);
                }
            }
        }, 30000);
        return () => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); };
    }, [roles, summary, skills, safePersonalInfo, education, certifications, projects, publications, customSections, selectedTemplate, targetTitle, sectionOrder, hasUnsavedChanges]);

    // beforeunload event
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Auto-collapse right sidebar in preview mode
    useEffect(() => {
        if (previewMode && showRightSidebar) setShowRightSidebar(false);
    }, [previewMode]);

    // Load saved sidebar states
    useEffect(() => {
        const savedLeft = localStorage.getItem('veritas_left_sidebar_open');
        if (savedLeft !== null) setIsLeftSidebarOpen(savedLeft === 'true');
        const savedRight = localStorage.getItem('veritas_right_sidebar_open');
        if (savedRight !== null) setShowRightSidebar(savedRight === 'true');
    }, []);

    const toggleLeftSidebar = () => {
        const newState = !isLeftSidebarOpen;
        setIsLeftSidebarOpen(newState);
        localStorage.setItem('veritas_left_sidebar_open', newState);
    };
    
    const toggleRightSidebar = () => {
        const newState = !showRightSidebar;
        setShowRightSidebar(newState);
        localStorage.setItem('veritas_right_sidebar_open', newState);
    };

    // Keyboard shortcuts with refs
    const saveDraftFn = useCallback(() => {
        try {
            const draft = {
                roles, summary, skills, personalInfo: safePersonalInfo, education, certifications,
                projects, publications, customSections, selectedTemplate, targetTitle,
                sectionOrder, timestamp: Date.now()
            };
            localStorage.setItem('veritas_resume_draft', JSON.stringify(draft));
            setHasUnsavedChanges(false);
            showToast('Draft saved!', 'success');
        } catch (e) {
            console.warn('Save draft failed:', e);
            showToast('Failed to save draft', 'error');
        }
    }, [roles, summary, skills, safePersonalInfo, education, certifications, projects, publications, customSections, selectedTemplate, targetTitle, sectionOrder]);
    
    const handleExportClickFn = useCallback(() => setShowExportChecklist(true), []);
    
    saveDraftRef.current = saveDraftFn;
    handleExportClickRef.current = handleExportClickFn;
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveDraftRef.current();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                handleExportClickRef.current();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // PDF Extraction
    const extractPDFText = useCallback(async (file) => {
        console.log('📄 Starting PDF extraction...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log(`📄 PDF loaded: ${pdf.numPages} page(s)`);
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
                console.log(`📄 Page ${i} extracted: ${pageText.length} chars`);
            }
            return { success: true, text: fullText, pages: pdf.numPages };
        } catch (error) {
            console.error('PDF extraction error:', error);
            return { success: false, error: error.message, text: '' };
        }
    }, []);

    const handlePDFUpload = useCallback(async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setPdfExtractionError('Please upload a valid PDF file');
            return;
        }
        setIsExtractingPDF(true);
        setPdfExtractionError(null);
        try {
            const result = await extractPDFText(file);
            if (result.success && result.text.length > 100 && setResumeText) {
                setResumeText(result.text);
                showToast(`✅ PDF extracted: ${result.pages} pages, ${result.text.length} characters`, 'success');
            } else {
                setPdfExtractionError(result.error || 'Failed to extract text from PDF');
            }
        } catch (error) {
            setPdfExtractionError(error.message);
        } finally {
            setIsExtractingPDF(false);
        }
    }, [extractPDFText, setResumeText]);

    // ============================================================
    // AI Parser as Primary (auto-run on mount)
    // ============================================================
    const runAIParser = async (showComparison = false) => {
        if (!resumeText || resumeText.trim().length < 100) {
            showToast('Please provide valid resume text (minimum 100 characters)', 'error');
            return false;
        }
        
        setIsAIParsing(true);
        setAiParseFailed(false);
        
        try {
            const response = await fetch('https://ats-stage-2-parser.keron62.workers.dev/parse/full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText })
            });
            const data = await response.json();
            
            if (!data.success) throw new Error(data.error || 'AI parsing failed');
            
            const aiRoles = (data.jobs || []).map((job, idx) => ({
                id: safeUUID(),
                title: job.title || 'Untitled Role',
                company: job.company || 'Unknown Company',
                startDate: job.startDate || '',
                endDate: job.endDate || '',
                bullets: (job.bullets || []).map((bulletText, bulletIdx) => ({
                    id: safeUUID(),
                    text: bulletText,
                    original: bulletText,
                    veritas: null,
                    hiddenBrief: null,
                    showAlternatives: false
                }))
            }));
            
            const aiSkills = data.skills || [];
            const aiEducation = (data.education || []).map((edu, idx) => ({
                id: safeUUID(),
                degree: edu.degree || edu.text || '',
                institution: edu.institution || '',
                year: edu.year || '',
                location: edu.location || ''
            }));
            const aiProjects = (data.projects || []).map((project, idx) => ({
                id: safeUUID(),
                name: project.name || 'Untitled Project',
                bullets: project.bullets || [],
                technologies: project.technologies || [],
                link: project.link || ''
            }));
            const aiCertifications = (data.certifications || []).map((cert, idx) => {
                if (typeof cert === 'string') return cert;
                return `${cert.name || ''}${cert.issuer ? ` (${cert.issuer})` : ''}${cert.year ? ` - ${cert.year}` : ''}`;
            });
            const aiPublications = (data.publications || []).map((pub, idx) => {
                if (typeof pub === 'string') return pub;
                let citation = pub.title || '';
                if (pub.authors) citation = `${pub.authors}. ${citation}`;
                if (pub.journal) citation += ` ${pub.journal}`;
                if (pub.year) citation += ` (${pub.year})`;
                return citation;
            });
            const aiHeader = data.header || {};
            const aiSummary = data.summary || '';
            
            const aiData = {
                roles: aiRoles,
                skills: aiSkills,
                education: aiEducation,
                projects: aiProjects,
                certifications: aiCertifications,
                publications: aiPublications,
                header: aiHeader,
                summary: aiSummary
            };
            
            if (showComparison) {
                setAiParsedData(aiData);
                setShowAIParseComparison(true);
                return true;
            } else {
                setRoles(aiRoles || []);
                setSkills(aiSkills || []);
                setEducation(aiEducation || []);
                setProjects(aiProjects || []);
                setCertifications(aiCertifications || []);
                setPublications(aiPublications || []);
                if (aiHeader?.name) setPersonalInfo(prev => ({ 
                    ...prev, 
                    name: aiHeader.name || prev.name, 
                    email: aiHeader.email || prev.email, 
                    phone: aiHeader.phone || prev.phone, 
                    linkedin: aiHeader.linkedin || prev.linkedin, 
                    location: aiHeader.location || prev.location 
                }));
                if (aiSummary) setSummary(aiSummary);
                saveSnapshot();
                showToast('AI parser completed successfully!', 'success');
                return true;
            }
            
        } catch (error) {
            console.error('AI Parser error:', error);
            setAiParseFailed(true);
            showToast(`AI parsing failed: ${error.message}. Using fallback parser.`, 'error');
            return false;
        } finally {
            setIsAIParsing(false);
        }
    };

    // Auto-run AI parser on initial load (only once if no saved state)
    useEffect(() => {
        const hasSavedState = localStorage.getItem(EDITOR_STATE_KEY);
        if (resumeText && resumeText.trim().length > 100 && !isInitialAILoadRef.current && !isAIParsing && roles.length === 0 && !hasSavedState) {
            isInitialAILoadRef.current = true;
            runAIParser(false);
        }
    }, [resumeText]);

    // Fallback deterministic parser (used when AI fails or user has no resume)
    const loadDeterministicFallback = useCallback(() => {
        if (!resumeText) return;
        console.log('🔍 Using deterministic fallback parser');
        const parsed = parseResume(resumeText);
        
        const parsedRoles = (parsed.jobs || []).map((job, jobIndex) => ({
            id: safeUUID(),
            title: job.title || 'Untitled Role',
            company: job.company || 'Unknown Company',
            startDate: job.dates ? job.dates.split(' - ')[0] || '' : '',
            endDate: job.dates ? job.dates.split(' - ')[1] || '' : '',
            bullets: (job.bullets || []).map((bulletText, bulletIndex) => ({
                id: safeUUID(),
                text: bulletText,
                original: bulletText,
                veritas: null,
                hiddenBrief: null,
                showAlternatives: false
            }))
        }));
        
        setRoles(parsedRoles);
        setSkills(parsed.skills || []);
        setEducation((parsed.education || []).map((edu, idx) => ({
            id: safeUUID(),
            degree: edu.text || '',
            institution: '',
            year: edu.year || ''
        })));
        setProjects(parsed.projects || []);
        setCertifications(parsed.certifications || []);
        setPublications(parsed.publications || []);
        
        const extracted = extractPersonalInfo(resumeText || '');
        if (extracted?.location && !extracted.location.includes('Google') && !extracted.location.includes('Collab')) {
            setPersonalInfo({
                name: extracted.name || '',
                email: extracted.email || '',
                phone: extracted.phone || '',
                linkedin: extracted.linkedin || '',
                location: extracted.location || ''
            });
        }
        
        if (summaryAnalysis && summaryVersionsRef.current.original === '') {
            const originalText = summaryAnalysis.original_text || '';
            setSummary(originalText);
            summaryVersionsRef.current = {
                original: originalText,
                veritas: summaryAnalysis.veritas_transformed_summary || '',
                hiddenBrief: summaryAnalysis.hb_transformed_summary || ''
            };
        }
        
        saveSnapshot();
    }, [resumeText, summaryAnalysis]);

    // ENRICH with Veritas and Hidden Brief versions
    useEffect(() => {
        if (bulletAnalysis?.bullets && bulletAnalysis.bullets.length > 0 && roles && roles.length > 0) {
            console.log('🔍 Enriching with LLM transformations for', bulletAnalysis.bullets.length, 'bullets');
            
            setRoles(prevRoles => {
                const updatedRoles = JSON.parse(JSON.stringify(prevRoles || []));
                let matchedCount = 0;
                
                for (const transformed of bulletAnalysis.bullets) {
                    let matched = false;
                    
                    for (const role of updatedRoles) {
                        const bulletIndex = role?.bullets?.findIndex(b => 
                            b?.id === transformed.id || 
                            b?.id === transformed.sequentialId ||
                            b?.original === transformed.original_text
                        );
                        if (bulletIndex !== undefined && bulletIndex !== -1 && role?.bullets) {
                            role.bullets[bulletIndex].veritas = transformed.transformed_text;
                            role.bullets[bulletIndex].hiddenBrief = transformed.hb_transformed_text;
                            matched = true;
                            matchedCount++;
                            break;
                        }
                    }
                    
                    if (!matched && transformed.original_text) {
                        for (const role of updatedRoles) {
                            const bulletIndex = role?.bullets?.findIndex(b => 
                                b?.original && (
                                    b.original === transformed.original_text ||
                                    b.original.includes(transformed.original_text.substring(0, 50)) ||
                                    transformed.original_text.includes(b.original.substring(0, 50))
                                )
                            );
                            if (bulletIndex !== undefined && bulletIndex !== -1 && role?.bullets) {
                                role.bullets[bulletIndex].veritas = transformed.transformed_text;
                                role.bullets[bulletIndex].hiddenBrief = transformed.hb_transformed_text;
                                matched = true;
                                matchedCount++;
                                break;
                            }
                        }
                    }
                }
                
                console.log('🔍 Matched', matchedCount, 'of', bulletAnalysis.bullets.length, 'LLM bullets to originals');
                return updatedRoles;
            });
        }
    }, [bulletAnalysis, roles?.length]);

    // Summary versions from LLM
    useEffect(() => {
        if (summaryAnalysis && summaryVersionsRef.current.original === '') {
            const originalText = summaryAnalysis.original_text || '';
            const veritasText = summaryAnalysis.veritas_transformed_summary || '';
            const hbText = summaryAnalysis.hb_transformed_summary || '';
            
            console.log('📄 Loading summary versions:', {
                hasOriginal: !!originalText,
                hasVeritas: !!veritasText,
                hasHiddenBrief: !!hbText
            });
            
            setSummary(originalText);
            summaryVersionsRef.current = {
                original: originalText,
                veritas: veritasText,
                hiddenBrief: hbText
            };
            
            if (veritasText || hbText) {
                console.log('✅ Alternative summary versions available');
            }
        }
    }, [summaryAnalysis]);

    // Summary version switching handler
    const switchSummaryVersion = (version) => {
        const versions = summaryVersionsRef.current;
        let newSummary = '';
        
        if (version === 'original') {
            newSummary = versions.original || '';
        } else if (version === 'veritas') {
            newSummary = versions.veritas || '';
        } else if (version === 'hiddenBrief') {
            newSummary = versions.hiddenBrief || '';
        }
        
        if (newSummary) {
            setSummary(newSummary);
            setSummaryVersion(version);
            saveSnapshot();
            showToast(`Switched to ${version} summary version`, 'info');
        } else {
            showToast(`${version} version not available`, 'warning');
        }
    };

    // JD Features
    useEffect(() => {
        if (jdText) setJdFeatures(extractJDFeatures(jdText));
    }, [jdText]);

    // Build resume text for scoring
    const buildResumeText = useCallback(() => {
        let text = '';
        if (safePersonalInfo.name) text += `${safePersonalInfo.name}\n`;
        if (safePersonalInfo.email || safePersonalInfo.phone) text += `${safePersonalInfo.email || ''} | ${safePersonalInfo.phone || ''}\n`;
        text += '\n';
        if (targetTitle) text += `${targetTitle}\n\n`;
        if (summary) text += `${summary}\n\n`;
        for (const role of (roles || [])) {
            if (role?.title && role?.company) text += `${role.title} @ ${role.company}\n`;
            else if (role?.title) text += `${role.title}\n`;
            for (const bullet of (role?.bullets || [])) {
                if (bullet?.text) text += `• ${bullet.text}\n`;
            }
            text += '\n';
        }
        if (skills?.length) text += `Skills: ${skills.join(', ')}\n`;
        if (education?.length) text += `Education: ${education.map(e => e?.degree || '').join(', ')}\n`;
        if (certifications?.length) text += `Certifications: ${certifications.join(', ')}\n`;
        if (projects?.length) text += `Projects: ${projects.map(p => p?.name || '').join(', ')}\n`;
        if (publications?.length) text += `Publications: ${publications.join(', ')}\n`;
        return text;
    }, [safePersonalInfo, targetTitle, summary, roles, skills, education, certifications, projects, publications]);

    // Bullet Functions
    const updateBullet = (roleId, bulletId, newText) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: role.bullets.map(b => b.id === bulletId ? { ...b, text: newText } : b)
            } : role
        ));
    };
    
    const applyVeritasVersion = (roleId, bulletId) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: role.bullets.map(b => b.id === bulletId && b.veritas ? { ...b, text: b.veritas } : b)
            } : role
        ));
        saveSnapshot();
        showToast('Applied Veritas version', 'success');
    };
    
    const applyHBVersion = (roleId, bulletId) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: role.bullets.map(b => b.id === bulletId && b.hiddenBrief ? { ...b, text: b.hiddenBrief } : b)
            } : role
        ));
        saveSnapshot();
        showToast('Applied Hidden Brief version', 'success');
    };
    
    const resetBullet = (roleId, bulletId) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: role.bullets.map(b => b.id === bulletId && b.original ? { ...b, text: b.original } : b)
            } : role
        ));
        saveSnapshot();
        showToast('Reset to original', 'info');
    };
    
    const addBullet = (roleId) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: [...role.bullets, {
                    id: safeUUID(),
                    text: '',
                    original: '',
                    veritas: null,
                    hiddenBrief: null,
                    showAlternatives: false
                }]
            } : role
        ));
        saveSnapshot();
    };
    
    const deleteBullet = (roleId, bulletId) => {
        setRoles(prev => prev.map(role =>
            role.id === roleId ? {
                ...role,
                bullets: role.bullets.filter(b => b.id !== bulletId)
            } : role
        ));
        saveSnapshot();
    };
    
    const updateRoleTitle = (roleId, newTitle) => {
        setRoles(prev => prev.map(role => role.id === roleId ? { ...role, title: newTitle } : role));
    };
    
    const updateRoleCompany = (roleId, newCompany) => {
        setRoles(prev => prev.map(role => role.id === roleId ? { ...role, company: newCompany } : role));
    };
    
    const updateRoleDates = (roleId, startDate, endDate) => {
        setRoles(prev => prev.map(role => role.id === roleId ? { ...role, startDate, endDate } : role));
    };
    
    const addRole = () => {
        setRoles(prev => [...prev, {
            id: safeUUID(),
            title: 'New Role',
            company: 'Company Name',
            startDate: '',
            endDate: '',
            bullets: []
        }]);
        saveSnapshot();
        showToast('Added new role', 'success');
    };
    
    const deleteRole = (roleId) => {
        setRoles(prev => prev.filter(role => role.id !== roleId));
        saveSnapshot();
        showToast('Role deleted', 'info');
    };
    
    const moveRole = (roleId, direction) => {
        setRoles(prev => {
            const idx = prev.findIndex(r => r.id === roleId);
            if (idx === -1) return prev;
            if (direction === 'up' && idx === 0) return prev;
            if (direction === 'down' && idx === prev.length - 1) return prev;
            const newRoles = [...prev];
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            [newRoles[idx], newRoles[swapIdx]] = [newRoles[swapIdx], newRoles[idx]];
            return newRoles;
        });
        saveSnapshot();
    };
    
    const addSkill = (skill) => {
        if (skill && !skills.includes(skill)) {
            setSkills(prev => [...prev, skill]);
            saveSnapshot();
            showToast(`Added skill: ${skill}`, 'success');
        }
    };
    
    const removeSkill = (skillToRemove) => {
        setSkills(prev => prev.filter(s => s !== skillToRemove));
        saveSnapshot();
    };
    
    const addEducation = () => {
        setEducation(prev => [...prev, {
            id: safeUUID(),
            degree: '',
            institution: '',
            year: ''
        }]);
        saveSnapshot();
    };
    
    const updateEducation = (id, field, value) => {
        setEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
    };
    
    const deleteEducation = (id) => {
        setEducation(prev => prev.filter(edu => edu.id !== id));
        saveSnapshot();
    };
    
    const updateCertification = (index, value) => {
        setCertifications(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };
    
    const addCertification = () => {
        setCertifications(prev => [...prev, '']);
        saveSnapshot();
    };
    
    const deleteCertification = (index) => {
        setCertifications(prev => prev.filter((_, i) => i !== index));
        saveSnapshot();
    };
    
    const addCustomSection = (name, type, position) => {
        const newSection = {
            id: safeUUID(),
            name,
            type,
            content: type === 'bulleted' ? [] : ''
        };
        setCustomSections(prev => {
            const newSections = [...prev];
            if (position === 'top') {
                newSections.unshift(newSection);
            } else if (position === 'after-summary') {
                newSections.splice(1, 0, newSection);
            } else if (position === 'after-experience') {
                const insertIndex = 1 + (summary ? 1 : 0) + (roles?.length || 0);
                newSections.splice(insertIndex, 0, newSection);
            } else {
                newSections.push(newSection);
            }
            return newSections;
        });
        saveSnapshot();
        showToast(`Added section: ${name}`, 'success');
    };
    
    const updateCustomSection = (id, field, value) => {
        setCustomSections(prev => prev.map(section => 
            section.id === id ? { ...section, [field]: value } : section
        ));
        saveSnapshot();
    };
    
    const deleteCustomSection = (id) => {
        setCustomSections(prev => prev.filter(section => section.id !== id));
        saveSnapshot();
        showToast('Section deleted', 'info');
    };
    
    const updateSummary = (newText) => {
        setSummary(newText);
    };
    
    const updatePersonalInfo = (field, value) => {
        setPersonalInfo(prev => ({ ...prev, [field]: value }));
    };
    
    // Floating toolbar for text formatting
    const handleTextSelection = (e, textareaId) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();
        
        if (selectedText && selectedText.length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setFloatingToolbar({
                top: rect.top,
                left: rect.left + (rect.width / 2) - 50,
                textareaId
            });
            setActiveTextarea(textareaId);
        } else {
            setFloatingToolbar(null);
            setActiveTextarea(null);
        }
    };
    
    const applyFormatting = (formatType) => {
        if (!activeTextarea) return;
        
        const textarea = document.getElementById(activeTextarea);
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (!selectedText) return;
        
        let formattedText = '';
        if (formatType === 'bold') formattedText = `**${selectedText}**`;
        else if (formatType === 'italic') formattedText = `*${selectedText}*`;
        else if (formatType === 'underline') formattedText = `__${selectedText}__`;
        
        const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        
        if (activeTextarea.startsWith('summary')) {
            setSummary(newValue);
        } else if (activeTextarea.startsWith('target')) {
            setTargetTitle(newValue);
        } else if (activeTextarea.startsWith('bullet')) {
            const [_, roleId, bulletId] = activeTextarea.split('_');
            updateBullet(roleId, bulletId, newValue);
        }
        
        setFloatingToolbar(null);
        setActiveTextarea(null);
    };
    
    // Live scoring
    const updateLiveScores = useCallback(() => {
        if (!roles?.length && !summary) return;
        const fullResumeText = buildResumeText();
        const candidateSeniority = detectSeniorityFromText(fullResumeText);
        const candidateYears = candidateSeniority.years_detected || 0;
        const candidateLevelNum = { entry: 1, mid: 2, senior: 3, executive: 4 }[candidateSeniority.level] || 2;
        const keywordMatchRate = jdFeatures ? calculateKeywordMatchRate(fullResumeText, jdFeatures.critical_keywords) : 0;
        const atsResult = calculateATSScore(fullResumeText, jdText, { keywordMatchRate, skillsCount: skills?.length || 0 });
        let fitResult = { score: 50, label: 'Moderate' };
        if (jdFeatures) {
            const levelGap = candidateLevelNum - (jdFeatures.seniority_level_num || 2);
            const yearsGap = candidateYears - (jdFeatures.years_required || 3);
            fitResult = calculateFitScore({ keywordMatchRate, levelGap, yearsGap, matchingCertifications: 0, skillsMatchRate: 50 });
        }
        let candidateBloomLevel = 3.5, bloomDelta = 0, bloomMeetsExpectation = true;
        if (roles?.length > 0) {
            const bulletTexts = roles.flatMap(r => r?.bullets?.map(b => b?.text || '') || []);
            if (bulletTexts.length) {
                const bloomAnalysis = analyzeBulletBloom(bulletTexts);
                candidateBloomLevel = bloomAnalysis.averageLevel;
            }
        }
        if (jdFeatures) {
            bloomDelta = candidateBloomLevel - (jdFeatures.jd_bloom_level || 3.5);
            bloomMeetsExpectation = bloomDelta >= -0.3;
        }
        const semanticResult = calculateSemanticPosition(fullResumeText, candidateYears);
        const credibilityResult = calculateCredibilityScore(fullResumeText, { titles: roles?.map(r => ({ title: r?.title || '' })) || [] });
        const verbAnalysis = analyzeVerbs(fullResumeText);
        const metricStrength = calculateMetricStrength(fullResumeText);
        const buzzwords = detectBuzzwords(fullResumeText);
        const riasecResult = calculateRIASECDeterministic(fullResumeText, null, false);
        setLiveScores({
            fit_score: fitResult.score,
            fit_label: fitResult.label,
            bloom_gap: {
                candidate: Math.round(candidateBloomLevel * 10) / 10,
                jd_required: jdFeatures?.jd_bloom_level || 3.5,
                meets: bloomMeetsExpectation,
                delta: Math.round(bloomDelta * 10) / 10
            },
            ats_score: atsResult.total,
            semantic_position: semanticResult.position_score,
            semantic_label: semanticResult.position_label,
            credibility_score: credibilityResult.score,
            verb_strength: Math.round(verbAnalysis.averageStrength * 10),
            metric_strength: metricStrength,
            buzzword_count: buzzwords.total,
            riasec_code: riasecResult.candidate_codes || 'N/A'
        });
    }, [roles, summary, skills, jdFeatures, jdText, buildResumeText]);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => updateLiveScores(), 500);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [roles, summary, skills, safePersonalInfo, targetTitle, updateLiveScores]);

    // Export
    const getExportChecklist = () => {
        const hasName = !!(safePersonalInfo.name?.trim());
        const hasEmail = !!(safePersonalInfo.email?.trim() && safePersonalInfo.email.includes('@'));
        const hasPhone = !!(safePersonalInfo.phone?.trim());
        const hasLinkedIn = !!(safePersonalInfo.linkedin?.trim());
        const hasExperience = roles?.some(r => r?.bullets?.length > 0);
        const hasEducation = education?.length > 0 && education.some(e => e?.degree?.trim());
        const hasSkills = skills?.length > 0;
        return {
            critical: [
                { label: 'Full Name', met: hasName },
                { label: 'Email Address', met: hasEmail },
                { label: 'Phone Number', met: hasPhone },
                { label: 'LinkedIn URL', met: hasLinkedIn },
                { label: 'Experience Section (at least 1 bullet)', met: hasExperience },
                { label: 'Education Section', met: hasEducation },
                { label: 'Skills Section (at least 3 skills)', met: (skills?.length || 0) >= 3 }
            ],
            recommended: [
                { label: 'Professional Summary', met: !!summary?.trim() },
                { label: 'Target Title', met: !!targetTitle?.trim() },
                { label: 'Certifications (if applicable)', met: certifications?.length > 0 },
                { label: 'Projects (if applicable)', met: projects?.length > 0 }
            ]
        };
    };
    
    const handleExportConfirm = async () => {
        setShowExportChecklist(false);
        setIsGeneratingPDF(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <ResumePDF
                    personalInfo={safePersonalInfo}
                    targetTitle={targetTitle}
                    summary={summary}
                    roles={roles || []}
                    skills={skills || []}
                    education={education || []}
                    certifications={certifications || []}
                    projects={projects || []}
                    publications={publications || []}
                    selectedTemplate={selectedTemplate}
                    customSections={customSections || []}
                    dateFormat={dateFormat}
                    formatDate={formatDate}
                    skillsSeparator={skillsSeparator}
                    skillsColumns={skillsColumns}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `veritas-resume-${Date.now()}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
            showToast('PDF exported successfully!', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Failed to generate PDF. Please try again.', 'error');
        } finally {
            setIsGeneratingPDF(false);
        }
    };
    
    const saveDraft = () => {
        try {
            const draft = {
                roles, summary, skills, personalInfo: safePersonalInfo, education, certifications,
                projects, publications, customSections, selectedTemplate, targetTitle,
                sectionOrder, timestamp: Date.now()
            };
            localStorage.setItem('veritas_resume_draft', JSON.stringify(draft));
            setHasUnsavedChanges(false);
            showToast('Draft saved!', 'success');
        } catch (e) {
            console.warn('Save draft failed:', e);
            showToast('Failed to save draft', 'error');
        }
    };
    
    const loadDraft = () => {
        try {
            const draftJson = localStorage.getItem('veritas_resume_draft');
            if (!draftJson) { showToast('No saved draft found', 'info'); return; }
            const draft = JSON.parse(draftJson);
            if (!Array.isArray(draft.roles)) throw new Error('Invalid draft structure');
            setRoles(draft.roles || []);
            setSummary(draft.summary || '');
            setSkills(Array.isArray(draft.skills) ? draft.skills : []);
            setPersonalInfo(draft.personalInfo || { name: '', email: '', phone: '', linkedin: '', location: '' });
            setEducation(Array.isArray(draft.education) ? draft.education : []);
            setCertifications(Array.isArray(draft.certifications) ? draft.certifications : []);
            setProjects(Array.isArray(draft.projects) ? draft.projects : []);
            setPublications(Array.isArray(draft.publications) ? draft.publications : []);
            setCustomSections(Array.isArray(draft.customSections) ? draft.customSections : []);
            setSelectedTemplate(draft.selectedTemplate || 'veritas_signature');
            setTargetTitle(draft.targetTitle || '');
            if (draft.sectionOrder) setSectionOrder(draft.sectionOrder);
            saveSnapshot();
            setHasUnsavedChanges(false);
            showToast('Draft loaded!', 'success');
        } catch (err) {
            console.error('Failed to load draft:', err);
            showToast('Failed to load draft. The saved data may be corrupted.', 'error');
            localStorage.removeItem('veritas_resume_draft');
        }
    };
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    
    const getBloomColor = (delta) => {
        if (delta >= 0) return '#10b981';
        if (delta >= -0.5) return '#f59e0b';
        return '#ef4444';
    };
    
    const currentTemplate = TEMPLATES[selectedTemplate];
    const exportChecklist = getExportChecklist();
    
    // Helper to render sections in order (filtering hidden sections)
    const renderVisibleSections = () => {
        const visibleOrder = sectionOrder.filter(s => !hiddenSections.includes(s));
        return visibleOrder.map(sectionId => renderSection(sectionId));
    };
    
    // Helper to render a single section
    const renderSection = (sectionId) => {
        switch (sectionId) {
            case 'target-title':
                return (
                    <div key="target-title" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', padding: '20px' }}>
                        <h3 style={{ fontSize: '13px', marginBottom: '16px', color: '#c9a84c' }}>🎯 Target Title</h3>
                        <input
                            id="target-title-input"
                            type="text"
                            value={targetTitle}
                            onChange={(e) => setTargetTitle(e.target.value)}
                            onBlur={saveSnapshot}
                            onMouseUp={(e) => handleTextSelection(e, 'target-title-input')}
                            disabled={!editMode}
                            placeholder="e.g., Results-driven Project Operations Lead | 5+ Years in Public Health"
                            maxLength={250}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }}
                        />
                        <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'right', marginTop: '4px' }}>
                            {targetTitle.length}/250 characters
                        </div>
                    </div>
                );
            case 'summary':
                return (
                    <div key="summary" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8f7f4', borderBottom: '1px solid #e6e4dd' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>📄 Professional Summary</h3>
                            {(summaryVersionsRef.current.veritas || summaryVersionsRef.current.hiddenBrief) && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => switchSummaryVersion('original')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'original' ? '#10b981' : 'transparent', color: summaryVersion === 'original' ? 'white' : '#6b7280', cursor: 'pointer' }}>📄 Original</button>
                                    {summaryVersionsRef.current.veritas && <button onClick={() => switchSummaryVersion('veritas')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'veritas' ? '#2563eb' : 'transparent', color: summaryVersion === 'veritas' ? 'white' : '#6b7280', cursor: 'pointer' }}>✨ Veritas</button>}
                                    {summaryVersionsRef.current.hiddenBrief && <button onClick={() => switchSummaryVersion('hiddenBrief')} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '20px', border: '1px solid #e6e4dd', background: summaryVersion === 'hiddenBrief' ? '#c9a84c' : 'transparent', color: summaryVersion === 'hiddenBrief' ? '#1a1f2e' : '#6b7280', cursor: 'pointer' }}>🕵️ Hidden Brief</button>}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '20px' }}>
                            <textarea
                                id="summary-textarea"
                                value={summary}
                                onChange={(e) => updateSummary(e.target.value)}
                                onBlur={saveSnapshot}
                                onMouseUp={(e) => handleTextSelection(e, 'summary-textarea')}
                                disabled={!editMode}
                                rows={4}
                                style={{ width: '100%', padding: '12px', border: `1px solid ${summaryVersion === 'hiddenBrief' ? '#c9a84c' : summaryVersion === 'veritas' ? '#2563eb' : '#e6e4dd'}`, borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', resize: 'vertical', fontFamily: 'inherit' }}
                                placeholder="Professional summary goes here..."
                            />
                        </div>
                    </div>
                );
            case 'experience':
                return (
                    <div key="experience" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', background: '#f8f7f4', borderBottom: '1px solid #e6e4dd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>📝 Experience ({roles?.reduce((acc, r) => acc + (r?.bullets?.length || 0), 0) || 0} bullets)</h3>
                            {editMode && <button onClick={addRole} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Role</button>}
                        </div>
                        {roles && roles.map((role, roleIdx) => (
                            <div key={role.id} style={{ padding: '20px', borderBottom: roleIdx < roles.length - 1 ? '1px solid #e6e4dd' : 'none' }}>
                                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Job Title</label>
                                                <input type="text" value={role.title || ''} onChange={(e) => updateRoleTitle(role.id, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Company</label>
                                                <input type="text" value={role.company || ''} onChange={(e) => updateRoleCompany(role.id, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Start Date</label>
                                                <input type="text" placeholder="MM/YYYY" value={role.startDate || ''} onChange={(e) => updateRoleDates(role.id, e.target.value, role.endDate)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>End Date (or "Present")</label>
                                                <input type="text" placeholder="MM/YYYY or Present" value={role.endDate || ''} onChange={(e) => updateRoleDates(role.id, role.startDate, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                            </div>
                                            {editMode && (
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '18px' }}>
                                                    <button onClick={() => moveRole(role.id, 'up')} disabled={roleIdx === 0} style={{ padding: '4px 8px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '3px', cursor: roleIdx === 0 ? 'not-allowed' : 'pointer' }}>▲</button>
                                                    <button onClick={() => moveRole(role.id, 'down')} disabled={roleIdx === roles.length - 1} style={{ padding: '4px 8px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '3px', cursor: roleIdx === roles.length - 1 ? 'not-allowed' : 'pointer' }}>▼</button>
                                                    <button onClick={() => deleteRole(role.id)} style={{ padding: '4px 8px', fontSize: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>🗑️</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {role.bullets && role.bullets.map((bullet, bulletIdx) => (
                                    <div key={bullet.id} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid #e6e4dd' }}>
                                        <textarea
                                            id={`bullet_${role.id}_${bullet.id}`}
                                            value={bullet.text || ''}
                                            onChange={(e) => updateBullet(role.id, bullet.id, e.target.value)}
                                            onBlur={saveSnapshot}
                                            onMouseUp={(e) => handleTextSelection(e, `bullet_${role.id}_${bullet.id}`)}
                                            disabled={!editMode}
                                            rows={2}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #e6e4dd', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', resize: 'vertical', fontFamily: 'inherit' }}
                                            placeholder="Enter bullet point..."
                                        />
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            {(bullet.veritas || bullet.hiddenBrief) && (
                                                <button onClick={() => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, bullets: r.bullets.map(b => b.id === bullet.id ? { ...b, showAlternatives: !b.showAlternatives } : b) } : r))} style={{ fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}>
                                                    {bullet.showAlternatives ? '▼ Hide transformations' : '▶ Show alternative versions'}
                                                </button>
                                            )}
                                            {editMode && (
                                                <button onClick={() => deleteBullet(role.id, bullet.id)} style={{ fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}>
                                                    🗑️ Delete
                                                </button>
                                            )}
                                        </div>
                                        {bullet.showAlternatives && (
                                            <div style={{ marginTop: '8px', padding: '10px', background: '#f8f7f4', borderRadius: '6px' }}>
                                                {bullet.veritas && bullet.veritas !== bullet.text && (
                                                    <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(37,99,235,0.05)', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb', marginBottom: '4px' }}>✨ Veritas Version</div>
                                                        <div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.veritas}</div>
                                                        <button onClick={() => applyVeritasVersion(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button>
                                                    </div>
                                                )}
                                                {bullet.hiddenBrief && bullet.hiddenBrief !== bullet.text && (
                                                    <div style={{ padding: '8px', background: 'rgba(201,168,76,0.08)', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '4px' }}>🕵️ Hidden Brief Version</div>
                                                        <div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.hiddenBrief}</div>
                                                        <button onClick={() => applyHBVersion(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#c9a84c', color: '#1a1f2e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button>
                                                    </div>
                                                )}
                                                {bullet.original && bullet.original !== bullet.text && (
                                                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16,185,129,0.05)', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>📄 Original Version</div>
                                                        <div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.original}</div>
                                                        <button onClick={() => resetBullet(role.id, bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Restore Original</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {editMode && <button onClick={() => addBullet(role.id)} style={{ marginTop: '8px', fontSize: '11px', padding: '6px 12px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c' }}>+ Add Bullet</button>}
                            </div>
                        ))}
                        {editMode && (!roles || roles.length === 0) && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                No experience entries yet. Click "Add Role" to get started.
                            </div>
                        )}
                    </div>
                );
            case 'skills':
                return (
                    <div key="skills" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>⚙️ Skills ({skills?.length || 0})</h3>
                            <button onClick={() => setAdvancedSkills(!advancedSkills)} style={{ padding: '4px 10px', fontSize: '10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}>
                                {advancedSkills ? 'Switch to Simple View' : 'Advanced Mode'}
                            </button>
                        </div>
                        {advancedSkills ? (
                            <SkillsAdvancedEditor skills={skills || []} setSkills={setSkills} onSave={saveSnapshot} skillsSeparator={skillsSeparator} setSkillsSeparator={setSkillsSeparator} skillsColumns={skillsColumns} setSkillsColumns={setSkillsColumns} />
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {(skills || []).map((skill, idx) => (
                                        <span key={idx} style={{ padding: '6px 12px', background: 'rgba(201,168,76,0.1)', borderRadius: '20px', fontSize: '12px', color: '#c9a84c', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            {skill}
                                            {editMode && <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>×</button>}
                                        </span>
                                    ))}
                                </div>
                                {editMode && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" id="new-skill-input" placeholder="Add new skill..." onBlur={saveSnapshot} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '12px' }} onKeyPress={(e) => { if (e.key === 'Enter') { const input = e.target; const newSkill = input.value.trim(); if (newSkill && !skills.includes(newSkill)) { addSkill(newSkill); input.value = ''; } } }} />
                                        <button onClick={() => { const input = document.getElementById('new-skill-input'); const newSkill = input.value.trim(); if (newSkill && !skills.includes(newSkill)) { addSkill(newSkill); input.value = ''; } }} style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: 'pointer' }}>+ Add Skill</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            case 'projects':
                return (
                    <div key="projects" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>🚀 Projects</h3>
                            {editMode && <button onClick={() => setProjects(prev => [...(prev || []), { id: safeUUID(), name: 'New Project', bullets: [] }])} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Project</button>}
                        </div>
                        {(projects || []).map((project, idx) => (
                            <div key={project.id} style={{ marginBottom: '16px', padding: '12px', background: '#f8f7f4', borderRadius: '8px' }}>
                                <input type="text" value={project.name || ''} onChange={(e) => setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: e.target.value } : p))} onBlur={saveSnapshot} disabled={!editMode} placeholder="Project Name" style={{ width: '100%', marginBottom: '8px', padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }} />
                                {(project.bullets || []).map((bullet, bidx) => (
                                    <div key={bidx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <textarea value={bullet || ''} onChange={(e) => {
                                            const newBullets = [...(project.bullets || [])];
                                            newBullets[bidx] = e.target.value;
                                            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, bullets: newBullets } : p));
                                        }} onBlur={saveSnapshot} disabled={!editMode} rows={1} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '12px', resize: 'vertical' }} placeholder="Bullet point..." />
                                        {editMode && <button onClick={() => {
                                            const newBullets = (project.bullets || []).filter((_, i) => i !== bidx);
                                            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, bullets: newBullets } : p));
                                        }} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>}
                                    </div>
                                ))}
                                {editMode && <button onClick={() => setProjects(prev => prev.map(p => p.id === project.id ? { ...p, bullets: [...(p.bullets || []), ''] } : p))} style={{ marginTop: '8px', padding: '4px 10px', fontSize: '10px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c' }}>+ Add Bullet</button>}
                                {editMode && <button onClick={() => setProjects(prev => prev.filter(p => p.id !== project.id))} style={{ marginTop: '8px', marginLeft: '8px', padding: '4px 10px', fontSize: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete Project</button>}
                            </div>
                        ))}
                        {editMode && (!projects || projects.length === 0) && (
                            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>
                                No projects added yet. Click "Add Project" to get started.
                            </div>
                        )}
                    </div>
                );
            case 'certifications':
                return (
                    <div key="certifications" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>🏆 Certifications</h3>
                            {editMode && <button onClick={addCertification} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Certification</button>}
                        </div>
                        {(certifications || []).map((cert, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <input type="text" value={cert || ''} onChange={(e) => updateCertification(idx, e.target.value)} onBlur={saveSnapshot} disabled={!editMode} placeholder="e.g., PMP, AWS Certified Solutions Architect" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                {editMode && <button onClick={() => deleteCertification(idx)} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>}
                            </div>
                        ))}
                        {editMode && (!certifications || certifications.length === 0) && (
                            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>
                                No certifications added yet. Click "Add Certification" to get started.
                            </div>
                        )}
                    </div>
                );
            case 'education':
                return (
                    <div key="education" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>🎓 Education</h3>
                            {editMode && <button onClick={addEducation} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Education</button>}
                        </div>
                        {(education || []).map((edu) => (
                            <div key={edu.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e6e4dd' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
                                    <input type="text" placeholder="Degree" value={edu.degree || ''} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                    <input type="text" placeholder="Institution" value={edu.institution || ''} onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                    <input type="text" placeholder="Year" value={edu.year || ''} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                </div>
                                {editMode && <button onClick={() => deleteEducation(edu.id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>}
                            </div>
                        ))}
                        {editMode && (!education || education.length === 0) && (
                            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>
                                No education entries yet. Click "Add Education" to get started.
                            </div>
                        )}
                    </div>
                );
            case 'publications':
                return (
                    <div key="publications" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', margin: 0, color: '#c9a84c' }}>📝 Publications</h3>
                            {editMode && <button onClick={() => setPublications(prev => [...(prev || []), ''])} style={{ padding: '4px 10px', fontSize: '11px', background: '#c9a84c', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#1a1f2e' }}>+ Add Publication</button>}
                        </div>
                        {(publications || []).map((pub, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <textarea value={pub || ''} onChange={(e) => {
                                    const updated = [...(publications || [])];
                                    updated[idx] = e.target.value;
                                    setPublications(updated);
                                }} onBlur={saveSnapshot} disabled={!editMode} rows={2} placeholder="Citation or publication title" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                {editMode && <button onClick={() => setPublications(prev => (prev || []).filter((_, i) => i !== idx))} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>}
                            </div>
                        ))}
                        {editMode && (!publications || publications.length === 0) && (
                            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', padding: '20px' }}>
                                No publications added yet. Click "Add Publication" to get started.
                            </div>
                        )}
                    </div>
                );
            default:
                const customSection = customSections.find(s => s.id === sectionId);
                if (customSection) {
                    return (
                        <div key={customSection.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <input type="text" value={customSection.name || ''} onChange={(e) => updateCustomSection(customSection.id, 'name', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ fontSize: '13px', fontWeight: 600, background: 'transparent', border: 'none', padding: 0, color: '#c9a84c' }} />
                                {editMode && <button onClick={() => deleteCustomSection(customSection.id)} style={{ fontSize: '11px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete Section</button>}
                            </div>
                            {customSection.type === 'bulleted' ? (
                                <>
                                    {Array.isArray(customSection.content) && customSection.content.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                            <input type="text" value={item || ''} onChange={(e) => {
                                                const newContent = [...(customSection.content || [])];
                                                newContent[idx] = e.target.value;
                                                updateCustomSection(customSection.id, 'content', newContent);
                                            }} onBlur={saveSnapshot} disabled={!editMode} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                            {editMode && <button onClick={() => {
                                                const newContent = (customSection.content || []).filter((_, i) => i !== idx);
                                                updateCustomSection(customSection.id, 'content', newContent);
                                            }} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>}
                                        </div>
                                    ))}
                                    {editMode && <button onClick={() => updateCustomSection(customSection.id, 'content', [...(customSection.content || []), ''])} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #c9a84c', borderRadius: '4px', cursor: 'pointer', color: '#c9a84c', fontSize: '12px' }}>+ Add Item</button>}
                                </>
                            ) : (
                                <textarea value={customSection.content || ''} onChange={(e) => updateCustomSection(customSection.id, 'content', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} rows={3} style={{ width: '100%', padding: '12px', border: '1px solid #e6e4dd', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', resize: 'vertical', fontFamily: 'inherit' }} placeholder={`Enter ${customSection.name.toLowerCase()} content...`} />
                            )}
                        </div>
                    );
                }
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3f0', position: 'relative' }}>
            {/* Left Sidebar Toggle Button */}
            <button onClick={toggleLeftSidebar} style={{ position: 'fixed', left: isLeftSidebarOpen ? 280 : 10, top: 80, zIndex: 150, background: '#c9a84c', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', transition: 'left 0.3s ease' }}>
                {isLeftSidebarOpen ? '◀' : '▶'}
            </button>
            
            {/* Left Sidebar */}
            <div style={{ width: isLeftSidebarOpen ? '280px' : '0px', overflow: isLeftSidebarOpen ? 'auto' : 'hidden', background: 'white', borderRight: '1px solid #e6e4dd', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.3s ease' }}>
                {isLeftSidebarOpen && (
                    <>
                        {/* Logo */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd', display: 'flex', justifyContent: 'center' }}>
                            <img src="https://raw.githubusercontent.com/keron62-spec/VeritasResumeIntelligence/refs/heads/main/public/images/veritaslogo.jpeg?raw=true" alt="Veritas Logo" style={{ maxWidth: '120px', height: 'auto' }} />
                        </div>
                        
                        {/* Template Selector */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', marginBottom: '12px', textTransform: 'uppercase' }}>🎨 Templates</h3>
                            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e6e4dd', fontSize: '12px' }}>
                                {Object.entries(TEMPLATES).map(([key, t]) => (<option key={key} value={key}>{t.icon} {t.name}</option>))}
                            </select>
                        </div>
                        
                        {/* PDF Upload Button */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd' }}>
                            <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) { handlePDFUpload(e.target.files[0]); e.target.value = ''; } }} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isExtractingPDF} style={{ width: '100%', padding: '10px', background: isExtractingPDF ? '#6b21a5' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isExtractingPDF ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {isExtractingPDF ? '⏳ Extracting PDF...' : '📄 Upload PDF Resume'}
                            </button>
                            {pdfExtractionError && (
                                <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '8px', textAlign: 'center' }}>
                                    ⚠️ {pdfExtractionError}
                                </div>
                            )}
                        </div>
                        
                        {/* AI Parser Button */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd' }}>
                            <button onClick={() => runAIParser(true)} disabled={isAIParsing} style={{ width: '100%', padding: '10px', background: isAIParsing ? '#6b21a5' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: isAIParsing ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 500 }}>
                                {isAIParsing ? '⏳ AI Parsing...' : '🤖 AI Parser (Gemma 4 31B)'}
                            </button>
                            {aiParseFailed && (
                                <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '8px', textAlign: 'center' }}>
                                    ⚠️ AI parsing failed. Using fallback. Click button to retry.
                                </div>
                            )}
                        </div>
                        
                        {/* Mode Controls */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button onClick={() => setEditMode(!editMode)} style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>
                                {editMode ? '👁️ Preview Mode' : '✏️ Edit Mode'}
                            </button>
                            <button onClick={() => setPreviewMode(!previewMode)} style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>
                                {previewMode ? '📝 Hide Preview' : '👁️ Show Preview'}
                            </button>
                            <button onClick={toggleRightSidebar} style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>
                                {showRightSidebar ? '▶ Hide Scores' : '◀ Show Scores'}
                            </button>
                            <button onClick={() => setShowReorderModal(true)} style={{ padding: '8px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>
                                📋 Reorder Sections
                            </button>
                        </div>
                        
                        {/* Draft Controls */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', gap: '8px' }}>
                            <button onClick={saveDraft} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>💾 Save</button>
                            <button onClick={loadDraft} style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>📂 Load</button>
                        </div>
                        
                        {/* Undo/Redo */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e4dd', display: 'flex', gap: '8px' }}>
                            <button onClick={undo} disabled={historyIndex <= 0} style={{ flex: 1, padding: '6px', fontSize: '11px', background: historyIndex <= 0 ? '#f5f3f0' : 'white', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}>↩️ Undo</button>
                            <button onClick={redo} disabled={historyIndex >= stateHistory.length - 1} style={{ flex: 1, padding: '6px', fontSize: '11px', background: historyIndex >= stateHistory.length - 1 ? '#f5f3f0' : 'white', border: '1px solid #e6e4dd', borderRadius: '6px', cursor: historyIndex >= stateHistory.length - 1 ? 'not-allowed' : 'pointer' }}>↪️ Redo</button>
                        </div>
                        
                        {/* Export & Back */}
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                            <button onClick={handleExportConfirm} disabled={isGeneratingPDF} style={{ padding: '10px', fontSize: '12px', fontWeight: 600, width: '100%', background: '#c9a84c', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#1a1f2e' }}>
                                {isGeneratingPDF ? '⏳ Generating...' : '📥 Export PDF'}
                            </button>
                            <button onClick={() => onClose && onClose()} style={{ padding: '10px', fontSize: '12px', width: '100%', borderRadius: '6px', border: '1px solid #e6e4dd', background: 'white', cursor: 'pointer' }}>
                                ← Back to Analysis
                            </button>
                        </div>
                        
                        {/* Change Summary */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e6e4dd' }}>
                            <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '8px', textTransform: 'uppercase' }}>Changes ({stateHistory.length})</h3>
                            <div style={{ fontSize: '10px', color: stateHistory.length ? '#10b981' : '#6b7280' }}>
                                {stateHistory.length ? '✓ Ready to undo/redo' : 'No changes yet'}
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Main Editor Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', transition: 'margin-left 0.3s ease' }}>
                <div style={{ fontSize: '11px', textAlign: 'right', marginBottom: '8px', color: '#6b7280' }}>
                    {summary.length} characters ({Math.round(summary.length / 5)} words)
                </div>
                
                {previewMode ? (
                    <div style={{ fontFamily: currentTemplate.fontFamily, maxWidth: '8.5in', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                        {/* Preview content - uses safePersonalInfo and same structure as before */}
                        <div style={{ textAlign: 'center', marginBottom: '24px', ...currentTemplate.headerStyle }}>
                            <div style={{ fontSize: currentTemplate.nameStyle?.fontSize || '28px', fontWeight: currentTemplate.nameStyle?.fontWeight || 700, color: currentTemplate.nameStyle?.color || '#1a1f2e', ...currentTemplate.nameStyle }}>
                                {safePersonalInfo.name || 'Your Name'}
                            </div>
                            {targetTitle && <div style={{ fontSize: '12px', color: '#c9a84c', marginTop: '4px', marginBottom: '8px' }}>{targetTitle}</div>}
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                {[safePersonalInfo.email, safePersonalInfo.phone, safePersonalInfo.linkedin, safePersonalInfo.location].filter(Boolean).join(' | ')}
                            </div>
                        </div>
                        {summary && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Professional Summary</div>
                                <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{summary}</div>
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', ...currentTemplate.sectionStyle }}>Experience</div>
                            {(roles || []).slice(0, 5).map((role, idx) => (
                                <div key={idx} style={{ marginBottom: '16px' }}>
                                    {currentTemplate.roleRow ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...currentTemplate.roleRow }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '12px' }}>{role?.title || 'Untitled'}</span>
                                                <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>@ {role?.company || 'Unknown'}</span>
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#666', ...currentTemplate.dateText }}>
                                                {formatDate(role?.startDate, dateFormat)} - {formatDate(role?.endDate, dateFormat) || 'Present'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{role?.title || 'Untitled'} @ {role?.company || 'Unknown'}</div>
                                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>{formatDate(role?.startDate, dateFormat)} - {formatDate(role?.endDate, dateFormat) || 'Present'}</div>
                                        </div>
                                    )}
                                    {(role?.bullets || []).slice(0, 3).map((bullet, bidx) => (
                                        <div key={bidx} style={{ fontSize: '11px', marginLeft: '12px', marginTop: '4px' }}>• {bullet?.text || ''}</div>
                                    ))}
                                    {(role?.bullets?.length || 0) > 3 && (
                                        <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '12px', fontStyle: 'italic' }}>... and {(role?.bullets?.length || 0) - 3} more</div>
                                    )}
                                </div>
                            ))}
                            {(roles?.length || 0) > 5 && <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>... and {(roles?.length || 0) - 5} more roles</div>}
                        </div>
                        {(skills?.length || 0) > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Skills</div>
                                {advancedSkills ? (
                                    <SkillsAdvancedEditor skills={skills || []} setSkills={setSkills} onSave={saveSnapshot} skillsSeparator={skillsSeparator} setSkillsSeparator={setSkillsSeparator} skillsColumns={skillsColumns} setSkillsColumns={setSkillsColumns} />
                                ) : (
                                    <div style={{ fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(skills || []).slice(0, 15).map(skill => (<span key={skill} style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px' }}>{skill}</span>))}
                                        {(skills?.length || 0) > 15 && <span style={{ fontSize: '10px', color: '#6b7280' }}>+{(skills?.length || 0) - 15} more</span>}
                                    </div>
                                )}
                            </div>
                        )}
                        {(education?.length || 0) > 0 && education.some(e => e?.degree) && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Education</div>
                                {education.map((edu, idx) => (
                                    <div key={idx} style={{ fontSize: '11px', marginBottom: '8px' }}>
                                        <strong>{edu?.degree || ''}</strong> {edu?.institution && `from ${edu.institution}`} {edu?.year && `(${edu.year})`}
                                    </div>
                                ))}
                            </div>
                        )}
                        {(certifications?.length || 0) > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Certifications</div>
                                <div style={{ fontSize: '11px' }}>{certifications.map(c => `• ${c}`).join('\n')}</div>
                            </div>
                        )}
                        {(projects?.length || 0) > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Projects</div>
                                {projects.map((project, idx) => (
                                    <div key={idx} style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{project?.name || 'Untitled Project'}</div>
                                        {(project?.bullets || []).map((bullet, bidx) => (
                                            <div key={bidx} style={{ fontSize: '11px', marginLeft: '12px' }}>• {bullet}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                        {(publications?.length || 0) > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Publications</div>
                                <div style={{ fontSize: '11px' }}>{publications.map(p => `• ${p}`).join('\n')}</div>
                            </div>
                        )}
                        {(customSections || []).length > 0 && customSections.map((section, idx) => (
                            <div key={idx} style={{ marginTop: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>{section?.name || 'Section'}</div>
                                {section?.type === 'bulleted' ? (
                                    Array.isArray(section?.content) && section.content.map((item, i) => (
                                        <div key={i} style={{ fontSize: '11px', marginBottom: '4px' }}>• {item}</div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '12px' }}>{section?.content || ''}</div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Edit Mode - Render sections in user-defined order (filtering hidden sections)
                    <>
                        {/* Personal Info - Always at top */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e6e4dd', marginBottom: '20px', padding: '20px' }}>
                            <h3 style={{ fontSize: '13px', marginBottom: '16px', color: '#c9a84c' }}>👤 Personal Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                <input type="text" placeholder= "Full Name" value={safePersonalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                <input type="email" placeholder="Email" value={safePersonalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                <input type="tel" placeholder="Phone" value={safePersonalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                <input type="text" placeholder="LinkedIn URL" value={safePersonalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                                <input type="text" placeholder="Location" value={safePersonalInfo.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} onBlur={saveSnapshot} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                            </div>
                        </div>
                        
                        {renderVisibleSections()}
                        
                        {customSections.filter(s => !sectionOrder.includes(s.id)).map(section => renderSection(s.id))}
                        
                        {editMode && (
                            <button onClick={() => setShowAddSectionModal(true)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '2px dashed #c9a84c', borderRadius: '12px', cursor: 'pointer', color: '#c9a84c', fontSize: '13px', marginBottom: '20px' }}>
                                + Add Custom Section
                            </button>
                        )}
                    </>
                )}
            </div>
            
            {/* Right Sidebar */}
            {showRightSidebar && !previewMode && (
                <div style={{ width: '300px', background: 'white', borderLeft: '1px solid #e6e4dd', overflowY: 'auto', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.3s ease' }}>
                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🎯 JD Fit Score</span><span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.fit_score) }}>{liveScores.fit_score}%</span></div>
                            <div style={{ height: '6px', background: '#e6e4dd', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${liveScores.fit_score}%`, height: '100%', background: getScoreColor(liveScores.fit_score), borderRadius: '3px' }} /></div>
                            <div style={{ fontSize: '10px', color: liveScores.fit_score >= 80 ? '#10b981' : liveScores.fit_score >= 60 ? '#f59e0b' : '#ef4444', marginTop: '4px' }}>{liveScores.fit_label}</div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🧠 Bloom Gap</span><span style={{ fontSize: '13px', fontWeight: 600, color: getBloomColor(liveScores.bloom_gap.delta) }}>{liveScores.bloom_gap.delta > 0 ? '+' : ''}{liveScores.bloom_gap.delta}</span></div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>You: {liveScores.bloom_gap.candidate} | JD: {liveScores.bloom_gap.jd_required}</div>
                            {liveScores.bloom_gap.meets ? <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>✓ Meets JD expectations</div> : <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>⚠ Below JD requirements</div>}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>📄 ATS Score</span><span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.ats_score) }}>{liveScores.ats_score}%</span></div>
                            <div style={{ height: '4px', background: '#e6e4dd', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${liveScores.ats_score}%`, height: '100%', background: getScoreColor(liveScores.ats_score), borderRadius: '2px' }} /></div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>🎭 Semantic Position</span><span style={{ fontSize: '13px', fontWeight: 600, color: Math.abs(liveScores.semantic_position) <= 1.5 ? '#10b981' : '#f59e0b' }}>{liveScores.semantic_position > 0 ? '+' : ''}{liveScores.semantic_position}</span></div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>{liveScores.semantic_label}</div>
                        </div>
                        <details style={{ marginTop: '12px' }}>
                            <summary style={{ fontSize: '10px', cursor: 'pointer', color: '#6b7280' }}>Show details</summary>
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Credibility</span><span style={{ color: getScoreColor(liveScores.credibility_score) }}>{liveScores.credibility_score}%</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Verb Strength</span><span>{liveScores.verb_strength}%</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Metric Quality</span><span>{liveScores.metric_strength}%</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}><span>Buzzwords</span><span style={{ color: liveScores.buzzword_count > 3 ? '#ef4444' : '#10b981' }}>{liveScores.buzzword_count}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}><span>RIASEC</span><span>{liveScores.riasec_code}</span></div>
                            </div>
                        </details>
                    </div>
                    
                    {jdText && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e6e4dd' }}>
                            <div onClick={() => setShowJDContext(!showJDContext)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Original JD</h3>
                                <span>{showJDContext ? '▼' : '▶'}</span>
                            </div>
                            {showJDContext && (
                                <div style={{ marginTop: '12px', fontSize: '11px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: '#f8f7f4', borderRadius: '6px' }}>
                                    {jdText}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {hiddenBriefAnalysis && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e6e4dd' }}>
                            <div onClick={() => setShowHiddenBrief(!showHiddenBrief)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>🕵️ Hidden Brief</h3>
                                <span>{showHiddenBrief ? '▼' : '▶'}</span>
                            </div>
                            {showHiddenBrief && (
                                <div style={{ marginTop: '12px' }}>
                                    {hiddenBriefAnalysis.core_problem?.inferred_problem && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444' }}>Hidden Problem</div>
                                            <div style={{ fontSize: '11px', marginTop: '4px' }}>{hiddenBriefAnalysis.core_problem.inferred_problem}</div>
                                        </div>
                                    )}
                                    {hiddenBriefAnalysis.language_pattern?.resume_framing_tip && (
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c' }}>Framing Tip</div>
                                            <div style={{ fontSize: '11px', marginTop: '4px' }}>{hiddenBriefAnalysis.language_pattern.resume_framing_tip}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Modals */}
            <AddSectionModal isOpen={showAddSectionModal} onClose={() => setShowAddSectionModal(false)} onAdd={addCustomSection} sectionPosition={sectionPosition} setSectionPosition={setSectionPosition} />
            <ExportChecklistModal isOpen={showExportChecklist} onClose={() => setShowExportChecklist(false)} onConfirm={handleExportConfirm} checklist={exportChecklist} />
            {isAIParsing && <AILoadingOverlay message="🤖 AI is parsing your resume with Gemma 4 31B..." />}
            {showAIParseComparison && aiParsedData && (
                <AIParseComparisonModal 
                    isOpen={showAIParseComparison} 
                    onClose={() => setShowAIParseComparison(false)} 
                    deterministicRoles={roles} 
                    deterministicSkills={skills}
                    deterministicEducation={education}
                    aiParsedData={aiParsedData} 
                    onAcceptAI={() => {
                        setRoles(aiParsedData.roles || []);
                        setSkills(aiParsedData.skills || []);
                        setEducation(aiParsedData.education || []);
                        setProjects(aiParsedData.projects || []);
                        setCertifications(aiParsedData.certifications || []);
                        setPublications(aiParsedData.publications || []);
                        if (aiParsedData.header?.name) setPersonalInfo(prev => ({ ...prev, ...aiParsedData.header }));
                        if (aiParsedData.summary) setSummary(aiParsedData.summary);
                        saveSnapshot();
                        setShowAIParseComparison(false);
                        showToast('AI parser results applied!', 'success');
                    }} 
                />
            )}
            <SectionReorderModal 
                isOpen={showReorderModal} 
                onClose={() => setShowReorderModal(false)} 
                sections={{ targetTitle: true, summary: true, experience: true, skills: true, projects: true, certifications: true, education: true, publications: true }}
                onReorder={(newOrder) => setSectionOrder(newOrder)}
                sectionOrder={sectionOrder}
                setSectionOrder={setSectionOrder}
                hiddenSections={hiddenSections}
                setHiddenSections={setHiddenSections}
            />
            {floatingToolbar && (
                <FloatingToolbar 
                    position={floatingToolbar} 
                    onFormat={applyFormatting} 
                    onClose={() => setFloatingToolbar(null)} 
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .btn-secondary:hover { border-color: #c9a84c; color: #c9a84c; }
                textarea:focus, input:focus, select:focus { outline: none; border-color: #c9a84c; }
            `}</style>
        </div>
    );
}
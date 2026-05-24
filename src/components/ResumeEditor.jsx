// src/components/ResumeEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ============================================================
// DETERMINISTIC SCORING LIBRARIES
// ============================================================
import { calculateATSScore, calculateFitScore, calculateCredibilityScore, calculateSemanticPosition } from '../utils/scoreCalculator.js';
import { calculateDeterministicBloom, analyzeBulletBloom } from '../utils/deterministicBloom.js';
import { extractBullets, groupBulletsByRole } from '../utils/bulletParser.js';
import { detectSeniorityFromText } from '../utils/seniorityDetector.js';
import { parseJobDescription, extractEducationRequired, extractYearsRequired as extractJDYears } from '../utils/jdParser.js';
import { analyzeVerbs } from '../utils/verbs.js';
import { detectBuzzwords } from '../utils/buzzwords.js';
import { calculateMetricStrength } from '../utils/metricsPatterns.js';
import { calculateRIASECDeterministic } from '../utils/riasec.js';
import { countTechnicalSkills } from '../utils/skillDictionary.js';

// Register fonts for PDF
Font.register({
    family: 'Inter',
    src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2'
});
Font.register({
    family: 'Times-Roman',
    src: 'https://fonts.gstatic.com/s/timesnewroman/v15/7cH2v4sjD1W9J7YxYk8L8Z8D.woff2'
});
Font.register({
    family: 'PlayfairDisplay',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.woff2'
});
Font.register({
    family: 'Arial',
    src: 'https://fonts.gstatic.com/s/arial/v14/PAX7iGkYl5xGgqk.woff2'
});

// ============================================================
// PDF STYLES (text-based, ATS-friendly)
// ============================================================
const createPDFStyles = (template) => {
    const styles = {
        page: {
            padding: 50,
            fontSize: 11,
            fontFamily: template === 'classic' ? 'Times-Roman' : template === 'executive' ? 'PlayfairDisplay' : template === 'modern' ? 'Inter' : 'Arial',
            lineHeight: 1.5
        },
        header: {
            textAlign: 'center',
            marginBottom: 20,
            borderBottom: template === 'classic' ? 2 : template === 'executive' ? 1 : 1,
            borderBottomColor: template === 'classic' ? '#000' : '#c9a84c',
            paddingBottom: 10
        },
        name: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 5,
            textTransform: 'uppercase',
            letterSpacing: template === 'classic' ? 2 : 1
        },
        contactRow: {
            fontSize: 9,
            color: '#666',
            textAlign: 'center',
            marginTop: 5
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            marginTop: 15,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
            backgroundColor: template === 'ats' ? '#f0f0f0' : 'transparent',
            padding: template === 'ats' ? 4 : 0
        },
        bullet: {
            marginLeft: 12,
            marginBottom: 6,
            fontSize: 10
        },
        roleHeader: {
            fontWeight: 'bold',
            marginTop: 10,
            marginBottom: 4,
            fontSize: 11
        },
        companyText: {
            fontSize: 10,
            color: '#666',
            marginBottom: 6,
            fontStyle: 'italic'
        },
        skillsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 8,
            gap: 6
        },
        skillChip: {
            fontSize: 9,
            padding: 4,
            backgroundColor: '#f0f0f0',
            marginRight: 6,
            marginBottom: 6
        }
    };
    return StyleSheet.create(styles);
};

// ============================================================
// PDF Document Component
// ============================================================
const ResumePDF = ({ personalInfo, summary, bullets, skills, education, template, selectedTemplate }) => {
    const styles = createPDFStyles(selectedTemplate);
    const groupedBullets = groupBulletsByRole(bullets);
    
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
                    <Text style={styles.contactRow}>
                        {[personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.location].filter(Boolean).join(' | ')}
                    </Text>
                </View>
                
                {/* Summary */}
                {summary && (
                    <>
                        <Text style={styles.sectionTitle}>Professional Summary</Text>
                        <Text style={{ fontSize: 10, marginBottom: 12 }}>{summary}</Text>
                    </>
                )}
                
                {/* Experience */}
                <Text style={styles.sectionTitle}>Experience</Text>
                {groupedBullets.map((group, idx) => (
                    <View key={idx} style={{ marginBottom: 12 }}>
                        <Text style={styles.roleHeader}>{group.role} {group.company ? `@ ${group.company}` : ''}</Text>
                        {group.bullets.map((bullet, bidx) => (
                            <Text key={bidx} style={styles.bullet}>• {bullet.text}</Text>
                        ))}
                    </View>
                ))}
                
                {/* Skills */}
                {skills.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill, idx) => (
                                <Text key={idx} style={styles.skillChip}>{skill}</Text>
                            ))}
                        </View>
                    </>
                )}
                
                {/* Education */}
                {education && education.degree && (
                    <>
                        <Text style={styles.sectionTitle}>Education</Text>
                        <Text style={{ fontSize: 10, marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{education.degree}</Text></Text>
                        <Text style={{ fontSize: 9, color: '#666' }}>{education.institution} {education.year && `(${education.year})`}</Text>
                    </>
                )}
            </Page>
        </Document>
    );
};

// ============================================================
// TEMPLATE STYLES
// ============================================================
const TEMPLATES = {
    classic: {
        name: 'Classic Corporate',
        icon: '📄',
        fontFamily: "'Times New Roman', 'Georgia', serif",
        headerStyle: { borderBottom: '2px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '2px' },
        sectionStyle: { borderBottom: '1px solid #1a1a1a', textTransform: 'uppercase', letterSpacing: '1px' }
    },
    modern: {
        name: 'Modern Minimal',
        icon: '✨',
        fontFamily: "'Inter', sans-serif",
        headerStyle: { color: '#c9a84c', fontWeight: 600 },
        sectionStyle: { color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }
    },
    executive: {
        name: 'Executive',
        icon: '👑',
        fontFamily: "'Playfair Display', serif",
        headerStyle: { color: '#2c1810', borderTop: '6px solid #c9a84c', paddingTop: '20px' },
        sectionStyle: { color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700 }
    },
    ats: {
        name: 'ATS Optimized',
        icon: '🤖',
        fontFamily: "'Arial', sans-serif",
        headerStyle: { fontWeight: 700 },
        sectionStyle: { backgroundColor: '#f0f0f0', padding: '6px 10px', fontWeight: 700, textTransform: 'uppercase' }
    }
};

// ============================================================
// HELPER: Extract JD Features for Comparison Scoring
// ============================================================
function extractJDFeatures(jdText) {
    if (!jdText) return null;
    
    const seniority = detectSeniorityFromText(jdText);
    const yearsRequired = extractJDYears(jdText);
    const educationRequired = extractEducationRequired(jdText);
    const sections = parseJobDescription(jdText);
    
    // Extract critical keywords
    const words = jdText.split(/\s+/);
    const criticalKeywords = new Set();
    for (const word of words) {
        const clean = word.replace(/[^\w]/g, '');
        if (clean.length > 3 && /[A-Z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note)$/i.test(clean)) {
            criticalKeywords.add(clean.toLowerCase());
        }
    }
    
    // Estimate JD Bloom level (refined to avoid "lead" over-inflation)
    const responsibilitiesText = (sections.responsibilities || []).join(' ').toLowerCase();
    
    // Executive requires multiple strong signals
    const isExecutiveBloom = /\b(architect|transform|orchestrate|spearhead|found|direct|own|p&l|board|strategic)\b/i.test(responsibilitiesText) &&
        (/\blead\b/i.test(responsibilitiesText) || /\bstrateg/i.test(responsibilitiesText));
    
    if (isExecutiveBloom) {
        jdBloomLevel = 5.5;
    } else if (responsibilitiesText.match(/manage|drive|deliver|execute|implement|evaluate|assess|recommend|lead|strateg/i)) {
        jdBloomLevel = 4.5;
    } else if (responsibilitiesText.match(/coordinate|analyze|investigate|examine|facilitate|support|assist/i)) {
        jdBloomLevel = 3.5;
    } else {
        jdBloomLevel = 2.5;
    }
    
    return {
        seniority: seniority.level,
        seniority_level_num: { entry: 1, mid: 2, senior: 3, executive: 4 }[seniority.level] || 2,
        years_required: yearsRequired || 3,
        education_required: educationRequired,
        critical_keywords: Array.from(criticalKeywords).slice(0, 50),
        sections,
        jd_bloom_level: jdBloomLevel
    };
}

// ============================================================
// HELPER: Calculate Keyword Match Rate
// ============================================================
function calculateKeywordMatchRate(resumeText, jdKeywords) {
    if (!jdKeywords || jdKeywords.length === 0) return 0;
    const lowerResume = resumeText.toLowerCase();
    let matchCount = 0;
    for (const keyword of jdKeywords) {
        if (lowerResume.includes(keyword)) matchCount++;
    }
    return Math.round((matchCount / jdKeywords.length) * 100);
}

// ============================================================
// HELPER: Calculate Skills Match Rate
// ============================================================
function calculateSkillsMatchRate(resumeSkills, jdText) {
    if (!jdText || !resumeSkills.length) return 0;
    const jdSkills = countTechnicalSkills(jdText);
    const lowerJD = jdText.toLowerCase();
    let matchCount = 0;
    for (const skill of resumeSkills) {
        if (lowerJD.includes(skill.toLowerCase())) matchCount++;
    }
    return Math.min(100, Math.round((matchCount / Math.max(1, jdSkills)) * 100));
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ResumeEditor() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // ============================================================
    // STATE - Data from navigation
    // ============================================================
    const { result, jdText, hiddenBriefAnalysis } = location.state || {};
    
    // Extract data from result
    const bulletAnalysis = result?.bullet_analysis;
    const summaryAnalysis = result?.summary_analysis;
    const skillExtractor = result?.skill_extractor;
    
    // ============================================================
    // STATE - Editable Content
    // ============================================================
    const [editMode, setEditMode] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', linkedin: '', location: '' });
    const [summary, setSummary] = useState('');
    const [summaryVersion, setSummaryVersion] = useState('original');
    const [bullets, setBullets] = useState([]);
    const [skills, setSkills] = useState([]);
    const [education, setEducation] = useState({ degree: '', institution: '', year: '' });
    const [showPreview, setShowPreview] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showScoreDetails, setShowScoreDetails] = useState(false);
    const [expandedRoles, setExpandedRoles] = useState({});
    const [showTransformation, setShowTransformation] = useState({});
    
    // ============================================================
    // STATE - JD Features (for comparison scoring)
    // ============================================================
    const [jdFeatures, setJdFeatures] = useState(null);
    
    // ============================================================
    // STATE - Live Scores
    // ============================================================
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
    
    // ============================================================
    // STATE - Undo/Redo (Snapshot-based)
    // ============================================================
    const [stateHistory, setStateHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // ============================================================
    // REFS
    // ============================================================
    const debounceTimer = useRef(null);
    const previewRef = useRef(null);
    const summaryVersionsRef = useRef({ original: '', veritas: '', hiddenBrief: '' });
    
    // ============================================================
    // SAVE SNAPSHOT FOR UNDO/REDO
    // ============================================================
    const saveSnapshot = useCallback(() => {
        const snapshot = { 
            bullets: [...bullets], 
            summary, 
            skills: [...skills],
            personalInfo: { ...personalInfo },
            education: { ...education }
        };
        setStateHistory(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
        setHistoryIndex(prev => prev + 1);
    }, [bullets, summary, skills, personalInfo, education, historyIndex]);
    
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const snapshot = stateHistory[historyIndex - 1];
            setBullets(snapshot.bullets);
            setSummary(snapshot.summary);
            setSkills(snapshot.skills);
            setPersonalInfo(snapshot.personalInfo);
            setEducation(snapshot.education);
            setHistoryIndex(prev => prev - 1);
        }
    }, [historyIndex, stateHistory]);
    
    const redo = useCallback(() => {
        if (historyIndex < stateHistory.length - 1) {
            const snapshot = stateHistory[historyIndex + 1];
            setBullets(snapshot.bullets);
            setSummary(snapshot.summary);
            setSkills(snapshot.skills);
            setPersonalInfo(snapshot.personalInfo);
            setEducation(snapshot.education);
            setHistoryIndex(prev => prev + 1);
        }
    }, [historyIndex, stateHistory]);
    
    // ============================================================
    // INITIALIZE FROM RESULT DATA
    // ============================================================
    useEffect(() => {
        // Parse JD for comparison scoring
        if (jdText) {
            const features = extractJDFeatures(jdText);
            setJdFeatures(features);
        }
        
        // Initialize bullets from analysis
        if (bulletAnalysis?.bullets && bulletAnalysis.bullets.length > 0) {
            setBullets(bulletAnalysis.bullets.map(b => ({
                id: b.id,
                text: b.hb_transformed_text || b.transformed_text || b.original_text,
                original: b.original_text,
                veritas: b.transformed_text,
                hiddenBrief: b.hb_transformed_text,
                role: b.role || 'Unknown Role',
                company: b.company || 'Unknown Company',
                section: b.section || 'Experience',
                score: b.hb_score || b.transformed_score || b.original_score || 0,
                jd_keywords_found: b.jd_keywords_found || [],
                jd_keywords_missing: b.jd_keywords_missing || []
            })));
            saveSnapshot();
        }
        
        // Initialize summary
        if (summaryAnalysis) {
            const originalText = summaryAnalysis.original_text || '';
            const veritasText = summaryAnalysis.veritas_transformed_summary || '';
            const hbText = summaryAnalysis.hb_transformed_summary || '';
            setSummary(originalText);
            summaryVersionsRef.current = { original: originalText, veritas: veritasText, hiddenBrief: hbText };
        }
        
        // Initialize skills
        if (skillExtractor?.resume_skills_extracted) {
            setSkills(skillExtractor.resume_skills_extracted.map(s => s.skill));
        }
        
        // Extract education from result if available
        if (result?.education) {
            setEducation(result.education);
        }
        
        // Extract personal info from result if available
        if (result?.personal_info) {
            setPersonalInfo(result.personal_info);
        }
    }, [bulletAnalysis, summaryAnalysis, skillExtractor, jdText, result]);
    
    // ============================================================
    // TRACK CHANGES (Fixed closure with useCallback)
    // ============================================================
    const trackChange = useCallback((type, id, newValue) => {
        const newChange = { type, id, newValue, timestamp: Date.now() };
        setStateHistory(prev => {
            const newHistory = [...prev.slice(0, historyIndex + 1), newChange];
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);
    
    // ============================================================
    // BUILD RESUME TEXT (Inlined to avoid stale closure)
    // ============================================================
    const buildResumeText = useCallback(() => {
        let text = '';
        if (personalInfo.name) text += `${personalInfo.name}\n`;
        if (personalInfo.email || personalInfo.phone) {
            text += `${personalInfo.email} | ${personalInfo.phone}\n`;
        }
        text += '\n';
        if (summary) text += `${summary}\n\n`;
        for (const bullet of bullets) {
            text += `• ${bullet.text}\n`;
        }
        if (skills.length) text += `\nSkills: ${skills.join(', ')}\n`;
        if (education.degree) text += `\nEducation: ${education.degree}, ${education.institution} (${education.year})\n`;
        return text;
    }, [personalInfo, summary, bullets, skills, education]);
    
    // ============================================================
    // LIVE SCORING ENGINE (Fixed dependencies)
    // ============================================================
    const updateLiveScores = useCallback(() => {
        if (!bullets.length && !summary) return;
        
        const fullResumeText = buildResumeText();
        
        const candidateSeniority = detectSeniorityFromText(fullResumeText);
        const candidateYears = candidateSeniority.years_detected || 0;
        const candidateLevelNum = { entry: 1, mid: 2, senior: 3, executive: 4 }[candidateSeniority.level] || 2;
        
        const keywordMatchRate = jdFeatures ? calculateKeywordMatchRate(fullResumeText, jdFeatures.critical_keywords) : 0;
        const skillsMatchRate = jdFeatures ? calculateSkillsMatchRate(skills, jdText) : 0;
        const atsResult = calculateATSScore(fullResumeText, jdText, { keywordMatchRate, skillsCount: skills.length });
        
        let fitResult = { score: 50, label: 'Moderate' };
        if (jdFeatures) {
            const levelGap = candidateLevelNum - jdFeatures.seniority_level_num;
            const yearsGap = candidateYears - (jdFeatures.years_required || 3);
            fitResult = calculateFitScore({ keywordMatchRate, levelGap, yearsGap, matchingCertifications: 0, skillsMatchRate });
        }
        
        let candidateBloomLevel = 3.5;
        let bloomDelta = 0;
        let bloomMeetsExpectation = true;
        
        if (bullets.length > 0) {
            const bulletTexts = bullets.map(b => b.text);
            const bloomAnalysis = analyzeBulletBloom(bulletTexts);
            candidateBloomLevel = bloomAnalysis.averageLevel;
        }
        
        if (jdFeatures) {
            bloomDelta = candidateBloomLevel - jdFeatures.jd_bloom_level;
            bloomMeetsExpectation = bloomDelta >= -0.3;
        }
        
        const semanticResult = calculateSemanticPosition(fullResumeText, candidateYears);
        const credibilityResult = calculateCredibilityScore(fullResumeText, { titles: bullets.map(b => ({ title: b.role })) });
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
    }, [bullets, summary, skills, jdFeatures, jdText, buildResumeText]);
    
    // Debounced scoring on edits
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            updateLiveScores();
        }, 500);
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [bullets, summary, skills, personalInfo, education, updateLiveScores]);
    
    // ============================================================
    // BULLET EDITING
    // ============================================================
    const updateBullet = (id, newText) => {
        const oldText = bullets.find(b => b.id === id)?.text;
        setBullets(prev => prev.map(b => b.id === id ? { ...b, text: newText } : b));
        trackChange('bullet', id, newText);
        saveSnapshot();
    };
    
    const applyVeritasVersion = (id) => {
        const bullet = bullets.find(b => b.id === id);
        if (bullet && bullet.veritas) {
            setBullets(prev => prev.map(b => b.id === id ? { ...b, text: bullet.veritas } : b));
            trackChange('bullet', id, bullet.veritas);
            saveSnapshot();
        }
    };
    
    const applyHBVersion = (id) => {
        const bullet = bullets.find(b => b.id === id);
        if (bullet && bullet.hiddenBrief) {
            setBullets(prev => prev.map(b => b.id === id ? { ...b, text: bullet.hiddenBrief } : b));
            trackChange('bullet', id, bullet.hiddenBrief);
            saveSnapshot();
        }
    };
    
    const resetBullet = (id) => {
        const bullet = bullets.find(b => b.id === id);
        if (bullet && bullet.original) {
            setBullets(prev => prev.map(b => b.id === id ? { ...b, text: bullet.original } : b));
            trackChange('bullet', id, bullet.original);
            saveSnapshot();
        }
    };
    
    // ============================================================
    // SUMMARY EDITING
    // ============================================================
    const updateSummary = (newText) => {
        setSummary(newText);
        trackChange('summary', null, newText);
        saveSnapshot();
    };
    
    const switchSummaryVersion = (version) => {
        const versions = summaryVersionsRef.current;
        if (version === 'original' && versions.original) {
            setSummary(versions.original);
            setSummaryVersion('original');
        } else if (version === 'veritas' && versions.veritas) {
            setSummary(versions.veritas);
            setSummaryVersion('veritas');
        } else if (version === 'hiddenBrief' && versions.hiddenBrief) {
            setSummary(versions.hiddenBrief);
            setSummaryVersion('hiddenBrief');
        }
        trackChange('summary_version', version, summary);
        saveSnapshot();
    };
    
    // ============================================================
    // SKILLS EDITING
    // ============================================================
    const addSkill = (skill) => {
        if (skill && !skills.includes(skill)) {
            setSkills(prev => [...prev, skill]);
            trackChange('skill', null, skill);
            saveSnapshot();
        }
    };
    
    const removeSkill = (skillToRemove) => {
        setSkills(prev => prev.filter(s => s !== skillToRemove));
        trackChange('skill_remove', null, skillToRemove);
        saveSnapshot();
    };
    
    // ============================================================
    // EDUCATION EDITING
    // ============================================================
    const updateEducation = (field, value) => {
        setEducation(prev => ({ ...prev, [field]: value }));
        trackChange('education', field, value);
        saveSnapshot();
    };
    
    // ============================================================
    // PERSONAL INFO EDITING
    // ============================================================
    const updatePersonalInfo = (field, value) => {
        setPersonalInfo(prev => ({ ...prev, [field]: value }));
        trackChange('personal', field, value);
        saveSnapshot();
    };
    
    // ============================================================
    // ROLE COLLAPSIBLE SECTIONS
    // ============================================================
    const toggleRoleExpanded = (roleKey) => {
        setExpandedRoles(prev => ({ ...prev, [roleKey]: !prev[roleKey] }));
    };
    
    const toggleTransformation = (bulletId) => {
        setShowTransformation(prev => ({ ...prev, [bulletId]: !prev[bulletId] }));
    };
    
    // ============================================================
    // TEXT-BASED PDF EXPORT (using @react-pdf/renderer)
    // ============================================================
    const exportPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<ResumePDF 
                personalInfo={personalInfo}
                summary={summary}
                bullets={bullets}
                skills={skills}
                education={education}
                template={selectedTemplate}
                selectedTemplate={selectedTemplate}
            />).toBlob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `veritas-resume-${Date.now()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF export error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };
    
    // ============================================================
    // DRAFT SAVE/LOAD
    // ============================================================
    const saveDraft = () => {
        const draft = {
            bullets,
            summary,
            skills,
            personalInfo,
            education,
            template: selectedTemplate,
            timestamp: Date.now()
        };
        localStorage.setItem('veritas_resume_draft', JSON.stringify(draft));
        alert('Draft saved!');
    };
    
    const loadDraft = () => {
        const draftJson = localStorage.getItem('veritas_resume_draft');
        if (draftJson) {
            const draft = JSON.parse(draftJson);
            setBullets(draft.bullets);
            setSummary(draft.summary);
            setSkills(draft.skills);
            setPersonalInfo(draft.personalInfo);
            setEducation(draft.education);
            setSelectedTemplate(draft.template);
            saveSnapshot();
            alert('Draft loaded!');
        } else {
            alert('No saved draft found');
        }
    };
    
    // ============================================================
    // GET SCORE COLOR
    // ============================================================
    const getScoreColor = (score, isInverted = false) => {
        if (isInverted) {
            if (score <= 30) return '#10b981';
            if (score <= 60) return '#f59e0b';
            return '#ef4444';
        }
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    
    const getBloomColor = (delta) => {
        if (delta >= 0) return '#10b981';
        if (delta >= -0.5) return '#f59e0b';
        return '#ef4444';
    };
    
    // ============================================================
    // GROUP BULLETS BY ROLE
    // ============================================================
    const groupedBullets = groupBulletsByRole(bullets);
    
    // ============================================================
    // RENDER
    // ============================================================
    const currentTemplate = TEMPLATES[selectedTemplate];
    
    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh',
            background: '#f5f3f0',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* ============================================================
                LEFT SIDEBAR: Templates + Score Panel
            ============================================================ */}
            <div style={{
                width: '320px',
                background: 'white',
                borderRight: '1px solid #e6e4dd',
                overflowY: 'auto',
                position: 'sticky',
                top: 0,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Template Selector */}
                <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#c9a84c', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🎨 Resume Templates
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(TEMPLATES).map(([key, template]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedTemplate(key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: selectedTemplate === key ? '2px solid #c9a84c' : '1px solid #e6e4dd',
                                    background: selectedTemplate === key ? 'rgba(201, 168, 76, 0.05)' : 'white',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>{template.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{template.name}</div>
                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{template.fontFamily.split(',')[0]}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Live Scores Panel */}
                <div style={{ padding: '20px', borderBottom: '1px solid #e6e4dd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            📊 Live Scores
                        </h3>
                        <button
                            onClick={() => setShowScoreDetails(!showScoreDetails)}
                            style={{ fontSize: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                        >
                            {showScoreDetails ? '▼' : '▶'}
                        </button>
                    </div>
                    
                    {/* Fit Score */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>🎯 JD Fit Score</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.fit_score) }}>
                                {liveScores.fit_score}%
                            </span>
                        </div>
                        <div style={{ height: '6px', background: '#e6e4dd', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${liveScores.fit_score}%`, height: '100%', background: getScoreColor(liveScores.fit_score), borderRadius: '3px' }} />
                        </div>
                        <div style={{ fontSize: '10px', color: liveScores.fit_score >= 80 ? '#10b981' : liveScores.fit_score >= 60 ? '#f59e0b' : '#ef4444', marginTop: '4px' }}>
                            {liveScores.fit_label}
                        </div>
                    </div>
                    
                    {/* Bloom Gap */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>🧠 Bloom Gap</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: getBloomColor(liveScores.bloom_gap.delta) }}>
                                {liveScores.bloom_gap.delta > 0 ? '+' : ''}{liveScores.bloom_gap.delta}
                            </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                            You: {liveScores.bloom_gap.candidate} | JD: {liveScores.bloom_gap.jd_required}
                        </div>
                        {liveScores.bloom_gap.meets ? (
                            <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>✓ Meets JD expectations</div>
                        ) : (
                            <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>⚠ Below JD requirements</div>
                        )}
                    </div>
                    
                    {/* ATS Score */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>📄 ATS Score</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: getScoreColor(liveScores.ats_score) }}>
                                {liveScores.ats_score}%
                            </span>
                        </div>
                        <div style={{ height: '4px', background: '#e6e4dd', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${liveScores.ats_score}%`, height: '100%', background: getScoreColor(liveScores.ats_score), borderRadius: '2px' }} />
                        </div>
                    </div>
                    
                    {/* Semantic Position */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>🎭 Semantic Position</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: Math.abs(liveScores.semantic_position) <= 1.5 ? '#10b981' : '#f59e0b' }}>
                                {liveScores.semantic_position > 0 ? '+' : ''}{liveScores.semantic_position}
                            </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{liveScores.semantic_label}</div>
                    </div>
                    
                    {/* Expandable Details */}
                    {showScoreDetails && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e6e4dd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                                <span>Credibility</span>
                                <span style={{ color: getScoreColor(liveScores.credibility_score) }}>{liveScores.credibility_score}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                                <span>Verb Strength</span>
                                <span>{liveScores.verb_strength}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                                <span>Metric Quality</span>
                                <span>{liveScores.metric_strength}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                                <span>Buzzwords</span>
                                <span style={{ color: liveScores.buzzword_count > 3 ? '#ef4444' : '#10b981' }}>{liveScores.buzzword_count}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                <span>RIASEC</span>
                                <span>{liveScores.riasec_code}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Undo/Redo Controls */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', borderBottom: '1px solid #e6e4dd' }}>
                    <button onClick={undo} disabled={historyIndex <= 0} style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e6e4dd',
                        background: historyIndex <= 0 ? '#f5f3f0' : 'white',
                        color: historyIndex <= 0 ? '#9ca3af' : '#1a1f2e',
                        cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                    }}>
                        ↩️ Undo
                    </button>
                    <button onClick={redo} disabled={historyIndex >= stateHistory.length - 1} style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e6e4dd',
                        background: historyIndex >= stateHistory.length - 1 ? '#f5f3f0' : 'white',
                        color: historyIndex >= stateHistory.length - 1 ? '#9ca3af' : '#1a1f2e',
                        cursor: historyIndex >= stateHistory.length - 1 ? 'not-allowed' : 'pointer'
                    }}>
                        ↪️ Redo
                    </button>
                </div>
                
                {/* Change Summary */}
                <div style={{ padding: '20px', flex: 1 }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#c9a84c', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📝 Changes ({stateHistory.length})
                    </h3>
                    {stateHistory.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                            No changes made yet
                        </div>
                    ) : (
                        <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}>
                            <div style={{ padding: '6px 0', color: '#10b981' }}>
                                ✓ Ready to undo/redo
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* ============================================================
                RIGHT PANEL: Editor + Preview
            ============================================================ */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => setEditMode(!editMode)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            {editMode ? '👁️ Preview Mode' : '✏️ Edit Mode'}
                        </button>
                        <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            {showPreview ? '📝 Hide Preview' : '👁️ Show Preview'}
                        </button>
                        <button onClick={saveDraft} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>💾 Save Draft</button>
                        <button onClick={loadDraft} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>📂 Load Draft</button>
                        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>← Back</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={exportPDF} disabled={isGeneratingPDF} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                            {isGeneratingPDF ? '⏳ Generating...' : '📥 Export PDF'}
                        </button>
                    </div>
                </div>
                
                {/* Personal Info Section */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    marginBottom: '20px',
                    padding: '20px'
                }}>
                    <h3 style={{ fontSize: '13px', marginBottom: '16px', color: '#c9a84c' }}>👤 Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <input type="text" placeholder="Full Name" value={personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                        <input type="email" placeholder="Email" value={personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                        <input type="tel" placeholder="Phone" value={personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                        <input type="text" placeholder="LinkedIn URL" value={personalInfo.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                        <input type="text" placeholder="Location" value={personalInfo.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} disabled={!editMode} style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }} />
                    </div>
                </div>
                
                {/* Professional Summary Section */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    marginBottom: '20px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: '#f8f7f4',
                        borderBottom: '1px solid #e6e4dd'
                    }}>
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
                            value={summary}
                            onChange={(e) => updateSummary(e.target.value)}
                            disabled={!editMode}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${summaryVersion === 'hiddenBrief' ? '#c9a84c' : summaryVersion === 'veritas' ? '#2563eb' : '#e6e4dd'}`,
                                borderRadius: '8px',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Professional summary goes here..."
                        />
                    </div>
                </div>
                
                {/* Experience Section - Grouped by Role */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    overflow: 'hidden',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ padding: '16px 20px 0', fontSize: '13px', color: '#c9a84c' }}>📝 Experience ({bullets.length} bullets)</h3>
                    
                    {groupedBullets.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                            No bullet points found.
                        </div>
                    )}
                    
                    {groupedBullets.map((group, groupIdx) => {
                        const roleKey = `${group.role}_${group.company}`;
                        const isExpanded = expandedRoles[roleKey] !== false;
                        
                        return (
                            <div key={groupIdx} style={{ borderTop: groupIdx === 0 ? '1px solid #e6e4dd' : 'none', borderBottom: '1px solid #e6e4dd' }}>
                                <div 
                                    onClick={() => toggleRoleExpanded(roleKey)}
                                    style={{
                                        padding: '12px 20px',
                                        background: '#f8f7f4',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '13px' }}>{group.role}</strong>
                                        {group.company && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>@ {group.company}</span>}
                                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>({group.bullets.length} bullets)</span>
                                    </div>
                                    <span>{isExpanded ? '▼' : '▶'}</span>
                                </div>
                                
                                {isExpanded && group.bullets.map((bullet, idx) => (
                                    <div key={bullet.id} style={{ padding: '16px 20px', borderTop: idx === 0 ? 'none' : '1px solid #e6e4dd' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#6b7280', flexWrap: 'wrap', gap: '6px' }}>
                                            <span>Bullet {idx + 1}</span>
                                            {bullet.score > 0 && (
                                                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: bullet.score >= 80 ? 'rgba(16, 185, 129, 0.15)' : bullet.score >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: bullet.score >= 80 ? '#10b981' : bullet.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                                                    Score: {bullet.score}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Missing Keywords Tag Row */}
                                        {bullet.jd_keywords_missing && bullet.jd_keywords_missing.length > 0 && (
                                            <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 500 }}>⚠ Missing:</span>
                                                {bullet.jd_keywords_missing.slice(0, 5).map((kw, i) => (
                                                    <span key={i} style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                                                        {kw}
                                                    </span>
                                                ))}
                                                {bullet.jd_keywords_missing.length > 5 && (
                                                    <span style={{ fontSize: '9px', color: '#6b7280' }}>+{bullet.jd_keywords_missing.length - 5} more</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        <textarea
                                            value={bullet.text}
                                            onChange={(e) => updateBullet(bullet.id, e.target.value)}
                                            disabled={!editMode}
                                            rows={2}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #e6e4dd',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                lineHeight: '1.5',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                        
                                        {/* Transformation Preview Toggle */}
                                        {(bullet.veritas || bullet.hiddenBrief) && (
                                            <button 
                                                onClick={() => toggleTransformation(bullet.id)}
                                                style={{ marginTop: '8px', fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                {showTransformation[bullet.id] ? '▼ Hide transformations' : '▶ Show alternative versions'}
                                            </button>
                                        )}
                                        
                                        {showTransformation[bullet.id] && (
                                            <div style={{ marginTop: '8px', padding: '10px', background: '#f8f7f4', borderRadius: '6px' }}>
                                                {bullet.veritas && bullet.veritas !== bullet.text && (
                                                    <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#2563eb', marginBottom: '4px' }}>✨ Veritas Version</div>
                                                        <div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.veritas}</div>
                                                        <button onClick={() => applyVeritasVersion(bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button>
                                                    </div>
                                                )}
                                                {bullet.hiddenBrief && bullet.hiddenBrief !== bullet.text && (
                                                    <div style={{ padding: '8px', background: 'rgba(201, 168, 76, 0.08)', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '4px' }}>🕵️ Hidden Brief Version</div>
                                                        <div style={{ fontSize: '11px', marginBottom: '6px' }}>{bullet.hiddenBrief}</div>
                                                        <button onClick={() => applyHBVersion(bullet.id)} style={{ fontSize: '10px', padding: '3px 8px', background: '#c9a84c', color: '#1a1f2e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Apply This Version</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                            {editMode && bullet.original && bullet.original !== bullet.text && (
                                                <button onClick={() => resetBullet(bullet.id)} style={{ fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '1px solid #e6e4dd', borderRadius: '4px', cursor: 'pointer' }}>
                                                    ↺ Reset to Original
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
                
                {/* Skills Section */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ fontSize: '13px', marginBottom: '12px', color: '#c9a84c' }}>⚙️ Skills ({skills.length})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {skills.map((skill, idx) => (
                            <span key={idx} style={{
                                padding: '6px 12px',
                                background: 'rgba(201, 168, 76, 0.1)',
                                borderRadius: '20px',
                                fontSize: '12px',
                                color: '#c9a84c',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {skill}
                                {editMode && (
                                    <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>×</button>
                                )}
                            </span>
                        ))}
                    </div>
                    {editMode && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                id="new-skill-input"
                                placeholder="Add new skill..."
                                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '12px' }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const input = e.target;
                                        const newSkill = input.value.trim();
                                        if (newSkill && !skills.includes(newSkill)) {
                                            addSkill(newSkill);
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <button className="btn-secondary" onClick={() => {
                                const input = document.getElementById('new-skill-input');
                                const newSkill = input.value.trim();
                                if (newSkill && !skills.includes(newSkill)) {
                                    addSkill(newSkill);
                                    input.value = '';
                                }
                            }} style={{ padding: '6px 12px', fontSize: '12px' }}>+ Add Skill</button>
                        </div>
                    )}
                </div>
                
                {/* Education Section */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e6e4dd',
                    padding: '20px'
                }}>
                    <h3 style={{ fontSize: '13px', marginBottom: '12px', color: '#c9a84c' }}>🎓 Education</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="Degree (e.g., MBA, MPH, Bachelor of Science)"
                            value={education.degree}
                            onChange={(e) => updateEducation('degree', e.target.value)}
                            disabled={!editMode}
                            style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }}
                        />
                        <input
                            type="text"
                            placeholder="Institution (e.g., University of the West Indies)"
                            value={education.institution}
                            onChange={(e) => updateEducation('institution', e.target.value)}
                            disabled={!editMode}
                            style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }}
                        />
                        <input
                            type="text"
                            placeholder="Year of Graduation (e.g., 2020)"
                            value={education.year}
                            onChange={(e) => updateEducation('year', e.target.value)}
                            disabled={!editMode}
                            style={{ padding: '8px 12px', border: '1px solid #e6e4dd', borderRadius: '6px', fontSize: '13px' }}
                        />
                    </div>
                </div>
                
                {/* Live Preview (if enabled) */}
                {showPreview && (
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '13px', marginBottom: '12px', color: '#c9a84c' }}>📄 Live Preview</h3>
                        <div ref={previewRef} style={{
                            fontFamily: currentTemplate.fontFamily,
                            maxWidth: '8.5in',
                            margin: '0 auto',
                            background: 'white',
                            padding: '40px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            {/* Preview Header */}
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, ...currentTemplate.headerStyle }}>{personalInfo.name || 'Your Name'}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                                    {[personalInfo.email, personalInfo.phone, personalInfo.linkedin, personalInfo.location].filter(Boolean).join(' | ')}
                                </div>
                            </div>
                            
                            {/* Preview Summary */}
                            {summary && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Professional Summary</div>
                                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{summary}</div>
                                </div>
                            )}
                            
                            {/* Preview Bullets (grouped by role) */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', ...currentTemplate.sectionStyle }}>Experience</div>
                                {groupedBullets.slice(0, 3).map((group, idx) => (
                                    <div key={idx} style={{ marginBottom: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{group.role} {group.company && `@ ${group.company}`}</div>
                                        {group.bullets.slice(0, 2).map((bullet, bidx) => (
                                            <div key={bidx} style={{ fontSize: '11px', marginLeft: '12px', marginTop: '4px' }}>• {bullet.text}</div>
                                        ))}
                                        {group.bullets.length > 2 && (
                                            <div style={{ fontSize: '10px', color: '#6b7280', marginLeft: '12px', marginTop: '4px', fontStyle: 'italic' }}>... and {group.bullets.length - 2} more bullets</div>
                                        )}
                                    </div>
                                ))}
                                {groupedBullets.length > 3 && (
                                    <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>... and {groupedBullets.length - 3} more roles</div>
                                )}
                            </div>
                            
                            {/* Preview Skills */}
                            {skills.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Skills</div>
                                    <div style={{ fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {skills.slice(0, 10).map(skill => (
                                            <span key={skill} style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px' }}>{skill}</span>
                                        ))}
                                        {skills.length > 10 && <span style={{ fontSize: '10px', color: '#6b7280' }}>+{skills.length - 10} more</span>}
                                    </div>
                                </div>
                            )}
                            
                            {/* Preview Education */}
                            {education.degree && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', ...currentTemplate.sectionStyle }}>Education</div>
                                    <div style={{ fontSize: '11px' }}>
                                        <strong>{education.degree}</strong>
                                        {education.institution && <span> from {education.institution}</span>}
                                        {education.year && <span> ({education.year})</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import FileUploadSection from './components/FileUploadSection.jsx';
import ScoreDashboard from './components/ScoreDashboard.jsx';
import RiasecSection from './components/RiasecSection.jsx';
import SemanticSection from './components/SemanticSection.jsx';
import CredibilitySection from './components/CredibilitySection.jsx';
import BloomSection from './components/BloomSection.jsx';
import IssuesList from './components/IssuesList.jsx';
import AllIssuesTable from './components/AllIssuesTable.jsx';
import StrengthsAndKeywords from './components/StrengthsAndKeywords.jsx';
import RoleMatches from './components/RoleMatches.jsx';
import ScoreBreakdown from './components/ScoreBreakdown.jsx';
import MetricQuality from './components/MetricQuality.jsx';
import EmailCapture from './components/EmailCapture.jsx';
import LoadingTips from './components/LoadingTips.jsx';
import ATSEyeViewWarning from './components/ATSEyeViewWarning.jsx';
import SummaryAnalyzer from './components/SummaryAnalyzer.jsx';
import BulletAnalyzer from './components/BulletAnalyzer.jsx';
import ExecutiveEvaluation from './components/ExecutiveEvaluation.jsx';
import SkillExtractor from './components/SkillExtractor.jsx';
import HiddenBriefCard from './components/HiddenBriefCard.jsx';
import { useLeniencyMode } from './hooks/useLeniencyMode.js';
import { useHiddenBrief } from './hooks/useHiddenBrief.js';
import { extractDocx } from './utils/parseHelpers.js';
import { createSafeResult } from './utils/helpers.js';
import { extractAllFeatures } from './utils/featureExtractor.js';
import { calculateRIASECDeterministic } from './utils/riasec.js';
import './styles/leniency-modes.css';

export default function App() {
    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('veritas-dark-mode') === 'true');
    
    // Mode & UI State
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStage, setAnalysisStage] = useState('');
    const [extractionStage, setExtractionStage] = useState(false);
    const [result, setResult] = useState(null);
    
    // Debug State
    const [showDebug, setShowDebug] = useState(false);
    const [rawApiResponse, setRawApiResponse] = useState(null);
    
    // ATS Eye View State
    const [pdfIssues, setPdfIssues] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [showWarning, setShowWarning] = useState(true);
    
    // Model Type State (Normal mode - Gemini vs Dual-Optimized)
    const [modelType, setModelType] = useState(() => {
        return localStorage.getItem('veritas_model_type') || 'gemini';
    });
    
    // Hermes Model Type State (Strict/Very Strict/Lenient modes - Gemini vs Hermes)
    const [hermesModelType, setHermesModelType] = useState(() => {
        const saved = localStorage.getItem('veritas_hermes_model_type');
        if (saved && ['gemini', 'hermes'].includes(saved)) {
            return saved;
        }
        return 'gemini';
    });
    
// Extracted Features State (for Gemma deterministic extraction)
const [extractedFeatures, setExtractedFeatures] = useState(null); 

    // Resume State
    const [resumeText, setResumeText] = useState('');
    const [resumeFileName, setResumeFileName] = useState('');
    const [resumeParseError, setResumeParseError] = useState(null);
    const [resumePdfHealth, setResumePdfHealth] = useState(null);
    
    // Job Description State
    const [jobDescriptionText, setJobDescriptionText] = useState('');
    const [jobDescriptionFileName, setJobDescriptionFileName] = useState('');
    const [jobDescriptionParseError, setJobDescriptionParseError] = useState(null);
    
    // Email State
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    
    // Recruiter Leniency Mode
    const { 
        mode: leniencyMode,
        setMode: setLeniencyMode,
        showStrictTooltip,
        showVeryStrictModal,
        acknowledgeVeryStrict,
        dismissVeryStrictModal,
        resetAcknowledgment,
        isVeryStrict,
        isStrict,
        isLenient,
        isNormal
    } = useLeniencyMode();

    // ============================================================
    // HIDDEN BRIEF INTEGRATION - NEW CODE
    // ============================================================
    const {
        analysis: hiddenBriefAnalysis,
        loading: hiddenBriefLoading,
        error: hiddenBriefError,
        transformingBullets: hbTransformingBullets,
        transformingSummary: hbTransformingSummary,
        generatingReport: hbGeneratingReport,  // ADDED
        analyze: analyzeHiddenBrief,
        transformBullets: transformBulletsWithHB,
        transformSummary: transformSummaryWithHB,
        generateReport: generateHBReport       // ADDED
    } = useHiddenBrief();

    // Track whether hidden brief has been triggered for this JD/resume
    const [hiddenBriefTriggered, setHiddenBriefTriggered] = useState(false);

    // ============================================================
    // DEBUG: HIDDEN BRIEF TRIGGER CHECK WITH LOGS
    // ============================================================
    useEffect(() => {
        console.log('🔍 HIDDEN BRIEF TRIGGER CHECK:', {
            resultExists: !!result,
            isComparisonMode,
            jdLength: jobDescriptionText?.trim().length,
            minRequired: 500,
            jdValid: jobDescriptionText && jobDescriptionText.trim().length >= 500,
            hasAnalysis: !!hiddenBriefAnalysis,
            isLoading: hiddenBriefLoading,
            alreadyTriggered: hiddenBriefTriggered,
            willTrigger: (result && isComparisonMode && jobDescriptionText && jobDescriptionText.trim().length >= 500 && !hiddenBriefAnalysis && !hiddenBriefLoading && !hiddenBriefTriggered)
        });
        
        if (result && isComparisonMode && jobDescriptionText && jobDescriptionText.trim().length >= 500 && !hiddenBriefAnalysis && !hiddenBriefLoading && !hiddenBriefTriggered) {
            console.log('✅ TRIGGERING hidden brief analysis NOW');
            console.log('JD Preview (first 200 chars):', jobDescriptionText?.substring(0, 200));
            console.log('Resume length:', resumeText?.length);
            setHiddenBriefTriggered(true);
            analyzeHiddenBrief(jobDescriptionText, resumeText);
        } else {
            console.log('❌ Conditions not met for hidden brief trigger');
            if (!result) console.log('  - result is falsy');
            if (!isComparisonMode) console.log('  - not in comparison mode');
            if (!jobDescriptionText || jobDescriptionText.trim().length < 500) console.log('  - JD missing or too short');
            if (hiddenBriefAnalysis) console.log('  - already have analysis');
            if (hiddenBriefLoading) console.log('  - already loading');
            if (hiddenBriefTriggered) console.log('  - already triggered');
        }
    }, [result, isComparisonMode, jobDescriptionText, resumeText, hiddenBriefAnalysis, hiddenBriefLoading, hiddenBriefTriggered, analyzeHiddenBrief]);

    // Trigger hidden brief analysis after main analysis completes
    useEffect(() => {
        if (result && isComparisonMode && jobDescriptionText && jobDescriptionText.trim().length >= 500 && !hiddenBriefAnalysis && !hiddenBriefLoading && !hiddenBriefTriggered) {
            setHiddenBriefTriggered(true);
            analyzeHiddenBrief(jobDescriptionText, resumeText);
        }
    }, [result, isComparisonMode, jobDescriptionText, resumeText, hiddenBriefAnalysis, hiddenBriefLoading, hiddenBriefTriggered, analyzeHiddenBrief]);

    // Handler for applying hidden brief transformations to bullets
    const handleApplyHiddenBriefToBullets = useCallback(async () => {
        if (!hiddenBriefAnalysis || !jobDescriptionText || !result?.bullet_analysis?.bullets) {
            alert('Hidden brief analysis not available. Please ensure both JD and resume are loaded.');
            return;
        }
        
        const bullets = result.bullet_analysis.bullets.map(b => ({
            id: b.id,
            original_text: b.original_text,
            context: {
                role: b.role || null,
                company: b.company || null,
                section: b.section || null
            }
        }));
        
        const transformedBullets = await transformBulletsWithHB(
            jobDescriptionText,
            hiddenBriefAnalysis,
            bullets
        );
        
        if (transformedBullets) {
            setResult(prev => {
                if (!prev) return prev;
                
                const updatedBullets = prev.bullet_analysis.bullets.map(originalBullet => {
                    const matching = transformedBullets.find(tb => tb.id === originalBullet.id);
                    if (matching) {
                        return {
                            ...originalBullet,
                            hb_transformed_text: matching.transformed_text
                        };
                    }
                    return originalBullet;
                });
                
                return {
                    ...prev,
                    bullet_analysis: {
                        ...prev.bullet_analysis,
                        bullets: updatedBullets
                    }
                };
            });
        }
    }, [hiddenBriefAnalysis, jobDescriptionText, result, transformBulletsWithHB]);

    // Handler for applying hidden brief transformations to summary
    const handleApplyHiddenBriefToSummary = useCallback(async () => {
        if (!hiddenBriefAnalysis || !jobDescriptionText) {
            alert('Hidden brief analysis not available. Please ensure both JD and resume are loaded.');
            return;
        }
        
        const originalSummary = result?.summary_analysis?.original_text || '';
        
        const transformedSummary = await transformSummaryWithHB(
            jobDescriptionText,
            hiddenBriefAnalysis,
            originalSummary
        );
        
        if (transformedSummary) {
            setResult(prev => {
                if (!prev) return prev;
                
                return {
                    ...prev,
                    summary_analysis: {
                        ...prev.summary_analysis,
                        hb_transformed_summary: transformedSummary
                    }
                };
            });
        }
    }, [hiddenBriefAnalysis, jobDescriptionText, result, transformSummaryWithHB]);

    // ============================================================
    // NEW: Handler for downloading hidden brief report
    // ============================================================
    const handleDownloadHBReport = useCallback(async () => {
        if (!hiddenBriefAnalysis || !jobDescriptionText) {
          alert('Hidden brief analysis not available.');
          return;
        }
        
        const result = await generateHBReport(jobDescriptionText, resumeText, hiddenBriefAnalysis);
        
        if (result.report_html) {
          // Attempt to open in new tab for easy "Print to PDF"
          const newTab = window.open('', '_blank');
          if (newTab) {
            newTab.document.write(result.report_html);
            newTab.document.close();
          } else {
            // POP-UP BLOCKER FALLBACK: Download as an HTML file directly
            const blob = new Blob([result.report_html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `veritas-hidden-brief-${Date.now()}.html`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } else {
          alert('Failed to generate report. Please try again.');
        }
      }, [hiddenBriefAnalysis, jobDescriptionText, resumeText, generateHBReport]);
    // ============================================================
    // END HIDDEN BRIEF INTEGRATION
    // ============================================================

    // Dark Mode Effect
    useEffect(() => {
        if (darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('veritas-dark-mode', 'true');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('veritas-dark-mode', 'false');
        }
    }, [darkMode]);

    // Save model type preference for Normal mode
    useEffect(() => {
        localStorage.setItem('veritas_model_type', modelType);
    }, [modelType]);

    // Save Hermes model type preference for Strict/Very Strict/Lenient modes
    useEffect(() => {
        localStorage.setItem('veritas_hermes_model_type', hermesModelType);
    }, [hermesModelType]);

    // Debug toggle
    const toggleDebug = () => setShowDebug(!showDebug);
    
    // Dismiss ATS warning
    const dismissWarning = () => {
        setShowWarning(false);
    };

    // SINGLE CALL FILE UPLOAD HANDLER - ONE Azure call for both text AND issues
    const handleResumeFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setResumeParseError('File too large (Max 10MB)');
            return;
        }
        
        // Store file for ATS Eye View
        setPdfFile(file);
        setShowWarning(true);
        
        setResumeFileName(file.name);
        setResumeParseError(null);
        setLoading(true);
        setExtractionStage(true);
        setAnalysisStage('📄 Extracting text from your document...');
        
        try {
            let extractedText = '';
            let pdfHealth = null;
            let pdfIssuesData = null;
            
            if (file.name.endsWith('.txt')) {
                setAnalysisStage('📄 Reading text file...');
                extractedText = await file.text();
            } else if (file.name.endsWith('.pdf')) {
                setAnalysisStage('📄 Processing PDF with Azure Document Intelligence...');
                
                // ONE CALL to Azure - gets BOTH text AND issues
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('https://ats-parser.keron62.workers.dev/azure', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'PDF processing failed');
                }
                
                // Get both from the same response
                extractedText = data.text || '';
                pdfIssuesData = data.issues || null;
                
                // Create pdfHealth from the response data
                pdfHealth = {
                    issues: pdfIssuesData || [],
                    pageCount: data.pages || 1,
                    textLength: extractedText.length,
                    fileSize: file.size,
                    pdf_health_score: data.pdf_health_score,
                    pdf_health_label: data.pdf_health_label
                };
                
                // Set issues for ATS Eye View warning (only if critical issues exist)
                if (pdfIssuesData && pdfIssuesData.length > 0) {
                    const hasCriticalIssues = pdfIssuesData.some(i => i.severity === 'critical');
                    if (hasCriticalIssues) {
                        setPdfIssues(pdfIssuesData);
                    }
                }
                
            } else if (file.name.endsWith('.docx')) {
                setAnalysisStage('📄 Extracting text from Word document...');
                extractedText = await extractDocx(file);
            }
            
            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Not enough text found in file.');
            }
            
            setResumeText(extractedText);
            setResumePdfHealth(pdfHealth);
            setAnalysisStage('✅ Text extracted successfully! Ready to analyze.');
            setTimeout(() => setExtractionStage(false), 1000);
            
        } catch (err) {
            setResumeParseError(err.message);
            setExtractionStage(false);
        } finally {
            setLoading(false);
        }
    };

    const handleJobDescriptionFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setJobDescriptionParseError('File too large (Max 10MB)');
            return;
        }
        setJobDescriptionFileName(file.name);
        setJobDescriptionParseError(null);
        setLoading(true);
        setExtractionStage(true);
        setAnalysisStage('📄 Extracting text from job description...');
        
        try {
            let extractedText = '';
            if (file.name.endsWith('.txt')) {
                extractedText = await file.text();
            } else if (file.name.endsWith('.pdf')) {
                // For JD, we still need PDF parsing
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('https://ats-parser.keron62.workers.dev/azure', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'PDF processing failed');
                }
                extractedText = data.text || '';
            } else if (file.name.endsWith('.docx')) {
                extractedText = await extractDocx(file);
            }
            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Not enough text found in file.');
            }
            setJobDescriptionText(extractedText);
            setAnalysisStage('✅ Job description extracted! Ready to analyze.');
            setTimeout(() => setExtractionStage(false), 1000);
        } catch (err) {
            setJobDescriptionParseError(err.message);
            setExtractionStage(false);
        } finally {
            setLoading(false);
        }
    };

// Analysis Function - Routes based on modelType, hermesModelType, and leniencyMode
const analyzeResume = async () => {
    if (isAnalyzing) return;
    if (!resumeText.trim()) {
        alert('Please provide resume text or upload a file.');
        return;
    }
    if (isComparisonMode && !jobDescriptionText.trim()) {
        alert('Please provide a job description or switch to Standard Mode.');
        return;
    }
    
    // Reset hidden brief trigger for new analysis
    setHiddenBriefTriggered(false);
    
    setIsAnalyzing(true);
    setLoading(true);
    setAnalysisStage('🤖 Connecting to AI...');
    
    try {
        // Determine which worker to use based on modelType, hermesModelType, and leniencyMode
        let workerUrl;
        
        if (leniencyMode !== 'normal') {
            // Strict/Very Strict/Lenient modes
            if (hermesModelType === 'hermes') {
                // ============================================================
                // NEW: Gemma 3 27B Worker with Deterministic Extraction
                // ============================================================
                workerUrl = "https://open-router-leniency.keron62.workers.dev/analyze";
                
                // Step 1: Run deterministic feature extraction
                setAnalysisStage('🔍 Analyzing your resume deterministically...');
                
                // Import the feature extractor (make sure this is imported at top of file)
                const { extractAllFeatures } = await import('./utils/featureExtractor.js');
                const { calculateRIASECDeterministic } = await import('./utils/riasec.js');
                
                // Extract all features from resume and JD
                const features = extractAllFeatures(
                    resumeText, 
                    isComparisonMode ? jobDescriptionText : null
                );
                
                // Add RIASEC calculation (deterministic)
                const riasec = calculateRIASECDeterministic(
                    resumeText, 
                    isComparisonMode ? jobDescriptionText : null,
                    false
                );
                features.riasec = riasec;
                
                // Store extracted features for debugging or hidden brief (optional)
                setExtractedFeatures(features);
                
                // Build payload with features instead of raw text
                const payload = { 
                    features: features, 
                    leniency_mode: leniencyMode 
                };
                
                // Step 2: Call Gemma worker for transformations
                setAnalysisStage('🤖 Transforming with Gemma 3 27B...');
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                
                // Step 3: Process results
                setAnalysisStage('📊 Processing your results...');
                
                // Merge deterministic scores with Gemma-generated content
                const mergedResult = {
                    // Deterministic scores from frontend
                    total_ats_score: features.ats_score,
                    ats_label: features.ats_label,
                    credibility_score: features.credibility_score,
                    credibility_label: features.credibility_label,
                    fit_score: features.jd_comparison?.fit_score || null,
                    risk_level: data.risk_level || 'Medium',
                    
                    // Semantic positioning
                    semantic_analysis: {
                        position_score: features.semantic_position,
                        alignment_score: features.semantic_alignment || 7,
                        detected_level: features.detected_level || features.seniority?.level,
                        position_label: features.semantic_label,
                        confidence: 85,
                        flags: [],
                        recommendations: []
                    },
                    
                    // Bloom analysis
                    bloom_analysis: {
                        average_bloom_level: features.bloom?.average_level || 3.5,
                        expected_bloom_level: features.seniority?.level === 'executive' ? 5.5 : 
                                              features.seniority?.level === 'senior' ? 4.5 : 3.5,
                        bloom_gap: (features.bloom?.average_level || 3.5) - (
                            features.seniority?.level === 'executive' ? 5.5 : 
                            features.seniority?.level === 'senior' ? 4.5 : 3.5
                        ),
                        bloom_assessment: features.bloom?.assessment || "Analysis complete",
                        bloom_multiplier: features.bloom?.multiplier || 1.0,
                        bullets_by_level: [],
                        flags: []
                    },
                    
                    // RIASEC (already calculated)
                    riasec: features.riasec,
                    
                    // Credibility analysis
                    credibility_analysis: features.credibility_flags || {
                        career_plausibility_flags: [],
                        education_title_flags: [],
                        metric_plausibility_flags: [],
                        acting_title_flags: [],
                        promotion_signals: []
                    },
                    
                    // Interview likelihood (calculate deterministically)
                    interview_likelihood_score: calculateInterviewLikelihood({
                        ats: features.ats_score,
                        fit: features.jd_comparison?.fit_score || 70,
                        credibility: features.credibility_score,
                        alignment: features.semantic_alignment || 7,
                        bloomMultiplier: features.bloom?.multiplier || 1.0,
                        semanticMultiplier: 1.0,
                        riasecMultiplier: features.riasec?.multiplier || 1.0,
                        leniencyMode: leniencyMode
                    }).score,
                    
                    // Bullet transformation (from Gemma)
                    bullet_analysis: data.bullet_analysis,
                    
                    // Summary analysis (from Gemma)
                    summary_analysis: data.summary_analysis,
                    
                    // Role matching (from Gemma)
                    role_match: data.role_match || [],
                    
                    // Extract missing keywords from features
                    missing_keywords: features.jd_comparison?.critical_keywords_missing || [],
                    missing_tools: [],
                    
                    // Grammar and metrics (from deterministic extraction)
                    grammar_issues: [],
                    weak_metrics_details: [],
                    suggested_rewrites: [],
                    metric_quality_breakdown: {
                        overall_score: features.metrics?.strength_score || 50,
                        bullets_assessed: features.bullet_count || 0,
                        weak_count: features.metrics?.weak_count || 0,
                        good_count: 0,
                        strong_count: features.metrics?.strong_count || 0
                    },
                    
                    // Market positioning
                    market_positioning: {
                        level: features.seniority?.level || 'Mid',
                        assessment: features.bloom?.assessment || "Analysis complete",
                        seniority_detected: features.seniority?.level || 'Mid-Level'
                    },
                    
                    // Strengths and issues
                    strengths: features.strengths || [],
                    all_issues: features.all_issues || [],
                    immediate_fixes: features.immediate_fixes || [],
                    buzzwords_detected: features.buzzwords_detected || [],
                    
                    // ATS breakdown
                    breakdown: features.ats_breakdown || {
                        header_contact: 8,
                        keyword_density: 15,
                        quantified_results: 12,
                        action_verbs: 10,
                        formatting_structure: 8,
                        skills_section: 8,
                        length_brevity: 4,
                        publications_projects: 2,
                        recruiter_scan_penalty: 0,
                        buzzword_repetition_penalty: 0
                    },
                    
                    // Leniency info
                    leniency_mode: leniencyMode,
                    leniency_note: data.leniency_note,
                    leniency_gate_results: data.leniency_gate_results || null,
                    
                    // Model info
                    model_used: "Gemma 3 27B + Deterministic Frontend",
                    worker_version: "1.0.0",
                    fallback_used: false
                };
                
                console.log('✅ Analysis complete, result set:', {
                    hasResult: !!mergedResult,
                    resultKeys: mergedResult ? Object.keys(mergedResult) : null,
                    hasBulletAnalysis: !!mergedResult?.bullet_analysis,
                    hasSummaryAnalysis: !!mergedResult?.summary_analysis
                });
                
                setResult(mergedResult);
                
            } else {
                // ============================================================
                // EXISTING: Recruiter Leniency Worker (Gemini)
                // ============================================================
                workerUrl = "https://recruiter-leniency.keron62.workers.dev";
                
                const payload = { 
                    resumeText, 
                    leniency_mode: leniencyMode 
                };
                if (isComparisonMode) payload.jobDescriptionText = jobDescriptionText;
                
                setAnalysisStage('🧠 AI is analyzing your resume (20-30 seconds)...');
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                
                setAnalysisStage('📊 Processing your results...');
                const safeResult = createSafeResult(data.result || data, resumePdfHealth);
                
                console.log('✅ Analysis complete, result set:', {
                    hasResult: !!safeResult,
                    resultKeys: safeResult ? Object.keys(safeResult) : null,
                    hasBulletAnalysis: !!safeResult?.bullet_analysis,
                    hasSummaryAnalysis: !!safeResult?.summary_analysis
                });
                
                setResult(safeResult);
            }
            
        } else if (modelType === 'dual') {
            // ============================================================
            // EXISTING: Normal mode with GPT-OSS (Comparison Mode only)
            // ============================================================
            if (!isComparisonMode) {
                workerUrl = "https://ats-resume-only.keron62.workers.dev";
            } else {
                workerUrl = "https://groq-bloom.keron62.workers.dev";
            }
            
            const payload = { resumeText };
            if (isComparisonMode) payload.jobDescriptionText = jobDescriptionText;
            
            setAnalysisStage('🧠 AI is analyzing your resume (20-30 seconds)...');
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            setAnalysisStage('📊 Processing your results...');
            const safeResult = createSafeResult(data.result || data, resumePdfHealth);
            
            console.log('✅ Analysis complete, result set:', {
                hasResult: !!safeResult,
                resultKeys: safeResult ? Object.keys(safeResult) : null,
                hasBulletAnalysis: !!safeResult?.bullet_analysis,
                hasSummaryAnalysis: !!safeResult?.summary_analysis
            });
            
            setResult(safeResult);
            
        } else {
            // ============================================================
            // EXISTING: Normal mode with Gemini (default)
            // ============================================================
            if (isComparisonMode) {
                workerUrl = "https://orchestrator.keron62.workers.dev";
            } else {
                workerUrl = "https://ats-resume-only.keron62.workers.dev";
            }
            
            const payload = { resumeText };
            if (isComparisonMode) payload.jobDescriptionText = jobDescriptionText;
            
            setAnalysisStage('🧠 AI is analyzing your resume (20-30 seconds)...');
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            setAnalysisStage('📊 Processing your results...');
            const safeResult = createSafeResult(data.result || data, resumePdfHealth);
            
            console.log('✅ Analysis complete, result set:', {
                hasResult: !!safeResult,
                resultKeys: safeResult ? Object.keys(safeResult) : null,
                hasBulletAnalysis: !!safeResult?.bullet_analysis,
                hasSummaryAnalysis: !!safeResult?.summary_analysis
            });
            
            setResult(safeResult);
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Analysis Error: ' + error.message);
    } finally {
        setLoading(false);
        setIsAnalyzing(false);
        setAnalysisStage('');
    }
};

// Helper function for interview likelihood calculation (add this outside analyzeResume)
const calculateInterviewLikelihood = ({ ats, fit, credibility, alignment, bloomMultiplier, semanticMultiplier, riasecMultiplier, leniencyMode }) => {
    let finalFit = fit;
    let finalCredibility = credibility;
    let finalAlignment = alignment;
    
    if (leniencyMode === 'very_strict') {
        finalFit = fit ? Math.round(fit * 0.82) : null;
        finalCredibility = Math.round(credibility * 0.82);
        finalAlignment = Math.round(alignment * 0.82);
    } else if (leniencyMode === 'strict') {
        finalFit = fit ? Math.round(fit * 0.90) : null;
        finalCredibility = Math.round(credibility * 0.90);
        finalAlignment = Math.round(alignment * 0.90);
    } else if (leniencyMode === 'lenient') {
        finalFit = fit ? Math.min(100, Math.round(fit * 1.10)) : null;
        finalCredibility = Math.min(100, Math.round(credibility * 1.10));
        finalAlignment = Math.min(10, Math.round(alignment * 1.10));
    }
    
    const qualityScore = (ats / 100) * ((finalFit ?? 50) / 100) * (finalCredibility / 100) * (finalAlignment / 10) * bloomMultiplier * semanticMultiplier * riasecMultiplier;
    const clamped = Math.min(0.99, Math.max(0.01, qualityScore));
    const likelihood = 25 * Math.exp(-3 * (1 - clamped));
    const finalScore = Math.round(likelihood);
    
    return { score: Math.min(25, Math.max(0, finalScore)) };
};

    const handleEmailSubmit = () => {
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }
        setEmailSent(true);
        alert('Full report will be sent to: ' + email);
    };

    const resetApp = () => {
        setResult(null);
        setResumeText('');
        setResumeFileName('');
        setResumeParseError(null);
        setResumePdfHealth(null);
        setJobDescriptionText('');
        setJobDescriptionFileName('');
        setJobDescriptionParseError(null);
        setEmail('');
        setEmailSent(false);
        setRawApiResponse(null);
        setShowDebug(false);
        setPdfIssues(null);
        setPdfFile(null);
        setShowWarning(true);
        // Reset hidden brief state
        setHiddenBriefTriggered(false);
    };

    // Helper to check if data exists in raw response
    const debugFieldCheck = (field) => {
        if (!rawApiResponse) return 'No data';
        if (rawApiResponse[field]) return `${rawApiResponse[field].length} items`;
        if (rawApiResponse.result?.[field]) return `${rawApiResponse.result[field].length} items`;
        return 'MISSING';
    };

    // Helper to check if JD is long enough for hidden brief
    const isJDlongEnough = jobDescriptionText && jobDescriptionText.trim().length >= 500;

    return (
        <div className="container">
            <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

            {!result && !loading && (
                <FileUploadSection 
                    isComparisonMode={isComparisonMode} 
                    setIsComparisonMode={setIsComparisonMode}
                    resumeText={resumeText} 
                    setResumeText={setResumeText}
                    handleResumeFileUpload={handleResumeFileUpload}
                    resumeFileName={resumeFileName} 
                    resumeParseError={resumeParseError}
                    jobDescriptionText={jobDescriptionText} 
                    setJobDescriptionText={setJobDescriptionText}
                    handleJobDescriptionFileUpload={handleJobDescriptionFileUpload}
                    jobDescriptionFileName={jobDescriptionFileName} 
                    jobDescriptionParseError={jobDescriptionParseError}
                    analyzeResume={analyzeResume} 
                    isAnalyzing={isAnalyzing}
                    pdfIssues={showWarning ? pdfIssues : null}
                    pdfFile={pdfFile}
                    onDismissWarning={dismissWarning}
                    leniencyMode={leniencyMode}
                    setLeniencyMode={setLeniencyMode}
                    showStrictTooltip={showStrictTooltip}
                    modelType={modelType}
                    setModelType={setModelType}
                    hermesModelType={hermesModelType}
                    setHermesModelType={setHermesModelType}
                />
            )}

            {loading && (
                <LoadingTips 
                    analysisStage={analysisStage} 
                    extractionStage={extractionStage}
                />
            )}

            {result && !loading && (
                <div className="results-container card">
                    {/* ATS Eye View Warning - shows at top of results if critical issues exist */}
                    {pdfIssues && pdfIssues.length > 0 && showWarning && (
                        <ATSEyeViewWarning 
                            pdfIssues={pdfIssues}
                            pdfFile={pdfFile}
                            onDismiss={dismissWarning}
                        />
                    )}
                    
                    {/* Leniency Mode Indicator - shows which mode was used */}
                    {leniencyMode !== 'normal' && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '12px 16px',
                            backgroundColor: leniencyMode === 'very_strict' ? 'rgba(196, 30, 58, 0.1)' : 
                                         leniencyMode === 'strict' ? 'rgba(245, 158, 11, 0.1)' :
                                         'rgba(16, 185, 129, 0.1)',
                            borderLeft: `4px solid ${leniencyMode === 'very_strict' ? '#c41e3a' : 
                                                       leniencyMode === 'strict' ? '#f59e0b' : '#10b981'}`,
                            borderRadius: '4px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    fontSize: '20px'
                                }}>
                                    {leniencyMode === 'very_strict' ? '👑' : leniencyMode === 'strict' ? '⚡' : '🌱'}
                                </span>
                                <div>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        color: leniencyMode === 'very_strict' ? '#c41e3a' : 
                                               leniencyMode === 'strict' ? '#f59e0b' : '#10b981'
                                    }}>
                                        {leniencyMode === 'very_strict' ? 'VERY STRICT MODE' : 
                                         leniencyMode === 'strict' ? 'STRICT MODE' : 'LENIENT MODE'}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--text-muted)',
                                        marginTop: '2px'
                                    }}>
                                        {leniencyMode === 'very_strict' ? 'Elite recruiting simulation • Scores adjusted downward' : 
                                         leniencyMode === 'strict' ? 'Competitive industry standards • Scores adjusted downward' : 
                                         'Startup/NGO friendly • Scores adjusted upward'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Leniency Gate Results - shows banner message if gate failures exist */}
                            {result.leniency_gate_results?.banner_message && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: '#ef4444'
                                }}>
                                    ⚠️ {result.leniency_gate_results.banner_message}
                                </div>
                            )}
                            
                            {/* Leniency Gate Results - shows which gates failed */}
                            {result.leniency_gate_results?.failures_detected && result.leniency_gate_results.failures_detected.length > 0 && (
                                <div style={{
                                    marginTop: '8px',
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                }}>
                                    {result.leniency_gate_results.failures_detected.map((failure, idx) => (
                                        <span key={idx} style={{
                                            fontSize: '10px',
                                            padding: '2px 8px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            borderRadius: '12px',
                                            color: '#ef4444'
                                        }}>
                                            ❌ {failure.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <ScoreDashboard 
                        result={result} 
                        isComparisonMode={isComparisonMode}
                        recruiterVerdict={result.recruiter_scan_verdict}
                    />
                    
                    {/* ============================================================ */}
                    {/* HIDDEN BRIEF INTELLIGENCE CARD - NEW SECTION */}
                    {/* ============================================================ */}
                    {isComparisonMode && isJDlongEnough && (
                        <>
                            {hiddenBriefLoading && (
                                <div style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    textAlign: 'center',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 12px' }}></div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        🕵️ Analyzing job description for hidden insights...
                                    </p>
                                </div>
                            )}
                            
                            {hiddenBriefError && (
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '20px',
                                    border: '1px solid #ef4444'
                                }}>
                                    <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
                                        ⚠️ Hidden brief analysis failed: {hiddenBriefError}
                                    </p>
                                </div>
                            )}
                            
                            {hiddenBriefAnalysis && (
                                <HiddenBriefCard 
                                    hiddenBrief={hiddenBriefAnalysis}
                                    onApplyToBullets={handleApplyHiddenBriefToBullets}
                                    onApplyToSummary={handleApplyHiddenBriefToSummary}
                                    isApplyingBullets={hbTransformingBullets}
                                    isApplyingSummary={hbTransformingSummary}
                                    onDownloadReport={handleDownloadHBReport}
                                    isGeneratingReport={hbGeneratingReport}
                                />
                            )}
                        </>
                    )}
                    
                    {/* Show note when JD is too short for hidden brief */}
                    {isComparisonMode && jobDescriptionText && jobDescriptionText.trim().length > 0 && jobDescriptionText.trim().length < 500 && (
                        <div style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            borderLeft: '3px solid #f59e0b'
                        }}>
                            <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>
                                💡 Job description is under 500 words. Hidden brief analysis requires at least 500 words for reliable insights.
                            </p>
                        </div>
                    )}
                    {/* ============================================================ */}
                    {/* END HIDDEN BRIEF SECTION */}
                    {/* ============================================================ */}
                    
                    {/* Summary Analyzer */}
                    {result.summary_analysis && (
                        <SummaryAnalyzer summaryAnalysis={result.summary_analysis} />
                    )}
                    
                    <RiasecSection riasec={result.riasec} isComparisonMode={isComparisonMode} />
                    
                    <SemanticSection 
                        semantic_analysis={result.semantic_analysis} 
                        role_type_detected={result.role_type_detected} 
                        isComparisonMode={isComparisonMode} 
                    />
                    
                    <CredibilitySection 
                        credibility_score={result.credibility_score} 
                        credibility_analysis={result.credibility_analysis} 
                    />
                    
                    {/* Executive Evaluation - shows only when executive modifier is active */}
                    <ExecutiveEvaluation 
                        executiveEvaluation={result.executive_evaluation} 
                        executiveActive={result.executive_modifier_active} 
                    />
                    
                    <BloomSection 
                        bloom_analysis={result.bloom_analysis} 
                        isComparisonMode={isComparisonMode}
                        bloomFlags={result.bloom_analysis?.flags}
                    />
                    
                    <IssuesList 
                        grammar_issues={result.grammar_issues}
                        missing_tools={result.missing_tools}
                        weak_metrics_details={result.weak_metrics_details}
                        suggested_rewrites={result.suggested_rewrites}
                    />
                    
                    {/* Bullet Analyzer - NEW COMPONENT */}
                    {result.bullet_analysis && (
                        <BulletAnalyzer 
                            bulletAnalysis={result.bullet_analysis} 
                            isComparisonMode={isComparisonMode}
                        />
                    )}
                    
                  {/* Skill Extractor - NEW COMPONENT */}
{result.skill_extractor && (
    <SkillExtractor 
        skillExtractor={result.skill_extractor}
        jdText={jobDescriptionText}
        resumeText={resumeText}
    />
)}
                    
                    <div className="results-grid">
                        <StrengthsAndKeywords 
                            strengths={result.strengths}
                            market_positioning={result.market_positioning}
                            missing_keywords={result.missing_keywords}
                            role_adjustment_note={result.role_adjustment_note}
                        />
                        <RoleMatches 
                            role_match={result.role_match}
                            total_ats_score={result.total_ats_score}
                            position_score={result.semantic_analysis?.position_score || 0}
                            immediate_fixes={result.immediate_fixes}
                        />
                    </div>
                    
                    <AllIssuesTable all_issues={result.all_issues} />
                    
                    <MetricQuality metric_quality_breakdown={result.metric_quality_breakdown} />
                    
                    <ScoreBreakdown 
                        breakdown={result.breakdown}
                        buzzwordsDetected={result.buzzwords_detected}
                    />
                    
                    <EmailCapture 
                        email={email}
                        setEmail={setEmail}
                        emailSent={emailSent}
                        handleEmailSubmit={handleEmailSubmit}
                    />
                    
                    {/* Debug Button Panel (Model Toggle removed from here - now in FileUploadSection) */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button 
                                onClick={toggleDebug}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-muted)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                {showDebug ? 'Hide Debug Info' : '🐛 Show Debug Info'}
                            </button>
                            
                            {/* Reset Leniency Acknowledgment Button */}
                            <button 
                                onClick={resetAcknowledgment}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--text-muted)',
                                    color: 'var(--text-muted)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reset Leniency
                            </button>
                            
                            {/* ============================================================ */}
                            {/* DEBUG MANUAL TEST BUTTON - ADDED FOR HIDDEN BRIEF DEBUGGING */}
                            {/* ============================================================ */}
                            {result && isComparisonMode && (
                                <button 
                                    onClick={() => {
                                        console.log('🐛 MANUAL TRIGGER - JD length:', jobDescriptionText?.length);
                                        console.log('🐛 JD preview (first 200 chars):', jobDescriptionText?.substring(0, 200));
                                        console.log('🐛 Resume length:', resumeText?.length);
                                        console.log('🐛 Current hidden brief state:', {
                                            hasAnalysis: !!hiddenBriefAnalysis,
                                            isLoading: hiddenBriefLoading,
                                            alreadyTriggered: hiddenBriefTriggered
                                        });
                                        analyzeHiddenBrief(jobDescriptionText, resumeText);
                                    }}
                                    style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🐛 Test Hidden Brief
                                </button>
                            )}
                            {/* ============================================================ */}
                            {/* END DEBUG MANUAL TEST BUTTON */}
                            {/* ============================================================ */}
                        </div>
                        
                        {showDebug && rawApiResponse && (
                            <div style={{
                                marginTop: '15px',
                                padding: '15px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-light)',
                                textAlign: 'left',
                                overflowX: 'auto'
                            }}>
                                <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                    🔍 Raw API Response
                                </h4>
                                <pre style={{
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    backgroundColor: 'var(--bg-secondary)',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {JSON.stringify(rawApiResponse, null, 2)}
                                </pre>
                                
                                <div style={{ marginTop: '15px' }}>
                                    <h5 style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                                        📋 Key Fields Check:
                                    </h5>
                                    <ul style={{ fontSize: '11px', listStyle: 'none', paddingLeft: '0' }}>
                                        <li>📌 all_issues: {debugFieldCheck('all_issues')}</li>
                                        <li>📌 immediate_fixes: {debugFieldCheck('immediate_fixes')}</li>
                                        <li>📌 strengths: {debugFieldCheck('strengths')}</li>
                                        <li>📌 missing_tools: {debugFieldCheck('missing_tools')}</li>
                                        <li>📌 grammar_issues: {debugFieldCheck('grammar_issues')}</li>
                                        <li>📌 weak_metrics_details: {debugFieldCheck('weak_metrics_details')}</li>
                                        <li>📌 suggested_rewrites: {debugFieldCheck('suggested_rewrites')}</li>
                                    </ul>
                                </div>
                                
                                <div style={{ marginTop: '15px' }}>
                                    <h5 style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                                        🔧 Next Steps:
                                    </h5>
                                    <ul style={{ fontSize: '11px', listStyle: 'none', paddingLeft: '0' }}>
                                        <li>• If field shows "MISSING" → Data is not in the response</li>
                                        <li>• If field shows "X items" but not displaying → Check component mapping</li>
                                        <li>• Take a screenshot of the raw JSON and share it</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={resetApp} 
                        className="analyze-btn" 
                        style={{ backgroundColor: 'var(--text-muted)', marginTop: '16px' }}
                    >
                        Scan Another Resume
                    </button>
                </div>
            )}
            
            {/* Very Strict Modal - shown when mode selected */}
            {showVeryStrictModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#fdfbf7',
                        borderRadius: '8px',
                        maxWidth: '560px',
                        width: '100%',
                        border: '1px solid #d1d1d1',
                        fontFamily: "'Playfair Display', 'Times New Roman', serif"
                    }}>
                        <div style={{
                            padding: '32px 32px 24px',
                            borderBottom: '1px solid #d1d1d1'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <span style={{ fontSize: '32px' }}>👑</span>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    letterSpacing: '-0.01em',
                                    margin: 0,
                                    fontFamily: "inherit"
                                }}>
                                    Very Strict Mode
                                </h2>
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#4a4a4a',
                                lineHeight: '1.5',
                                marginBottom: '8px'
                            }}>
                                Elite Recruiting Simulation
                            </p>
                        </div>
                        
                        <div style={{ padding: '24px 32px' }}>
                            <p style={{
                                fontSize: '13px',
                                color: '#1a1a1a',
                                lineHeight: '1.6',
                                marginBottom: '20px'
                            }}>
                                This mode simulates hiring practices at <strong>Fortune 500 companies</strong>, 
                                top-tier consulting firms (<strong>McKinsey, BCG, Bain</strong>), investment banks 
                                (<strong>Goldman Sachs, JPMorgan</strong>), and elite law firms.
                            </p>
                            
                            <div style={{
                                backgroundColor: '#f5f3ef',
                                padding: '20px',
                                marginBottom: '20px',
                                borderLeft: '3px solid #c41e3a'
                            }}>
                                <p style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#c41e3a',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    What to expect:
                                </p>
                                <ul style={{
                                    fontSize: '12px',
                                    color: '#4a4a4a',
                                    lineHeight: '1.8',
                                    paddingLeft: '20px',
                                    margin: 0
                                }}>
                                    <li>Scores will be <strong>20-30% LOWER</strong> than Normal mode</li>
                                    <li>Feedback will be <strong>direct, harsh, and uncompromising</strong></li>
                                    <li>Minor gaps and missing keywords will be <strong>heavily penalized</strong></li>
                                    <li>Elite university credentials provide scoring offsets</li>
                                    <li>Executive-level candidates (9+ years) receive exceptions</li>
                                </ul>
                            </div>
                            
                            <div style={{
                                backgroundColor: '#fdfbf7',
                                padding: '16px',
                                border: '1px solid #e8e5df',
                                marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <span style={{ fontSize: '20px' }}>⚠️</span>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#6b6b6b',
                                        lineHeight: '1.4',
                                        margin: 0
                                    }}>
                                        <strong>This is not a bug.</strong> This is an accurate simulation of 
                                        elite recruiting practices. Only use this mode if you are targeting 
                                        top-tier employers.
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={acknowledgeVeryStrict}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: '#1a1a1a',
                                    color: '#fdfbf7',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    letterSpacing: '0.5px',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    marginBottom: '12px',
                                    fontFamily: 'inherit'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#c41e3a'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                            >
                                I Understand - Proceed
                            </button>
                            
                            <button
                                onClick={dismissVeryStrictModal}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: 'transparent',
                                    color: '#6b6b6b',
                                    border: '1px solid #d1d1d1',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit'
                                }}
                            >
                                Cancel - Return to Normal Mode
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
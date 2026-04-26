import React, { useState, useEffect } from 'react';
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
import { extractDocx } from './utils/parseHelpers.js';
import { createSafeResult } from './utils/helpers.js';

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

    // Analysis Function
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
        
        setIsAnalyzing(true);
        setLoading(true);
        setAnalysisStage('🤖 Connecting to AI...');
        
        try {
            const workerUrl = isComparisonMode 
                ? "https://orchestrator.keron62.workers.dev" 
                : "https://ats-resume-only.keron62.workers.dev";
            
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
            
            // Store raw response for debugging
            setRawApiResponse(data);
            
            setAnalysisStage('📊 Processing your results...');
            const safeResult = createSafeResult(data.result || data, resumePdfHealth);
            setResult(safeResult);
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis Error: ' + error.message);
        } finally {
            setLoading(false);
            setIsAnalyzing(false);
            setAnalysisStage('');
        }
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
    };

    // Helper to check if data exists in raw response
    const debugFieldCheck = (field) => {
        if (!rawApiResponse) return 'No data';
        if (rawApiResponse[field]) return `${rawApiResponse[field].length} items`;
        if (rawApiResponse.result?.[field]) return `${rawApiResponse.result[field].length} items`;
        return 'MISSING';
    };

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
                    
                    <ScoreDashboard result={result} isComparisonMode={isComparisonMode} />
                    
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
                    
                    <BloomSection bloom_analysis={result.bloom_analysis} isComparisonMode={isComparisonMode} />
                    
                    <IssuesList 
                        grammar_issues={result.grammar_issues}
                        missing_tools={result.missing_tools}
                        weak_metrics_details={result.weak_metrics_details}
                        suggested_rewrites={result.suggested_rewrites}
                    />
                    
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
                    
                    <ScoreBreakdown breakdown={result.breakdown} />
                    
                    <EmailCapture 
                        email={email}
                        setEmail={setEmail}
                        emailSent={emailSent}
                        handleEmailSubmit={handleEmailSubmit}
                    />
                    
                    {/* Debug Button and Panel */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                        <button 
                            onClick={toggleDebug}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--text-muted)',
                                color: 'var(--text-muted)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            {showDebug ? 'Hide Debug Info' : '🐛 Show Debug Info'}
                        </button>
                        
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
        </div>
    );
}
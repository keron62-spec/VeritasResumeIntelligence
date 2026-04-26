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
import { parsePDF, extractDocx, analyzePDFHealth } from './utils/parseHelpers.js';
import { createSafeResult } from './utils/helpers.js';

export default function App() {
    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('veritas-dark-mode') === 'true');
    
    // Mode & UI State
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStage, setAnalysisStage] = useState('');
    const [result, setResult] = useState(null);
    
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

    // File Upload Handlers
    const handleResumeFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setResumeParseError('File too large (Max 10MB)');
            return;
        }
        setResumeFileName(file.name);
        setResumeParseError(null);
        setLoading(true);
        try {
            let extractedText = '';
            let pdfHealth = null;
            if (file.name.endsWith('.txt')) {
                extractedText = await file.text();
            } else if (file.name.endsWith('.pdf')) {
                const { pdf, fullText } = await parsePDF(file);
                extractedText = fullText;
                pdfHealth = await analyzePDFHealth(pdf, file.size);
            } else if (file.name.endsWith('.docx')) {
                extractedText = await extractDocx(file);
            }
            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Not enough text found in file.');
            }
            setResumeText(extractedText);
            setResumePdfHealth(pdfHealth);
        } catch (err) {
            setResumeParseError(err.message);
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
        try {
            let extractedText = '';
            if (file.name.endsWith('.txt')) {
                extractedText = await file.text();
            } else if (file.name.endsWith('.pdf')) {
                const { fullText } = await parsePDF(file);
                extractedText = fullText;
            } else if (file.name.endsWith('.docx')) {
                extractedText = await extractDocx(file);
            }
            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Not enough text found in file.');
            }
            setJobDescriptionText(extractedText);
        } catch (err) {
            setJobDescriptionParseError(err.message);
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
        setAnalysisStage('Connecting to AI...');
        
        try {
            const workerUrl = isComparisonMode 
                ? "https://orchestrator.keron62.workers.dev" 
                : "https://ats-resume-only.keron62.workers.dev";
            
            const payload = { resumeText };
            if (isComparisonMode) payload.jobDescriptionText = jobDescriptionText;
            
            setAnalysisStage('Analyzing with AI (this takes 20-30 seconds)...');
            const response = await fetch(workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
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
                />
            )}

            {loading && (
                <div className="loading card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner"></div>
                    <h2>{analysisStage}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Our multiple LLMs are evaluating your resume...</p>
                </div>
            )}

            {result && !loading && (
                <div className="results-container card">
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
                    
                    <button 
                        onClick={resetApp} 
                        className="analyze-btn" 
                        style={{ backgroundColor: 'var(--text-muted)', marginTop: '24px' }}
                    >
                        Scan Another Resume
                    </button>
                </div>
            )}
        </div>
    );
}
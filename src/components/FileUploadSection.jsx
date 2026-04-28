import React from 'react';
import { Icons } from '../assets/icons';
import RecruiterLeniencyToggle from './RecruiterLeniencyToggle.jsx';
import ModelToggle from './ModelToggle.jsx';

export default function FileUploadSection({ 
    isComparisonMode, setIsComparisonMode, 
    resumeText, setResumeText, handleResumeFileUpload, resumeFileName, resumeParseError,
    jobDescriptionText, setJobDescriptionText, handleJobDescriptionFileUpload, jobDescriptionFileName, jobDescriptionParseError,
    analyzeResume, isAnalyzing,
    // New props for Recruiter Leniency
    leniencyMode,
    setLeniencyMode,
    showStrictTooltip,
    // New props for Model Toggle
    modelType,
    setModelType
}) {
    return (
        <div className="card">
            <div className="mode-switch-container">
                <div className="mode-switch">
                    <button className={`mode-option ${!isComparisonMode ? 'active' : ''}`} onClick={() => setIsComparisonMode(false)}>📄 Standard Mode</button>
                    <button className={`mode-option ${isComparisonMode ? 'active' : ''}`} onClick={() => setIsComparisonMode(true)}>🎯 Compare with Job Description</button>
                </div>
            </div>

            {/* Recruiter Leniency Toggle */}
            <RecruiterLeniencyToggle 
                mode={leniencyMode}
                setMode={setLeniencyMode}
                showStrictTooltip={showStrictTooltip}
            />

            {/* Model Toggle - Only show in Normal mode (not Strict/Very Strict/Lenient) */}
            {leniencyMode === 'normal' && (
                <ModelToggle modelType={modelType} setModelType={setModelType} />
            )}

            {!isComparisonMode ? (
                <div>
                    <div className="input-panel">
                        <h3><Icons.Document /> Resume</h3>
                        <textarea placeholder="Paste your resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={12} />
                        <div className="file-upload-area" onClick={() => document.getElementById('resume-file-upload').click()}>
                            <div className="file-upload-icon">📁</div>
                            <div>Upload Resume (.txt, .pdf, .docx)</div>
                            <input type="file" accept=".txt,.pdf,.docx" onChange={handleResumeFileUpload} id="resume-file-upload" />
                            {resumeFileName && <div className="file-name">{resumeFileName}</div>}
                        </div>
                        {resumeParseError && <div className="parse-error">{resumeParseError}</div>}
                        {resumeText && !resumeParseError && <div className="success-message">Resume loaded. {resumeText.length} characters.</div>}
                    </div>
                    <button className="analyze-btn" onClick={analyzeResume} disabled={!resumeText || isAnalyzing}>
                        {isAnalyzing ? 'Analyzing...' : 'Analyze My Resume'}
                    </button>
                </div>
            ) : (
                <div>
                    <div className="dual-input-grid">
                        <div className="input-panel">
                            <h3><Icons.Document /> Resume</h3>
                            <textarea placeholder="Paste your resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={10} />
                            <div className="file-upload-area" onClick={() => document.getElementById('resume-file-upload-compare').click()}>
                                <div className="file-upload-icon">📁</div>
                                <div>Upload Resume</div>
                                <input type="file" accept=".txt,.pdf,.docx" onChange={handleResumeFileUpload} id="resume-file-upload-compare" />
                                {resumeFileName && <div className="file-name">{resumeFileName}</div>}
                            </div>
                            {resumeParseError && <div className="parse-error">{resumeParseError}</div>}
                        </div>
                        <div className="input-panel">
                            <h3><Icons.Document /> Job Description</h3>
                            <textarea placeholder="Paste the job description here..." value={jobDescriptionText} onChange={(e) => setJobDescriptionText(e.target.value)} rows={10} />
                            <div className="file-upload-area" onClick={() => document.getElementById('jd-file-upload').click()}>
                                <div className="file-upload-icon">📁</div>
                                <div>Upload Job Description</div>
                                <input type="file" accept=".txt,.pdf,.docx" onChange={handleJobDescriptionFileUpload} id="jd-file-upload" />
                                {jobDescriptionFileName && <div className="file-name">{jobDescriptionFileName}</div>}
                            </div>
                            {jobDescriptionParseError && <div className="parse-error">{jobDescriptionParseError}</div>}
                        </div>
                    </div>
                    <button className="analyze-btn" onClick={analyzeResume} disabled={!resumeText || !jobDescriptionText || isAnalyzing} style={{ marginTop: '30px' }}>
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume Against Job Description'}
                    </button>
                </div>
            )}
        </div>
    );
}
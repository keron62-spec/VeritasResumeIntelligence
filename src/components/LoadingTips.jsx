import React, { useState, useEffect } from 'react';

// Collection of rotating tips
const TIPS = [
    { category: "ATS", text: "ATS systems prefer single-column layouts over multi-column designs." },
    { category: "ATS", text: "Use standard section headers: EXPERIENCE, SKILLS, EDUCATION for best ATS parsing." },
    { category: "ATS", text: "Avoid tables, text boxes, and graphics - ATS software can't read them." },
    { category: "ATS", text: "Submit as .docx when possible - it's the most ATS-friendly format." },
    { category: "Resume", text: "Every bullet point should include a metric: %, $, or volume." },
    { category: "Resume", text: "Start bullets with strong action verbs: Led, Built, Architected, Drove." },
    { category: "Resume", text: "Quantify results: 'Reduced from 5 days to 24 hours' beats 'Improved efficiency'." },
    { category: "Resume", text: "Include both WHAT you did AND the OUTCOME for each achievement." },
    { category: "RIASEC", text: "Your RIASEC code reveals your natural work style and ideal role fit." },
    { category: "RIASEC", text: "Social (S) types thrive in collaborative, helping, and teaching roles." },
    { category: "RIASEC", text: "Enterprising (E) types excel at leading, persuading, and selling." },
    { category: "RIASEC", text: "Investigative (I) types love data, research, and analytical problem-solving." },
    { category: "Bloom", text: "Higher Bloom scores = more strategic thinking and complex problem-solving." },
    { category: "Bloom", text: "Executive roles need Create/Evaluate level (5-6) on Bloom's Taxonomy." },
    { category: "Bloom", text: "Entry-level roles need Remember/Understand level (1-2) on Bloom's Taxonomy." },
    { category: "Veritas", text: "Try Comparison Mode to see how well you match specific job descriptions." },
    { category: "Veritas", text: "Dark mode is available in the top-right corner for comfortable viewing." },
    { category: "Veritas", text: "Upload a job description with your resume for precise fit scoring." },
];

export default function LoadingTips({ analysisStage, extractionStage }) {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [fade, setFade] = useState(true);

    // Rotate tips every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
                setFade(true);
            }, 300);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const currentTip = TIPS[currentTipIndex];
    const isExtracting = extractionStage || analysisStage.includes('Extracting') || analysisStage.includes('Reading') || analysisStage.includes('Processing PDF');

    return (
        <div className="loading card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner"></div>
            
            <h2 style={{ marginTop: '20px', marginBottom: '8px', fontSize: '20px' }}>
                {analysisStage || (isExtracting ? '📄 Extracting text from your document...' : '🤖 Analyzing your resume...')}
            </h2>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                {isExtracting ? 'This usually takes 5-10 seconds' : 'This usually takes 20-30 seconds'}
            </p>
            
            <div 
                className="tips-container" 
                style={{ 
                    maxWidth: '500px', 
                    margin: '0 auto',
                    padding: '20px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    borderLeft: '3px solid var(--accent-blue)',
                    transition: 'opacity 0.3s ease',
                    opacity: fade ? 1 : 0
                }}
            >
                <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--accent-blue)', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    💡 {currentTip.category} TIP
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {currentTip.text}
                </div>
                <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    marginTop: '12px',
                    textAlign: 'center'
                }}>
                    Tip {currentTipIndex + 1} of {TIPS.length}
                </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginTop: '24px', fontSize: '12px' }}>
                Powered by 3 parallel Gemini LLMs with automatic failover
            </p>
        </div>
    );
}
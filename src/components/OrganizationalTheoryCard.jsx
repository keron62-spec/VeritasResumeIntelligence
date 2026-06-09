// src/components/OrganizationalTheoryCard.jsx
import React, { useState } from 'react';

// ============================================================
// HELPER COMPONENTS
// ============================================================

// Tooltip component for hover definitions
const InfoTooltip = ({ definition }) => {
    const [show, setShow] = useState(false);
    
    return (
        <div style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
            <span 
                style={{ 
                    cursor: 'help', 
                    fontSize: '11px', 
                    color: '#c9a84c',
                    background: 'rgba(201,168,76,0.15)',
                    width: '16px',
                    height: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                }}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            >
                ⓘ
            </span>
            {show && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #c9a84c',
                    borderRadius: '8px',
                    fontSize: '11px',
                    maxWidth: '240px',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    whiteSpace: 'normal',
                    color: '#e2e8f0'
                }}>
                    {definition}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #c9a84c'
                    }} />
                </div>
            )}
        </div>
    );
};

// Risk definition map
const RISK_DEFINITIONS = {
    "Political Hot Potato": "Problems get passed around instead of solved. You'll inherit issues that no one has the authority to fix. Decisions require multiple sign-offs with no clear owner.",
    "Consensus Trap": "Everyone must agree before anything moves. One person's 'no' can block all progress. Expect slow decisions and endless alignment meetings.",
    "Founder's Trap": "All decisions flow through the founder/CEO. When they're unavailable, nothing moves. Your success depends entirely on your relationship with them.",
    "Ghost Ship": "Leadership is unclear or in transition. No one knows who's steering the ship. Strategic direction may change suddenly or not exist at all.",
    "Catch-22 Role": "The JD asks for experience that's impossible to have (e.g., 8 years in a 3-year-old field). The hiring team may not understand what the role actually requires.",
    "Paper Tiger": "Your title sounds senior, but you have no real authority. You'll be accountable for outcomes without the budget, team, or decision-making power to deliver.",
    "Frankenrole": "The role combines unrelated functions that don't belong together. You'll be expected to do marketing, finance, HR, and operations — often with no support.",
    "High Turnover Risk": "This role has a history of burning people out. The previous person left quickly. Ask why.",
    "Burnout Trap": "The role is newly created with unrealistic expectations. You'll be building everything from scratch with no infrastructure or support.",
    "Glass Cliff": "You're being hired to 'turn things around' after a failure, but you won't have the authority to make real changes. Success is structurally unlikely.",
    "Mission Impossible": "The timeline is unrealistic given the approval processes. You'll be expected to deliver results faster than the organization can make decisions.",
    "Legacy Mess": "You're following someone who left behind unresolved problems. The role may have accumulated technical debt, broken processes, or unhappy stakeholders.",
    "Eternal Pilot": "This is a 'pilot' or 'interim' role with no clear path to permanence. It may end when funding runs out or the pilot concludes.",
    "Bait and Switch": "The job title and description don't match what the organization actually needs. You may be doing different work than advertised.",
    "Empty Suit": "The role exists to check a box (grant requirement, headcount quota) rather than solve an operational need. You may have little real impact.",
    "Siloed": "You'll work mostly with external partners, not internal teams. Limited visibility inside the organization.",
    "Treadmill": "High volume of activity, low measurable impact. You'll generate reports and track metrics that no one uses to make decisions."
};

// Theory definition map
const THEORY_DEFINITIONS = {
    "Cynefin": "How predictable or chaotic the problems in this role will be. Tells you whether you'll face routine challenges (follow the playbook) or unpredictable situations (figure it out as you go).",
    "Weber": "Where authority comes from — rules, hierarchy, or the founder's personality. Reveals how decisions actually get made. Rules-based = follow procedures. Founder-led = align with their vision.",
    "Mintzberg": "How the organization is structured — centralized, decentralized, or mission-driven. Shows whether you're joining a rigid machine (follow SOPs), a flexible startup (wear many hats), or a mission-driven organization.",
    "Garbage Can": "How chaotic and unpredictable decision-making is. Measures whether problems get solved, escalated, or passed around. High chaos = decisions are messy and unpredictable.",
    "POSDCORB": "How many management functions the role consolidates (Planning, Organizing, Staffing, Directing, Coordinating, Reporting, Budgeting). High overload = more hats, more stress, more risk of burnout.",
    "Punctuated Equilibrium": "Whether the organization is stable or in a period of change. Tells you if you're joining a stable environment or a transformation (expect flux, reorgs, and shifting priorities)."
};

// Collapsible risk card component
const CollapsibleRiskCard = ({ risk, severity, onToggle, isExpanded }) => {
    const severityIcon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '⚪';
    const severityLabel = severity === 'critical' ? 'CRITICAL' : severity === 'high' ? 'HIGH' : 'INFO';
    const badgeClass = `risk-${severity}`;
    const borderClass = `risk-${severity}-border`;
    
    const sourceBadge = risk.source ? 
        <span className="source-badge" style={{ fontSize: '9px', padding: '2px 6px', background: '#334155', borderRadius: '10px', marginLeft: '8px' }}>
            {risk.source.replace(/_/g, ' ')}
        </span> : '';
    
    const llmBadge = risk.llm_inference_override ? 
        <span className="llm-override-badge" style={{ fontSize: '9px', padding: '2px 6px', background: '#f59e0b', borderRadius: '10px', marginLeft: '8px' }}>
            🧠 LLM Override
        </span> : '';
    
    return (
        <div className={`risk-card ${borderClass}`} style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
            <div 
                onClick={onToggle}
                style={{ 
                    padding: '14px 16px', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    backgroundColor: 'var(--bg-tertiary)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '10px' }}>
                        {severityIcon} {severityLabel}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{risk.name}</strong>
                    {sourceBadge}
                    {llmBadge}
                    <InfoTooltip definition={RISK_DEFINITIONS[risk.name] || "Review this risk in the interview."} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isExpanded ? '▲' : '▼'}
                </span>
            </div>
            
            {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
                    {risk.score && (
                        <div className="metric-row" style={{ marginBottom: '8px' }}>
                            <span>Composite Score:</span>
                            <span><strong>{risk.score}/100</strong></span>
                        </div>
                    )}
                    <p style={{ fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
                        {risk.reasoning}
                    </p>
                    {risk.interview_question && (
                        <div className="interview-question" style={{ marginTop: '12px', padding: '12px', background: 'rgba(201,168,76,0.08)', borderRadius: '8px' }}>
                            <strong>❓ Ask in interview:</strong>
                            <div style={{ marginTop: '6px' }}>{typeof risk.interview_question === 'string' ? risk.interview_question : risk.interview_question.question}</div>
                            {risk.interview_question.red_flags && risk.interview_question.red_flags.length > 0 && (
                                <div className="answer-flags" style={{ marginTop: '10px' }}>
                                    <div style={{ color: '#f87171', marginBottom: '6px' }}>🚩 Red Flags (Concerning answers):</div>
                                    {risk.interview_question.red_flags.slice(0, 3).map(flag => (
                                        <div key={flag} className="red-flag-answer" style={{ marginLeft: '12px', fontSize: '11px' }}>• "{flag}"</div>
                                    ))}
                                </div>
                            )}
                            {risk.interview_question.green_flags && risk.interview_question.green_flags.length > 0 && (
                                <div className="answer-flags" style={{ marginTop: '10px' }}>
                                    <div style={{ color: '#4ade80', marginBottom: '6px' }}>✅ Green Flags (Good answers):</div>
                                    {risk.interview_question.green_flags.slice(0, 3).map(flag => (
                                        <div key={flag} className="green-flag-answer" style={{ marginLeft: '12px', fontSize: '11px' }}>• "{flag}"</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {risk.resume_framing_tip && (
                        <div className="resume-tip-box" style={{ marginTop: '12px', padding: '10px', background: 'rgba(139,92,246,0.1)', borderRadius: '6px' }}>
                            <strong>📝 Resume Tip:</strong> {risk.resume_framing_tip}
                        </div>
                    )}
                    {risk.temporal_note && (
                        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(6,182,212,0.1)', borderRadius: '6px', fontSize: '11px' }}>
                            ⏰ {risk.temporal_note}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Collapsible interview question component
const CollapsibleInterviewQuestion = ({ question, priority }) => {
    const [expanded, setExpanded] = useState(false);
    const priorityClass = priority === 'critical' ? 'critical-question' : (priority === 'high' ? 'high-question' : '');
    const priorityIcon = priority === 'critical' ? '🔴' : (priority === 'high' ? '🟠' : '📋');
    
    return (
        <div className={`interview-question ${priorityClass}`} style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
                onClick={() => setExpanded(!expanded)}
                style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-tertiary)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span>{priorityIcon}</span>
                    <strong style={{ fontSize: '13px', flex: 1 }}>{question.question}</strong>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
            </div>
            
            {expanded && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
                    {question.red_flags && question.red_flags.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ color: '#f87171', marginBottom: '6px', fontSize: '12px' }}>🚩 Red Flags (Concerning answers):</div>
                            {question.red_flags.map(flag => (
                                <div key={flag} className="red-flag-answer" style={{ marginLeft: '16px', fontSize: '11px', marginBottom: '4px' }}>• "{flag}"</div>
                            ))}
                        </div>
                    )}
                    {question.green_flags && question.green_flags.length > 0 && (
                        <div>
                            <div style={{ color: '#4ade80', marginBottom: '6px', fontSize: '12px' }}>✅ Green Flags (Good answers):</div>
                            {question.green_flags.map(flag => (
                                <div key={flag} className="green-flag-answer" style={{ marginLeft: '16px', fontSize: '11px', marginBottom: '4px' }}>• "{flag}"</div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OrganizationalTheoryCard({ otData }) {
    const [activeTab, setActiveTab] = useState('advisory');
    const [expandedRisks, setExpandedRisks] = useState({});
    
    if (!otData) return null;
    
    const toggleRisk = (riskName) => {
        setExpandedRisks(prev => ({ ...prev, [riskName]: !prev[riskName] }));
    };
    
    // Extract data
    const advisory = otData.advisory_report || {};
    const gap = otData.gap_assessment || {};
    const actionItems = otData.action_items || [];
    const risks = otData.risks_and_traps || { critical: [], high: [], info: [] };
    const interviewQuestions = otData.interview_questions || { critical: [], high_priority: [], standard: [] };
    const theories = otData.theory_analysis || {};
    const standalone = otData.standalone_theories || {};
    const posdcorb = standalone.posdcorb || {};
    const mintzbergRoles = otData.mintzberg_roles || {};
    const layer1 = otData.layer1_theory_analysis || {};
    const coherence = layer1.function_coherence_analysis || {};
    const authenticity = layer1.role_authenticity_assessment || {};
    const metadata = otData.metadata || {};
    
    const detectedSeniority = otData.detected_seniority || 'Unknown';
    const authColor = gap.authenticity_score >= 85 ? '#10b981' : gap.authenticity_score >= 70 ? '#f59e0b' : '#ef4444';
    
    // Combine all risks for display
    const allRisks = [...risks.critical, ...risks.high, ...risks.info];
    
    // Combine all interview questions
    const allQuestions = [
        ...(interviewQuestions.critical || []).map(q => ({ ...q, priority: 'critical' })),
        ...(interviewQuestions.high_priority || []).map(q => ({ ...q, priority: 'high' })),
        ...(interviewQuestions.standard || []).map(q => ({ ...q, priority: 'standard' }))
    ];
    
    // Tabs configuration
    const tabs = [
        { id: 'advisory', label: '🎯 Advisory & Actions', icon: '🎯' },
        { id: 'risks', label: '🚨 Risks & Traps', icon: '🚨', count: allRisks.length },
        { id: 'framing', label: '📝 Framing & Questions', icon: '📝', count: allQuestions.length },
        { id: 'theories', label: '📊 Theories', icon: '📊' },
        { id: 'posdcorb', label: '📋 POSDCORB', icon: '📋' },
        { id: 'supplemental', label: '🔍 Supplemental', icon: '🔍' }
    ];
    
    // Helper for score color
    const getScoreColor = (score) => {
        if (score >= 70) return '#ef4444';
        if (score >= 40) return '#f59e0b';
        return '#10b981';
    };
    
    return (
        <div className="ot-card" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            marginBottom: '24px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '18px 24px',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '26px' }}>🏛️</span>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                            Organizational Theory Analysis
                        </h2>
                        <span style={{
                            fontSize: '10px',
                            padding: '2px 10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '20px',
                            color: '#8b5cf6'
                        }}>
                            OT v{metadata.worker_version || '4.2.3'}
                        </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Understanding how this organization really operates
                    </p>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span className="chip">👔 {detectedSeniority}</span>
                    <span className="chip">🤖 {metadata.processing_time_ms ? `${Math.round(metadata.processing_time_ms / 1000)}s` : 'N/A'}</span>
                </div>
            </div>
            
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                overflowX: 'auto',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0 8px',
                gap: '4px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent',
                            color: activeTab === tab.id ? '#c9a84c' : 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: activeTab === tab.id ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span style={{
                                marginLeft: '4px',
                                padding: '0px 6px',
                                backgroundColor: '#c9a84c',
                                borderRadius: '10px',
                                fontSize: '10px',
                                color: '#1e293b'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            
            {/* Tab Content */}
            <div style={{ padding: '20px 24px', maxHeight: '600px', overflowY: 'auto' }}>
                
                {/* TAB 1: ADVISORY REPORT + GAP ASSESSMENT + ACTION ITEMS */}
                {activeTab === 'advisory' && (
                    <div>
                        {/* Organizational Profile & Bottom Line */}
                        <div className="consensus-box" style={{ marginBottom: '20px', borderLeftColor: '#c9a84c' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>🏢 Organizational Profile</h4>
                            <p style={{ fontSize: '13px', marginBottom: '16px' }}>{advisory.organizational_profile || 'No profile available.'}</p>
                            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>🎯 Bottom Line</h4>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#c9a84c' }}>{advisory.candidate_bottom_line || 'No bottom line available.'}</p>
                        </div>
                        
                        {/* Survival Strategy */}
                        {advisory.survival_strategy && (
                            <div className="survival-box" style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>🎯 Survival Strategy</h4>
                                <p style={{ fontSize: '13px' }}>{advisory.survival_strategy}</p>
                            </div>
                        )}
                        
                        {/* Authenticity Score & Gap Assessment */}
                        <div className="result-card" style={{ borderLeftColor: '#c9a84c', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>📋 JD Authenticity Assessment</h4>
                            <div className="metric-row">
                                <span>Authenticity Score:</span>
                                <span style={{ fontWeight: '700', color: authColor }}>{gap.authenticity_score || 50}/100 ({gap.authenticity_label || 'N/A'})</span>
                            </div>
                            <div className="score-bar"><div className="score-fill" style={{ width: `${gap.authenticity_score || 50}%`, background: authColor }}></div></div>
                            <p style={{ fontSize: '12px', marginTop: '12px' }}>{gap.interview_priority || ''}</p>
                        </div>
                        
                        {/* Claims vs Indicators */}
                        {gap.claims_vs_indicators && gap.claims_vs_indicators.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '13px', marginBottom: '12px' }}>🔍 Claims vs Indicators</h4>
                                {gap.claims_vs_indicators.map((item, idx) => (
                                    <div key={idx} className="gap-item" style={{ marginBottom: '10px', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                        {typeof item === 'string' ? (
                                            <p style={{ fontSize: '12px' }}>{item}</p>
                                        ) : (
                                            <>
                                                <div><strong>JD Claim:</strong> {item.claim || 'Not specified'}</div>
                                                <div style={{ marginTop: '6px' }}><strong>Analysis Indicates:</strong> {item.analysis_indicates || 'Not specified'}</div>
                                                <div style={{ marginTop: '6px', fontSize: '12px' }}>{item.professional_interpretation || ''}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Action Items */}
                        {actionItems.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '13px', marginBottom: '12px' }}>✅ Action Items</h4>
                                {actionItems.map((item, idx) => (
                                    <div key={idx} className="action-item" style={{ marginBottom: '8px', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '3px solid #c9a84c' }}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Red Flags & Advantages */}
                        {advisory.red_flags && advisory.red_flags.length > 0 && (
                            <div className="warning-box" style={{ marginTop: '20px' }}>
                                <strong>🚩 Red Flags:</strong>
                                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                                    {advisory.red_flags.map((flag, idx) => <li key={idx} style={{ fontSize: '12px' }}>{flag}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {advisory.advantages && advisory.advantages.length > 0 && (
                            <div className="survival-box" style={{ marginTop: '16px' }}>
                                <strong>✅ Advantages:</strong>
                                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                                    {advisory.advantages.map((adv, idx) => <li key={idx} style={{ fontSize: '12px' }}>{adv}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                {/* TAB 2: RISKS & TRAPS */}
                {activeTab === 'risks' && (
                    <div>
                        <div className="info-banner" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span className="chip">🔴 Critical: {risks.critical.length}</span>
                            <span className="chip">🟠 High: {risks.high.length}</span>
                            <span className="chip">⚪ Info: {risks.info.length}</span>
                        </div>
                        {allRisks.length === 0 && (
                            <div className="consensus-box"><p>No significant risks detected for this role.</p></div>
                        )}
                        {allRisks.map((risk, idx) => (
                            <CollapsibleRiskCard
                                key={idx}
                                risk={risk}
                                severity={risk.severity}
                                isExpanded={expandedRisks[risk.name] || false}
                                onToggle={() => toggleRisk(risk.name)}
                            />
                        ))}
                    </div>
                )}
                
                {/* TAB 3: RESUME FRAMING & INTERVIEW QUESTIONS */}
                {activeTab === 'framing' && (
                    <div>
                        {/* Resume Framing Tips */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📝 Resume Framing Tips
                                <InfoTooltip definition="Tailor your resume to address the hidden requirements and organizational patterns detected in this analysis." />
                            </h4>
                            {advisory.resume_framing_tips && advisory.resume_framing_tips.length > 0 ? (
                                <ul style={{ marginLeft: '20px' }}>
                                    {advisory.resume_framing_tips.map((tip, idx) => (
                                        <li key={idx} style={{ marginBottom: '8px', fontSize: '13px' }}>{tip}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ color: '#94a3b8', fontSize: '12px' }}>No resume framing tips available.</p>
                            )}
                            {advisory.resume_narrative && (
                                <div className="resume-tip-box" style={{ marginTop: '16px' }}>
                                    <strong>📄 Resume Narrative:</strong>
                                    <p style={{ marginTop: '6px', fontSize: '13px' }}>{advisory.resume_narrative}</p>
                                </div>
                            )}
                        </div>
                        
                        <hr style={{ margin: '16px 0' }} />
                        
                        {/* Interview Questions */}
                        <div>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ❓ Interview Questions
                                <InfoTooltip definition="Prioritized questions to ask in the interview. Critical questions are must-ask. Red flags indicate concerning answers to watch for." />
                            </h4>
                            {allQuestions.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: '12px' }}>No interview questions available.</p>
                            ) : (
                                allQuestions.map((q, idx) => (
                                    <CollapsibleInterviewQuestion key={idx} question={q} priority={q.priority} />
                                ))
                            )}
                        </div>
                        
                        {/* Theory-specific resume tips */}
                        {(theories.cynefin?.resume_tip || theories.weber?.resume_tip || theories.mintzberg?.resume_tip) && (
                            <>
                                <hr style={{ margin: '16px 0' }} />
                                <div>
                                    <h4 style={{ fontSize: '13px', marginBottom: '12px' }}>🎯 Theory-Specific Resume Tips</h4>
                                    {theories.cynefin?.resume_tip && (
                                        <div className="resume-tip-box" style={{ marginBottom: '8px' }}>
                                            <strong>🌀 Cynefin:</strong> {theories.cynefin.resume_tip}
                                        </div>
                                    )}
                                    {theories.weber?.resume_tip && (
                                        <div className="resume-tip-box" style={{ marginBottom: '8px' }}>
                                            <strong>📜 Weber:</strong> {theories.weber.resume_tip}
                                        </div>
                                    )}
                                    {theories.mintzberg?.resume_tip && (
                                        <div className="resume-tip-box" style={{ marginBottom: '8px' }}>
                                            <strong>🏗️ Mintzberg:</strong> {theories.mintzberg.resume_tip}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {/* TAB 4: THEORIES (Cynefin, Weber, Mintzberg, Garbage Can, PE) */}
                {activeTab === 'theories' && (
                    <div>
                        {/* Cynefin */}
                        {theories.cynefin && (
                            <div className="result-card" style={{ borderLeftColor: '#8b5cf6', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>🌀 Cynefin Framework</h4>
                                    <span className="badge badge-cynefin">{theories.cynefin.layer1_jd_domain || 'Unknown'}</span>
                                    <InfoTooltip definition={THEORY_DEFINITIONS.Cynefin} />
                                </div>
                                <div className="metric-row">
                                    <span>Complexity Score:</span>
                                    <span style={{ fontWeight: '700', color: getScoreColor(theories.cynefin.score || 40) }}>{theories.cynefin.score || 40}/100</span>
                                </div>
                                <div className="score-bar"><div className="score-fill" style={{ width: `${theories.cynefin.score || 40}%`, background: '#8b5cf6' }}></div></div>
                                <div className="metric-row"><span>Decision Style:</span><span>{theories.cynefin.decision_style || 'Sense → Analyze → Respond'}</span></div>
                                <p style={{ marginTop: '12px', fontSize: '13px' }}>{theories.cynefin.interpretation}</p>
                                {theories.cynefin.gap_note && <div className="warning-box" style={{ marginTop: '12px' }}><strong>⚠️ Gap:</strong> {theories.cynefin.gap_note}</div>}
                                {theories.cynefin.interview_question && (
                                    <div className="interview-question" style={{ marginTop: '12px', padding: '10px' }}>
                                        <strong>❓ Ask:</strong> {theories.cynefin.interview_question}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Weber */}
                        {theories.weber && (
                            <div className="result-card" style={{ borderLeftColor: '#64748b', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>📜 Weber: Authority & Rules</h4>
                                    <InfoTooltip definition={THEORY_DEFINITIONS.Weber} />
                                </div>
                                <div className="metric-row"><span>Structure Score:</span><span style={{ fontWeight: '700' }}>{theories.weber.score || 50}/100</span></div>
                                <div className="score-bar"><div className="score-fill" style={{ width: `${theories.weber.score || 50}%`, background: '#64748b' }}></div></div>
                                <div className="metric-row"><span>JD Emphasis:</span><span>{theories.weber.layer1_rules_vs_outcomes || 'balanced'}</span></div>
                                <div className="metric-row"><span>HB Suggests:</span><span>{theories.weber.hb_suggests_rules_vs_outcomes || 'Unknown'}</span></div>
                                <p style={{ marginTop: '12px', fontSize: '13px' }}>{theories.weber.interpretation}</p>
                                {theories.weber.gap_note && <div className="warning-box" style={{ marginTop: '12px' }}><strong>⚠️ Gap:</strong> {theories.weber.gap_note}</div>}
                            </div>
                        )}
                        
                        {/* Mintzberg Structure */}
                        {theories.mintzberg && (
                            <div className="result-card" style={{ borderLeftColor: '#3b82f6', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>🏗️ Mintzberg: Structure</h4>
                                    <span className="badge badge-mintzberg">{theories.mintzberg.layer1_structure_type || 'Unknown'}</span>
                                    <InfoTooltip definition={THEORY_DEFINITIONS.Mintzberg} />
                                </div>
                                <div className="metric-row"><span>HB Suggests:</span><span>{theories.mintzberg.hb_suggests || 'Unknown'}</span></div>
                                <p style={{ marginTop: '12px', fontSize: '13px' }}>{theories.mintzberg.interpretation}</p>
                                {theories.mintzberg.gap_note && <div className="warning-box" style={{ marginTop: '12px' }}><strong>⚠️ Gap:</strong> {theories.mintzberg.gap_note}</div>}
                                {theories.mintzberg.interview_question && (
                                    <div className="interview-question" style={{ marginTop: '12px', padding: '10px' }}>
                                        <strong>❓ Ask:</strong> {theories.mintzberg.interview_question}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Garbage Can */}
                        {theories.garbage_can && (
                            <div className="result-card" style={{ borderLeftColor: '#f59e0b', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>🗑️ Garbage Can Model</h4>
                                    <span className="badge badge-garbage">{theories.garbage_can.layer1_detected ? (theories.garbage_can.layer1_severity || 'detected') : 'not detected'}</span>
                                    <InfoTooltip definition={THEORY_DEFINITIONS["Garbage Can"]} />
                                </div>
                                <div className="metric-row"><span>Chaos Score:</span><span style={{ fontWeight: '700' }}>{theories.garbage_can.score || 15}/100</span></div>
                                <div className="score-bar"><div className="score-fill" style={{ width: `${theories.garbage_can.score || 15}%`, background: '#f59e0b' }}></div></div>
                                <div className="metric-row"><span>Flight Likelihood:</span><span>{theories.garbage_can.hb_flight_likelihood || 'Unknown'}</span></div>
                                <p style={{ marginTop: '12px', fontSize: '13px' }}>{theories.garbage_can.interpretation}</p>
                                {theories.garbage_can.interview_question && (
                                    <div className="interview-question" style={{ marginTop: '12px', padding: '10px' }}>
                                        <strong>❓ Ask:</strong> {theories.garbage_can.interview_question}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Punctuated Equilibrium */}
                        {standalone.punctuated_equilibrium && standalone.punctuated_equilibrium.detected && (
                            <div className="result-card" style={{ borderLeftColor: '#06b6d4' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', margin: 0 }}>⚡ Punctuated Equilibrium</h4>
                                    <span className="badge badge-pe">{standalone.punctuated_equilibrium.phase || 'detected'}</span>
                                    <InfoTooltip definition={THEORY_DEFINITIONS["Punctuated Equilibrium"]} />
                                </div>
                                <div className="metric-row"><span>Change Score:</span><span>{standalone.punctuated_equilibrium.score || 0}/100</span></div>
                                <p style={{ marginTop: '12px', fontSize: '13px' }}>{standalone.punctuated_equilibrium.interpretation}</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* TAB 5: POSDCORB DETAILS */}
                {activeTab === 'posdcorb' && (
                    <div>
                        <div className="info-banner" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="chip">📊 JD Score: {posdcorb.jd_score || 0}/100 ({posdcorb.jd_overload_signal || 'none'})</div>
                            <div className="chip">🎯 Rec: {posdcorb.recommended_score || 0}/100 ({posdcorb.recommended_overload_signal || 'none'})</div>
                            <div className="chip">📈 Gap: {posdcorb.score_gap > 0 ? '+' : ''}{posdcorb.score_gap || 0}</div>
                            <InfoTooltip definition={THEORY_DEFINITIONS.POSDCORB} />
                        </div>
                        
                        <div className="score-bar"><div className="score-fill" style={{ width: `${posdcorb.jd_score || 0}%`, background: '#ef4444' }}></div></div>
                        <div className="score-bar" style={{ marginTop: '4px' }}><div className="score-fill" style={{ width: `${posdcorb.recommended_score || 0}%`, background: '#10b981' }}></div></div>
                        
                        {posdcorb.negotiation_summary && (
                            <div className="consensus-box" style={{ marginTop: '16px', padding: '12px' }}>
                                <strong>💡 Negotiation Summary:</strong> {posdcorb.negotiation_summary.summary}
                                {posdcorb.negotiation_summary.action && <div style={{ marginTop: '6px' }}><strong>Action:</strong> {posdcorb.negotiation_summary.action}</div>}
                            </div>
                        )}
                        
                        <table className="function-table" style={{ marginTop: '20px', width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Function</th><th>Actual</th><th>Expected</th><th>Recommended</th><th>Floor</th><th>Priority</th><th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(posdcorb.functions || []).map(f => {
                                    const getOwnershipClass = (level) => {
                                        if (level === 'full') return 'ownership-full';
                                        if (level === 'shared_high') return 'ownership-shared_high';
                                        if (level === 'shared_medium') return 'ownership-shared_medium';
                                        if (level === 'shared_low') return 'ownership-shared_low';
                                        if (level === 'review_only_high' || level === 'review_only_low') return 'ownership-review_only';
                                        return 'ownership-not_detected';
                                    };
                                    return (
                                        <tr key={f.name}>
                                            <td><strong>{f.name}</strong></td>
                                            <td><span className={`ownership-badge ${getOwnershipClass(f.actual_ownership_level)}`}>{f.actual_ownership_level || '—'}</span></td>
                                            <td><span className={`ownership-badge ${getOwnershipClass(f.expected_ownership_level)}`}>{f.expected_ownership_level || '—'}</span></td>
                                            <td><span className={`ownership-badge ${getOwnershipClass(f.recommended_ownership_level)}`}>{f.recommended_ownership_level || '—'}</span></td>
                                            <td><span className={`ownership-badge ${getOwnershipClass(f.negotiation_floor)}`}>{f.negotiation_floor || '—'}</span></td>
                                            <td><span className={`badge ${f.negotiation_priority === 'critical' ? 'priority-critical' : f.negotiation_priority === 'high' ? 'priority-high' : f.negotiation_priority === 'medium' ? 'priority-medium' : 'priority-low'}`}>{f.negotiation_priority || 'none'}</span></td>
                                            <td>{f.actual_points || 0}/{f.recommended_points || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* TAB 6: SUPPLEMENTAL (Coherence, Mintzberg Roles, Authenticity) */}
                {activeTab === 'supplemental' && (
                    <div>
                        {/* Function Coherence */}
                        <div className="result-card" style={{ borderLeftColor: coherence.severity === 'critical' ? '#dc2626' : coherence.severity === 'high' ? '#f97316' : '#64748b', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>🔍 Function Coherence (Frankenrole Detection)</h4>
                            <div className="metric-row"><span>Severity:</span><span className={`badge ${coherence.severity === 'critical' ? 'risk-critical' : coherence.severity === 'high' ? 'risk-high' : 'risk-info'}`}>{coherence.severity || 'none'}</span></div>
                            <div className="metric-row"><span>Relatedness Score:</span><span>{coherence.relatedness_score || 'N/A'}</span></div>
                            <div className="metric-row"><span>Primary Domain:</span><span>{coherence.primary_domain || 'Not detected'}</span></div>
                            <p><strong>Detected Functions:</strong> {(coherence.detected_functions || []).join(', ') || 'None'}</p>
                            <p><strong>Reasoning:</strong> {coherence.reasoning || 'No reasoning provided'}</p>
                        </div>
                        
                        {/* Mintzberg 10 Roles */}
                        <div className="result-card" style={{ borderLeftColor: '#8b5cf6', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>👔 Mintzberg's 10 Managerial Roles</h4>
                            <div className="metric-row">
                                <span>Primary Role:</span>
                                <span className="role-badge" style={{ background: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{mintzbergRoles.primary_role || 'Liaison'}</span>
                            </div>
                            <p style={{ fontSize: '12px', marginTop: '8px' }}>{mintzbergRoles.primary_role_description || ''}</p>
                            {mintzbergRoles.secondary_roles && mintzbergRoles.secondary_roles.length > 0 && (
                                <>
                                    <div className="metric-row" style={{ marginTop: '12px' }}><span>Secondary Roles:</span></div>
                                    <div>{mintzbergRoles.secondary_roles.map(r => <span key={r} className="role-badge secondary-role" style={{ background: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', margin: '4px' }}>{r}</span>)}</div>
                                </>
                            )}
                        </div>
                        
                        {/* Role Authenticity (Bait and Switch) */}
                        <div className="result-card" style={{ borderLeftColor: authenticity.is_deceptive ? '#dc2626' : '#10b981' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>🎭 Role Authenticity (Bait and Switch Detection)</h4>
                            <div className="metric-row"><span>JD Stated Role:</span><span>{authenticity.jd_stated_role || 'Not specified'}</span></div>
                            <div className="metric-row"><span>Actual Role Needed:</span><span>{authenticity.actual_role_inferred || 'Not specified'}</span></div>
                            <div className="metric-row"><span>Gap Severity:</span><span>{authenticity.gap_severity || 'none'}</span></div>
                            <div className="metric-row"><span>Deceptive:</span><span>{authenticity.is_deceptive ? '⚠️ Yes' : '✅ No'}</span></div>
                            {authenticity.recommended_title && <div className="metric-row"><span>Recommended Title:</span><span>{authenticity.recommended_title}</span></div>}
                            <p style={{ marginTop: '12px', fontSize: '13px' }}><strong>Reasoning:</strong> {authenticity.reasoning || 'No reasoning provided'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
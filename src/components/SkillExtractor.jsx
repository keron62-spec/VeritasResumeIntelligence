import React, { useState, useEffect } from 'react';
import { TECHNICAL_SKILLS } from '../utils/skillDictionary';
import { CERTIFICATIONS } from '../utils/certifications';
import { LANGUAGES } from '../utils/commonDictionaries';

/**
 * Deterministic skill matching between JD and resume (fallback when LLM fails)
 * @param {string} jdText - The job description text
 * @param {string} resumeText - The resume text
 * @returns {Object} Skill analysis in the same format as LLM output
 */
function deterministicSkillExtractor(jdText, resumeText) {
  if (!jdText || !resumeText) return null;
  
  const lowerJD = jdText.toLowerCase();
  const lowerResume = resumeText.toLowerCase();
  
  // ============================================================
  // BUILD MASTER SKILL DICTIONARY
  // ============================================================
  
  const allKnownSkills = new Map(); // Map skill -> {skill, category, type}
  
  // Add technical skills
  for (const [category, skills] of Object.entries(TECHNICAL_SKILLS)) {
    for (const skill of skills) {
      allKnownSkills.set(skill.toLowerCase(), { skill, category, type: 'technical' });
    }
  }
  
  // Add certifications
  for (const [category, certs] of Object.entries(CERTIFICATIONS)) {
    for (const cert of certs) {
      allKnownSkills.set(cert.toLowerCase(), { skill: cert, category, type: 'certification' });
    }
  }
  
  // Add languages (treat as a special skill category)
  for (const language of LANGUAGES) {
    allKnownSkills.set(language.toLowerCase(), { skill: language, category: 'languages', type: 'language' });
  }
  
  // ============================================================
  // FIND SKILLS IN JD AND RESUME
  // ============================================================
  
  const jdSkills = [];
  const resumeSkills = [];
  const jdSkillSet = new Set();
  const resumeSkillSet = new Set();
  
  // Helper to escape regex
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  for (const [key, skillInfo] of allKnownSkills.entries()) {
    // Match whole words to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
    
    if (regex.test(lowerJD)) {
      jdSkills.push(skillInfo);
      jdSkillSet.add(key);
    }
    
    if (regex.test(lowerResume)) {
      resumeSkills.push(skillInfo);
      resumeSkillSet.add(key);
    }
  }
  
  // ============================================================
  // CATEGORIZE SKILLS
  // ============================================================
  
  const keep = [];
  const add = [];
  const consider = [];
  const remove = [];
  const matchedJDSkills = new Set();
  
  // First, find exact matches (skill appears in both JD and resume)
  for (const jdSkill of jdSkills) {
    const skillKey = jdSkill.skill.toLowerCase();
    if (resumeSkillSet.has(skillKey)) {
      keep.push({
        skill: jdSkill.skill,
        matched_to: jdSkill.skill,
        confidence: 95,
        reason: `Direct match: ${jdSkill.skill} appears in both JD and resume`,
        action: `Keep this skill on your resume`
      });
      matchedJDSkills.add(skillKey);
    }
  }
  
  // Find category matches (similar skills in same category)
  for (const jdSkill of jdSkills) {
    const skillKey = jdSkill.skill.toLowerCase();
    if (matchedJDSkills.has(skillKey)) continue;
    
    let categoryMatch = null;
    let matchedResumeSkill = null;
    
    for (const resumeSkill of resumeSkills) {
      if (matchedJDSkills.has(resumeSkill.skill.toLowerCase())) continue;
      
      if (jdSkill.category === resumeSkill.category && jdSkill.type === resumeSkill.type) {
        categoryMatch = {
          jdSkill: jdSkill.skill,
          resumeSkill: resumeSkill.skill,
          category: jdSkill.category
        };
        matchedResumeSkill = resumeSkill;
        break;
      }
    }
    
    if (categoryMatch) {
      add.push({
        skill: jdSkill.skill,
        priority: 'medium',
        reason: `The JD mentions "${jdSkill.skill}" (${categoryMatch.category}). You have "${categoryMatch.resumeSkill}" which is in the same category.`,
        suggestion: `Add "${jdSkill.skill}" to your skills section or note transferable experience.`
      });
      matchedJDSkills.add(skillKey);
    } else {
      // No match at all - determine priority based on JD context
      let priority = 'medium';
      
      // Check if skill appears in requirements section or with urgency words
      if (/required|essential|must have|minimum|mandatory/i.test(lowerJD) && lowerJD.includes(jdSkill.skill.toLowerCase())) {
        priority = 'high';
      }
      
      // Certifications are often medium priority
      if (jdSkill.type === 'certification') {
        priority = 'medium';
      }
      
      // Languages with fluency requirements are high priority
      if (jdSkill.type === 'language') {
        if (/fluent|proficient|working knowledge|bilingual|trilingual/i.test(lowerJD)) {
          priority = 'high';
        } else {
          priority = 'medium';
        }
      }
      
      add.push({
        skill: jdSkill.skill,
        priority: priority,
        reason: `${jdSkill.skill} is mentioned in the JD but not found in your resume.`,
        suggestion: `Add "${jdSkill.skill}" to your resume if you have experience with it.`
      });
      matchedJDSkills.add(skillKey);
    }
  }
  
  // Find skills in resume that are not in JD
  for (const resumeSkill of resumeSkills) {
    const skillKey = resumeSkill.skill.toLowerCase();
    if (!jdSkillSet.has(skillKey)) {
      if (resumeSkill.type !== 'language') {
        remove.push({
          skill: resumeSkill.skill,
          reason: `${resumeSkill.skill} (${resumeSkill.category}) is on your resume but not mentioned in the JD.`,
          action: `Consider removing if space is tight, or keep if it shows transferable skills.`
        });
      } else {
        consider.push({
          skill: resumeSkill.skill,
          priority: 'low',
          reason: `${resumeSkill.skill} is on your resume but not mentioned in the JD. It may still be valuable for other roles.`,
          suggestion: `Keep this language on your resume as it demonstrates valuable communication skills.`
        });
      }
    }
  }
  
  // ============================================================
  // GENERATE SUMMARY
  // ============================================================
  
  const keepCount = keep.length;
  const addCount = add.length;
  const highPriorityAdd = add.filter(a => a.priority === 'high').length;
  const highPrioritySkills = add.filter(a => a.priority === 'high').map(a => a.skill);
  
  let summary = '';
  if (addCount === 0) {
    summary = `Your skills match all ${keepCount} key requirements from the JD.`;
  } else if (highPriorityAdd > 0) {
    summary = `You match ${keepCount} skills from the JD. ${addCount} skills are missing, including ${highPriorityAdd} high-priority skills (${highPrioritySkills.join(', ')}). Focus on adding these first.`;
  } else {
    summary = `You match ${keepCount} skills from the JD. ${addCount} skills are missing. Consider adding the medium-priority skills to strengthen your application.`;
  }
  
  // Sort add skills by priority (high first)
  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  add.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return {
    jd_skills_extracted: jdSkills.slice(0, 30).map(s => ({ 
      skill: s.skill, 
      importance: 'required',
      category: s.category,
      type: s.type
    })),
    resume_skills_extracted: resumeSkills.slice(0, 30).map(s => ({ 
      skill: s.skill,
      category: s.category,
      type: s.type,
      confidence: 'high'
    })),
    skill_analysis: {
      keep,
      add,
      consider,
      remove,
      summary
    }
  };
}

export default function SkillExtractor({ skillExtractor, jdText, resumeText }) {
  const [displayData, setDisplayData] = useState(skillExtractor);
  const [isFallback, setIsFallback] = useState(false);
  
  useEffect(() => {
    // Check if LLM provided valid skill_extractor data
    const hasValidLLMData = skillExtractor && 
                            skillExtractor.skill_analysis && 
                            (skillExtractor.skill_analysis.keep?.length > 0 || 
                             skillExtractor.skill_analysis.add?.length > 0);
    
    if (hasValidLLMData) {
      // Use LLM data
      setDisplayData(skillExtractor);
      setIsFallback(false);
    } else if (jdText && resumeText) {
      // LLM failed or not provided, use deterministic fallback
      const fallbackData = deterministicSkillExtractor(jdText, resumeText);
      if (fallbackData) {
        setDisplayData(fallbackData);
        setIsFallback(true);
      } else {
        setDisplayData(null);
        setIsFallback(false);
      }
    } else {
      setDisplayData(skillExtractor);
      setIsFallback(false);
    }
  }, [skillExtractor, jdText, resumeText]);
  
  if (!displayData || !displayData.skill_analysis) {
    return (
      <div className="skill-extractor" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid var(--border-light)'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔧</span> Skill Extractor
          <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
            Unavailable
          </span>
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Skill extraction not available. Please ensure both JD and resume are loaded.
        </p>
      </div>
    );
  }
  
  const { keep, add, consider, remove, summary } = displayData.skill_analysis;
  
  // Helper to get priority badge color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return { bg: '#ef4444', color: 'white', label: 'REQUIRED' };
      case 'medium': return { bg: '#f59e0b', color: 'white', label: 'PREFERRED' };
      case 'low': return { bg: '#10b981', color: 'white', label: 'OPTIONAL' };
      default: return { bg: '#6b7280', color: 'white', label: 'REQUIRED' };
    }
  };
  
  return (
    <div className="skill-extractor" style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid var(--border-light)'
    }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span>🔧</span> Skill Extractor
        <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
          JD vs Resume Skills Audit
        </span>
        {isFallback && (
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            borderRadius: '12px'
          }}>
            Deterministic Mode
          </span>
        )}
      </h3>
      
      {/* Summary Banner */}
      {summary && (
        <div style={{
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          padding: '10px 12px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          borderLeft: '3px solid #2563eb'
        }}>
          💡 <strong>Actionable Summary:</strong> {summary}
        </div>
      )}
      
      {/* KEEP Section */}
      {keep && keep.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <strong style={{ color: '#10b981' }}>Skills to Keep</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{keep.length} skills matched JD</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {keep.map((item, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '8px',
                borderLeft: '3px solid #10b981'
              }}>
                <strong>{item.skill}</strong>
                {item.matched_to !== item.skill && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {' '}→ matches "{item.matched_to}"
                  </span>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {item.reason}
                </div>
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>
                  💡 {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ADD Section */}
      {add && add.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>➕</span>
            <strong style={{ color: '#ef4444' }}>Skills to Add</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{add.length} missing from JD</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {add.map((item, i) => {
              const priorityStyle = getPriorityColor(item.priority);
              return (
                <div key={i} style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${priorityStyle.bg}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong>{item.skill}</strong>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      backgroundColor: priorityStyle.bg, 
                      color: priorityStyle.color, 
                      borderRadius: '12px' 
                    }}>
                      {priorityStyle.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {item.reason}
                  </div>
                  <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '4px' }}>
                    💡 {item.suggestion}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* CONSIDER Section */}
      {consider && consider.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🤔</span>
            <strong style={{ color: '#f59e0b' }}>Skills to Consider</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{consider.length} nice-to-have</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {consider.map((item, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '8px',
                borderLeft: '3px solid #f59e0b'
              }}>
                <strong>{item.skill}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {item.reason}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  💡 {item.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* REMOVE Section */}
      {remove && remove.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🗑️</span>
            <strong style={{ color: 'var(--text-muted)' }}>Skills to Remove</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{remove.length} irrelevant to JD</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {remove.map((item, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '8px',
                textDecoration: 'line-through',
                color: 'var(--text-muted)'
              }}>
                <strong>{item.skill}</strong>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  {item.reason}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ✂️ {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Deterministic Mode Note */}
      {isFallback && (
        <div style={{
          marginTop: '16px',
          padding: '8px 12px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '6px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          ⚡ Skill analysis is using deterministic matching (dictionary-based). For more nuanced analysis, ensure the LLM is available.
        </div>
      )}
      
      {/* Source Data Toggle (Optional - shows extracted skills) */}
      <details style={{ marginTop: '16px' }}>
        <summary style={{ fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)', textAlign: 'center' }}>
          📋 Show extracted skills (JD vs Resume)
        </summary>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
          <div>
            <strong>JD Skills:</strong>
            <ul style={{ marginTop: '4px', paddingLeft: '16px', color: 'var(--text-muted)' }}>
              {displayData.jd_skills_extracted?.slice(0, 15).map((s, i) => (
                <li key={i}>{s.skill} <span style={{ color: s.importance === 'required' ? '#ef4444' : '#f59e0b' }}>({s.importance})</span></li>
              ))}
              {displayData.jd_skills_extracted?.length > 15 && (
                <li style={{ color: 'var(--text-muted)' }}>+{displayData.jd_skills_extracted.length - 15} more</li>
              )}
            </ul>
          </div>
          <div>
            <strong>Your Skills:</strong>
            <ul style={{ marginTop: '4px', paddingLeft: '16px', color: 'var(--text-muted)' }}>
              {displayData.resume_skills_extracted?.slice(0, 15).map((s, i) => (
                <li key={i}>{s.skill}</li>
              ))}
              {displayData.resume_skills_extracted?.length > 15 && (
                <li style={{ color: 'var(--text-muted)' }}>+{displayData.resume_skills_extracted.length - 15} more</li>
              )}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
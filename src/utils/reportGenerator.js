// src/utils/reportGenerator.js

export function generateMarkdownReport(hiddenBrief, candidateContext = null) {
    const {
      jd_quality_assessment,
      core_problem,
      hidden_requirements,
      decision_bottleneck_risk,
      burnout_risk,
      scale_surge_risk,
      scope_grade_mismatch,
      stakeholder_complexity,
      repetition_signals,
      contradictions_detected,
      language_pattern,
      recommendation_summary,
      analysis_limitations,
      confidence_statement
    } = hiddenBrief;
  
    const currentDate = new Date().toLocaleString();
    const roleTitle = candidateContext?.role_title || "the role";
    const organization = candidateContext?.organization || "the organization";
  
    let markdown = `# Hidden Brief Intelligence Report\n\n`;
    markdown += `## ${roleTitle} – ${organization}\n\n`;
    markdown += `**Generated:** ${currentDate}\n`;
    markdown += `**Report ID:** HB-${Date.now()}\n\n`;
    markdown += `*This report is based on analysis of the job description. Verify all claims in the interview.*\n\n`;
    markdown += `---\n\n`;
  
    // ============================================================
    // SECTION 1: EXECUTIVE SUMMARY
    // ============================================================
    markdown += `## 1. Executive Summary\n\n`;
    markdown += `### Bottom Line\n`;
    markdown += `${recommendation_summary || 'Review the full report for insights on this role.'}\n\n`;
  
    markdown += `### Key Findings at a Glance\n\n`;
    markdown += `| Area | What You Should Know |\n`;
    markdown += `|------|----------------------|\n`;
    
    if (jd_quality_assessment) {
      markdown += `| Role Clarity | ${jd_quality_assessment.maturity_grade || 'Not specified'} – ${jd_quality_assessment.assessment?.substring(0, 80) || 'Review JD'}\n`;
    }
    if (stakeholder_complexity) {
      markdown += `| Stakeholder Complexity | ${stakeholder_complexity.complexity_level || 'Not specified'}\n`;
    }
    if (core_problem?.confidence === 'high' || core_problem?.confidence === 'medium') {
      markdown += `| Hidden Problem Detected | Yes – see Section 2\n`;
    }
    if (decision_bottleneck_risk?.risk_level === 'High' || decision_bottleneck_risk?.risk_level === 'Very High') {
      markdown += `| Approval Bottleneck Risk | ${decision_bottleneck_risk.risk_level} – see Section 12\n`;
    }
    if (scope_grade_mismatch?.detected) {
      markdown += `| Title vs Scope | ${scope_grade_mismatch.mismatch_type === 'under_titled' ? 'May be under-titled' : 'May be over-titled'}\n`;
    }
    markdown += `\n`;
  
    // ============================================================
    // SECTION 2: WHAT THIS ROLE IS DESIGNED TO ADDRESS
    // ============================================================
    if (core_problem) {
      markdown += `## 2. What This Role is Designed to Address\n\n`;
      markdown += `### What the Job Description States\n`;
      markdown += `${core_problem.stated_task || 'Not explicitly stated in the JD.'}\n\n`;
      
      if (core_problem.inferred_problem) {
        markdown += `### The Challenge Behind This Vacancy\n`;
        markdown += `${core_problem.inferred_problem}\n\n`;
      }
      
      if (core_problem.evidence_quotes && core_problem.evidence_quotes.length > 0) {
        markdown += `**Evidence from the JD:**\n`;
        core_problem.evidence_quotes.forEach(quote => {
          markdown += `- "${quote}"\n`;
        });
        markdown += `\n`;
      }
      
      if (core_problem.inference_limitation) {
        markdown += `*Note: ${core_problem.inference_limitation}*\n\n`;
      }
    }
  
    // ============================================================
    // SECTION 3: WHAT YOU NEED TO KNOW ABOUT THIS ROLE
    // ============================================================
    if (jd_quality_assessment) {
      markdown += `## 3. What You Need to Know About This Role\n\n`;
      markdown += `**JD Word Count:** ${jd_quality_assessment.word_count || 'Not available'}\n`;
      markdown += `**Detected Seniority:** ${jd_quality_assessment.detected_seniority || 'Not specified'}\n`;
      markdown += `**Maturity Grade:** ${jd_quality_assessment.maturity_grade || 'Not assessed'}\n\n`;
      markdown += `${jd_quality_assessment.assessment || 'No additional assessment available.'}\n\n`;
      
      if (jd_quality_assessment.recommendation) {
        markdown += `**Recommendation:** ${jd_quality_assessment.recommendation}\n\n`;
      }
      
      if (scope_grade_mismatch?.detected) {
        markdown += `### How This Role Compares to Its Title\n\n`;
        markdown += `The title suggests ${scope_grade_mismatch.mismatch_type === 'under_titled' ? 'a more junior function than the responsibilities indicate' : 'a more senior function than the responsibilities indicate'}. `;
        markdown += `${scope_grade_mismatch.explanation || 'Review the duties carefully against the title.'}\n\n`;
        markdown += `**To clarify in the interview:**\n`;
        markdown += `"${scope_grade_mismatch.resume_framing_advice || 'How does this role compare to others with similar titles at your organization?'}"\n\n`;
      }
    }
  
    // ============================================================
    // SECTION 4: STAKEHOLDERS MENTIONED IN THE JD
    // ============================================================
    if (stakeholder_complexity) {
      markdown += `## 4. Stakeholders Mentioned in the JD (And Who Else You Might Work With)\n\n`;
      markdown += `**Complexity Level:** ${stakeholder_complexity.complexity_level || 'Not specified'}\n\n`;
      
      if (stakeholder_complexity.stakeholder_types_identified && stakeholder_complexity.stakeholder_types_identified.length > 0) {
        markdown += `### Explicitly Mentioned in the Job Description\n\n`;
        markdown += `The JD specifically names these stakeholder groups:\n\n`;
        markdown += `| Stakeholder Type | Context |\n`;
        markdown += `|-----------------|--------|\n`;
        stakeholder_complexity.stakeholder_types_identified.forEach(type => {
          markdown += `| ${type} | Mentioned in JD |\n`;
        });
        markdown += `\n`;
      }
      
      // Generate suggested additional stakeholders based on patterns (no methodology disclosure)
      markdown += `### Who You May Also Need to Coordinate With (Based on Similar Roles)\n\n`;
      markdown += `Roles like this often involve coordination with:\n\n`;
      
      // This is where you would add sector-specific suggestions
      // The actual suggestions would come from a mapping function based on sector_code
      markdown += `- **Other technical partners** – Projects of this scale often involve multiple technical advisors\n`;
      markdown += `- **Additional donor agencies** – Rarely does only one donor fund an entire project\n`;
      markdown += `- **Regional coordinating bodies** – Depending on the role's geographic scope\n\n`;
      markdown += `**Important Note:** These are not mentioned in the JD. They are patterns observed in similar roles. Use the interview to confirm the actual stakeholder map.\n\n`;
      
      markdown += `${stakeholder_complexity.explanation || ''}\n\n`;
      
      markdown += `**To clarify in the interview:**\n`;
      if (stakeholder_complexity.resume_framing_advice) {
        markdown += `- ${stakeholder_complexity.resume_framing_advice}\n`;
      }
      markdown += `- "Beyond the stakeholders mentioned in the JD, who else would I need to coordinate with regularly?"\n`;
      markdown += `- "Are there other donor agencies or technical partners involved in this project?"\n\n`;
    }
  
    // ============================================================
    // SECTION 5: WHAT THEY'RE NOT SAYING (HIDDEN REQUIREMENTS)
    // ============================================================
    if (hidden_requirements && hidden_requirements.length > 0) {
      markdown += `## 5. What They're Not Saying (Hidden Requirements)\n\n`;
      hidden_requirements.forEach((req, idx) => {
        markdown += `### ${idx + 1}. ${req.implied_requirement}\n`;
        markdown += `- **Why it matters:** ${req.why_it_matters || 'This appears to be important based on the JD language.'}\n`;
        markdown += `- **How to show it:** ${req.resume_framing_advice || 'Prepare an example from your experience that demonstrates this capability.'}\n\n`;
      });
    }
  
    // ============================================================
    // SECTION 6: WHAT PAST PROJECTS OR SIMILAR INITIATIVES MAY HAVE STRUGGLED WITH
    // ============================================================
    if (repetition_signals && repetition_signals.length > 0) {
      markdown += `## 6. What Past Projects or Similar Initiatives May Have Struggled With\n\n`;
      markdown += `The JD repeatedly emphasizes certain areas. In job descriptions, this pattern often reflects challenges the organization has experienced – whether in this project, a previous project, or similar initiatives elsewhere.\n\n`;
      
      markdown += `### Areas That May Have Been Challenging\n\n`;
      
      repetition_signals.slice(0, 5).forEach(signal => {
        if (!signal.required_vocabulary) {
          markdown += `**${signal.phrase}**\n`;
          markdown += `- Appears ${signal.count} times in the JD\n`;
          markdown += `- ${signal.signal || 'Organizations typically emphasize this when it has been a source of difficulty.'}\n\n`;
        }
      });
      
      markdown += `### What This Means for You\n\n`;
      markdown += `These patterns suggest the organization has experience with challenges in these areas. Your application and interview should address how you would prevent these specific issues.\n\n`;
      
      markdown += `### To Ask in the Interview\n\n`;
      markdown += `- "What has been the biggest challenge in keeping this project on track so far?"\n`;
      markdown += `- "Are there any areas where past deliverables required significant rework?"\n`;
      markdown += `- "What would you want to see done differently compared to how things have been handled before?"\n\n`;
      
      markdown += `**Important Note:** The JD does not specify whether this is a new project or a replacement role. These patterns reflect the organization's experience with similar situations – not necessarily the performance of any specific person.\n\n`;
    }
  
    // ============================================================
    // SECTION 7: WHAT THE TIMELINE SUGGESTS
    // ============================================================
    markdown += `## 7. What the Timeline Suggests\n\n`;
    
    let urgencyLevel = "Moderate";
    let urgencyEvidence = [];
    
    if (repetition_signals) {
      const timelySignals = repetition_signals.filter(s => 
        s.phrase?.toLowerCase().includes('timely') || 
        s.phrase?.toLowerCase().includes('deadline') ||
        s.phrase?.toLowerCase().includes('urgent')
      );
      if (timelySignals.length > 0) {
        urgencyLevel = "Urgent";
        urgencyEvidence = timelySignals.map(s => `"${s.phrase}" appears ${s.count} times`);
      }
    }
    
    if (jd_quality_assessment?.red_flag_risk === 'Critical' || jd_quality_assessment?.red_flag_risk === 'High') {
      urgencyLevel = "Urgent";
    }
    
    markdown += `Language in the JD suggests: **${urgencyLevel}**\n\n`;
    
    if (urgencyEvidence.length > 0) {
      markdown += `**Evidence:**\n`;
      urgencyEvidence.forEach(evidence => {
        markdown += `- ${evidence}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `**What this means for you:**\n`;
    if (urgencyLevel === "Urgent") {
      markdown += `- Emphasize your availability and speed of execution\n`;
      markdown += `- Mention your ability to "hit the ground running"\n`;
      markdown += `- You may have less negotiating room on start date\n`;
    } else {
      markdown += `- You may have more time to prepare and negotiate\n`;
      markdown += `- The organization may be willing to wait for the right person\n`;
    }
    markdown += `\n**To clarify:**\n"What is the ideal start date? How quickly do you need someone in this role?"\n\n`;
  
    // ============================================================
    // SECTION 8: WHERE YOU MAY HAVE LEVERAGE
    // ============================================================
    markdown += `## 8. Where You May Have Leverage\n\n`;
    markdown += `Based on the JD and typical patterns in roles like this:\n\n`;
    
    let leveragePoints = [];
    
    if (decision_bottleneck_risk?.risk_level === 'High' || decision_bottleneck_risk?.risk_level === 'Very High') {
      leveragePoints.push(`**They need someone who can navigate complex approvals** – The JD indicates multiple approval layers. If you have experience with similar bureaucracies, you require less ramp-up time.`);
    }
    
    if (burnout_risk?.risk_level === 'High' || burnout_risk?.risk_level === 'Very High') {
      leveragePoints.push(`**They have experienced high pressure in this area** – The JD emphasizes tight timelines and multiple priorities. If you have a track record of delivering under pressure, you bring proven resilience.`);
    }
    
    if (scale_surge_risk?.risk_level === 'High' || scale_surge_risk?.risk_level === 'Very High') {
      leveragePoints.push(`**This project may be larger than typical for the team** – The JD's emphasis on capacity suggests they may be scaling up. If you have experience with similar scale, you bring institutional knowledge they lack.`);
    }
    
    if (scope_grade_mismatch?.detected && scope_grade_mismatch.mismatch_type === 'under_titled') {
      leveragePoints.push(`**The title may understate the scope** – If the role requires Project Manager responsibilities but carries a "Support" title, you have grounds to discuss appropriate recognition.`);
    }
    
    if (leveragePoints.length === 0) {
      leveragePoints.push(`**Your specific experience** – If you have directly relevant experience to the core responsibilities, that is your primary leverage.`);
    }
    
    leveragePoints.forEach((point, idx) => {
      markdown += `${idx + 1}. ${point}\n\n`;
    });
    
    markdown += `**To use in negotiation:**\n"${leveragePoints[0]?.split('–')[0] || 'I notice the JD emphasizes [specific need]. My experience with [your experience] directly addresses that.'}"\n\n`;
  
    // ============================================================
    // SECTION 9: QUESTIONS THEY'RE LIKELY TO ASK (BEYOND THE JD)
    // ============================================================
    markdown += `## 9. Questions They're Likely to Ask (Beyond the JD)\n\n`;
    markdown += `Based on similar roles, be prepared for:\n\n`;
    
    if (decision_bottleneck_risk?.risk_level === 'High' || decision_bottleneck_risk?.risk_level === 'Very High') {
      markdown += `**1. "Tell me about a time you had to get buy-in from people who didn't report to you."**\n`;
      markdown += `   - They need someone who can influence without authority across multiple stakeholders\n`;
      markdown += `   - **Prepare an example** where you coordinated across different groups with competing priorities\n\n`;
    }
    
    if (burnout_risk?.risk_level === 'High' || burnout_risk?.risk_level === 'Very High' || repetition_signals?.some(s => s.phrase?.toLowerCase().includes('multiple'))) {
      markdown += `**2. "How do you handle competing priorities when everything is urgent?"**\n`;
      markdown += `   - The JD's emphasis on multiple priorities and tight timelines suggests this is a real challenge\n`;
      markdown += `   - **Prepare an example** where you prioritized effectively under pressure\n\n`;
    }
    
    markdown += `**3. "Describe a project that was behind schedule. What did you do?"**\n`;
    markdown += `   - Past delays appear to be a concern based on JD language\n`;
    markdown += `   - **Prepare an example** where you identified risks early or recovered a delayed project\n\n`;
    
    if (core_problem?.inferred_problem) {
      markdown += `**4. "What is your experience with [core function of the role]?"**\n`;
      markdown += `   - This is the core of the role\n`;
      markdown += `   - **Prepare to detail** your relevant experience with specific metrics\n\n`;
    }
    
    markdown += `**How to prepare:** Have specific examples ready for each of these scenarios using the CAR method (Context, Action, Result).\n\n`;
  
    // ============================================================
    // SECTION 10: WHAT THE JD DOESN'T SAY ABOUT THE TEAM
    // ============================================================
    markdown += `## 10. What the JD Doesn't Say About the Team\n\n`;
    markdown += `Language patterns in the JD suggest:\n\n`;
    
    let teamInsights = [];
    
    if (repetition_signals?.some(s => s.phrase?.toLowerCase().includes('multi-task') || s.phrase?.toLowerCase().includes('multiple'))) {
      teamInsights.push(`- **The team may be understaffed** – The emphasis on handling multiple tasks often appears when teams are stretched thin`);
    }
    
    if (decision_bottleneck_risk?.risk_level === 'High' || decision_bottleneck_risk?.risk_level === 'Very High') {
      teamInsights.push(`- **Decision-making may be slow** – The JD indicates multiple approval layers or coordination requirements`);
    }
    
    if (stakeholder_complexity?.complexity_level === 'Very High' || stakeholder_complexity?.complexity_level === 'High') {
      teamInsights.push(`- **The role may involve working across silos** – Many stakeholder groups mentioned suggests coordination challenges`);
    }
    
    if (teamInsights.length === 0) {
      teamInsights.push(`- **The JD provides limited information about team dynamics** – Use the interview to ask about team structure and collaboration patterns`);
    }
    
    teamInsights.forEach(insight => {
      markdown += `${insight}\n`;
    });
    markdown += `\n`;
    
    markdown += `**To clarify in the interview:**\n`;
    markdown += `- "How many people are on the project team? How does work get divided?"\n`;
    markdown += `- "Who else would I work with day-to-day outside the formal reporting line?"\n\n`;
  
    // ============================================================
    // SECTION 11: WHAT SUCCESS LIKELY LOOKS LIKE (BEYOND THE JD)
    // ============================================================
    markdown += `## 11. What Success Likely Looks Like (Beyond the JD)\n\n`;
    markdown += `While the JD mentions specific deliverables and milestones, roles like this often measure success by:\n\n`;
    markdown += `- **Keeping stakeholders informed before they ask** – Proactive communication, not just responding to requests\n`;
    markdown += `- **Flagging risks before they become problems** – Early warning, not just crisis management\n`;
    markdown += `- **Making the manager's job easier** – Reducing the need for supervision on routine tasks\n`;
    markdown += `- **Audit-ready documentation** – Files that would survive scrutiny without rework\n\n`;
    
    markdown += `**To clarify:**\n`;
    markdown += `- "Beyond the deliverables in the JD, how will you know I'm succeeding in this role?"\n`;
    markdown += `- "What would make you say 'I'm glad we hired this person' six months from now?"\n\n`;
  
    // ============================================================
    // SECTION 12: RISKS TO INVESTIGATE IN THE INTERVIEW
    // ============================================================
    markdown += `## 12. Risks to Investigate in the Interview\n\n`;
    
    if (decision_bottleneck_risk) {
      markdown += `### Approval Bottlenecks\n`;
      markdown += `${decision_bottleneck_risk.explanation || 'The JD suggests multiple approval layers that may slow down execution.'}\n\n`;
      markdown += `**Question to ask:** "What is the typical approval turnaround time for major project decisions?"\n`;
      if (decision_bottleneck_risk.resume_framing_advice) {
        markdown += `**How to prepare:** ${decision_bottleneck_risk.resume_framing_advice}\n`;
      }
      markdown += `\n`;
    }
    
    if (burnout_risk) {
      markdown += `### Workload Expectations\n`;
      markdown += `${burnout_risk.explanation || 'The JD suggests a high-pressure environment with potential for scope creep.'}\n\n`;
      markdown += `**Question to ask:** "The JD includes 'other duties as assigned.' What percentage of time typically goes to unexpected tasks?"\n`;
      if (burnout_risk.resume_framing_advice) {
        markdown += `**How to prepare:** ${burnout_risk.resume_framing_advice}\n`;
      }
      markdown += `\n`;
    }
    
    if (scale_surge_risk) {
      markdown += `### Project Scale\n`;
      markdown += `${scale_surge_risk.explanation || 'The project may be larger or more complex than the team typically handles.'}\n\n`;
      markdown += `**Question to ask:** "How does this project compare to others the team has managed in terms of scale and complexity?"\n`;
      markdown += `\n`;
    }
    
    if (contradictions_detected && contradictions_detected.length > 0) {
      markdown += `### Contradictions in the JD\n`;
      contradictions_detected.forEach(contradiction => {
        markdown += `- **${contradiction.type || 'Potential contradiction'}** – ${contradiction.explanation || 'The JD contains language that may conflict.'}\n`;
        markdown += `  - **Question to ask:** "The JD mentions both [X] and [Y]. How do these work together in practice?"\n`;
      });
      markdown += `\n`;
    }
  
    // ============================================================
    // SECTION 13: WORDS AND PHRASES TO USE IN YOUR APPLICATION
    // ============================================================
    markdown += `## 13. Words and Phrases to Use in Your Application\n\n`;
    
    if (language_pattern?.resume_framing_tip) {
      markdown += `### In Your Summary\n`;
      markdown += `${language_pattern.resume_framing_tip}\n\n`;
    }
    
    if (repetition_signals && repetition_signals.length > 0) {
      markdown += `### Keywords That Appear Repeatedly in the JD\n\n`;
      repetition_signals.slice(0, 6).forEach(signal => {
        if (!signal.required_vocabulary) {
          markdown += `- **"${signal.phrase}"** – ${signal.signal || 'Appears multiple times, suggesting importance'}\n`;
        }
      });
      markdown += `\n`;
    }
    
    if (hidden_requirements && hidden_requirements.length > 0) {
      markdown += `### Phrases to Demonstrate Hidden Requirements\n\n`;
      hidden_requirements.slice(0, 3).forEach(req => {
        if (req.resume_framing_advice) {
          markdown += `- ${req.resume_framing_advice}\n`;
        }
      });
      markdown += `\n`;
    }
  
    // ============================================================
    // SECTION 14: INTERVIEW PREPARATION
    // ============================================================
    markdown += `## 14. Interview Preparation\n\n`;
    
    markdown += `### Questions You Should Ask\n\n`;
    markdown += `| Category | Question |\n`;
    markdown += `|----------|----------|\n`;
    markdown += `| How work gets done | "What is the typical approval turnaround time for major decisions?" |\n`;
    markdown += `| Team dynamics | "How many people are on the project team? How does work get divided?" |\n`;
    markdown += `| Past performance | "What has been the biggest challenge in keeping this project on track so far?" |\n`;
    markdown += `| Success measures | "Beyond the deliverables, how will you know I'm succeeding?" |\n`;
    if (scope_grade_mismatch?.detected) {
      markdown += `| Role clarity | "How does this role compare to others with similar titles?" |\n`;
    }
    markdown += `\n`;
    
    markdown += `### Questions They May Ask You\n\n`;
    markdown += `| Likely Question | How to Frame Your Answer |\n`;
    markdown += `|-----------------|--------------------------|\n`;
    markdown += `| "Tell me about your experience with [core function]." | Connect your experience directly to what the JD emphasizes. |\n`;
    markdown += `| "How do you handle competing priorities?" | Use a specific example with a clear outcome. |\n`;
    markdown += `| "What is your experience with multi-stakeholder coordination?" | Describe the number and types of stakeholders and how you managed them. |\n`;
    markdown += `| "Are you familiar with [specific technical term from JD]?" | Be honest. If not, show readiness to learn quickly. |\n\n`;
  
    // ============================================================
    // SECTION 15: SPECIFIC ACTIONS TO TAKE BEFORE APPLYING
    // ============================================================
    markdown += `## 15. Specific Actions to Take Before Applying\n\n`;
    markdown += `- [ ] **Revise your summary** – Incorporate keywords and themes from Section 13\n`;
    markdown += `- [ ] **Update relevant bullets** – Add phrases that address the hidden requirements\n`;
    markdown += `- [ ] **Research the organization** – Understand their recent projects in this area\n`;
    markdown += `- [ ] **Prepare examples** – Have specific stories for the likely questions in Section 9\n`;
    markdown += `- [ ] **Clarify your availability** – Based on the timeline in Section 7\n\n`;
  
    // ============================================================
    // SECTION 16: IF YOU GET AN INTERVIEW
    // ============================================================
    markdown += `## 16. If You Get an Interview\n\n`;
    
    markdown += `### Before the Interview\n\n`;
    markdown += `- Research the organization's recent projects and press releases\n`;
    markdown += `- Understand how this role fits into their broader strategy\n`;
    markdown += `- Prepare a 60-second answer to "Why are you interested?" that incorporates what you've learned\n\n`;
    
    markdown += `### Red Flags to Watch For\n\n`;
    markdown += `- Vague answers about reporting lines or approval chains\n`;
    markdown += `- Inability to describe what happened to the previous person in this role\n`;
    markdown += `- The "other duties" clause represents more than 20% of expected workload\n`;
    markdown += `- Reluctance to clarify the title vs. scope discrepancy (if applicable)\n\n`;
  
    // ============================================================
    // FOOTER & DISCLAIMERS
    // ============================================================
    markdown += `---\n\n`;
    markdown += `*This report is based on analysis of the job description. It does not reflect insider knowledge of the organization. Verify all claims in the interview.*\n\n`;
    
    if (analysis_limitations && analysis_limitations.length > 0) {
      markdown += `**Analysis limitations:**\n`;
      analysis_limitations.forEach(limit => {
        markdown += `- ${limit}\n`;
      });
      markdown += `\n`;
    }
    
    if (confidence_statement) {
      markdown += `${confidence_statement}\n\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `**Veritas – See clearly. Act decisively.**\n`;
  
    return markdown;
  }
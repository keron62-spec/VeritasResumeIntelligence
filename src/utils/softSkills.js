// src/utils/softSkills.js

export const SOFT_SKILLS = {
    // Leadership & Management
    leadership: [
      "leadership", "team leadership", "people management", "staff management",
      "supervisory", "supervising", "managing teams", "directing", "mentoring",
      "coaching", "talent development", "succession planning", "performance management",
      "conflict resolution", "mediation", "negotiation", "influencing", "persuasion",
      "decision making", "strategic thinking", "vision setting", "change management"
    ],
    
    // Communication
    communication: [
      "communication", "verbal communication", "written communication", "presentation skills",
      "public speaking", "storytelling", "report writing", "technical writing", "editing",
      "proofreading", "copywriting", "interpersonal skills", "active listening",
      "nonverbal communication", "persuasive communication", "crisis communication",
      "diplomacy", "tactfulness", "negotiation", "mediation", "facilitation"
    ],
    
    // Collaboration & Teamwork
    collaboration: [
      "collaboration", "teamwork", "cross-functional", "multi-stakeholder", "coalition building",
      "partnership development", "alliance management", "relationship management",
      "networking", "team player", "group facilitation", "consensus building",
      "coordination", "liaison", "interface management"
    ],
    
    // Problem Solving & Critical Thinking
    problem_solving: [
      "problem solving", "critical thinking", "analytical thinking", "troubleshooting",
      "root cause analysis", "gap analysis", "solution design", "creative problem solving",
      "design thinking", "systems thinking", "diagnostic skills", "methodical",
      "structured thinking", "hypothesis driven", "issue resolution"
    ],
    
    // Adaptability & Resilience
    adaptability: [
      "adaptability", "flexibility", "resilience", "agile", "fast learner", "quick learner",
      "comfortable with ambiguity", "thrives in change", "handles pressure", "works under pressure",
      "calm under stress", "emotional intelligence", "eq", "self regulation", "growth mindset"
    ],
    
    // Organization & Execution
    organization: [
      "organization", "time management", "prioritization", "project coordination",
      "task management", "deadline driven", "results oriented", "execution focus",
      "detail oriented", "attention to detail", "process improvement", "efficiency",
      "productivity", "workflow management", "multitasking", "follow through"
    ],
    
    // Customer & Stakeholder Focus
    stakeholder_focus: [
      "customer service", "stakeholder management", "client relations", "customer success",
      "user experience", "user centered", "empathy", "relationship building",
      "trust building", "account management", "partner management", "donor relations",
      "beneficiary focus", "patient centered", "community engagement"
    ],
    
    // Innovation & Creativity
    innovation: [
      "innovation", "creativity", "design thinking", "ideation", "brainstorming",
      "conceptualization", "prototyping", "experimentation", "pilot design",
      "test and learn", "curiosity", "continuous learning", "trend spotting"
    ]
  };
  
  export function countSoftSkillCategories(jdText) {
    if (!jdText || typeof jdText !== 'string') return 0;
    const lowerText = jdText.toLowerCase();
    const foundCategories = new Set();
    
    for (const [category, skills] of Object.entries(SOFT_SKILLS)) {
      for (const skill of skills) {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          foundCategories.add(category);
          break;
        }
      }
    }
    return foundCategories.size;
  }
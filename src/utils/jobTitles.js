// src/utils/jobTitles.js

export const JOB_TITLES = {
    executive: [
      "ceo", "cfo", "coo", "cto", "cio", "cmo", "chro", "chief", "executive director",
      "managing director", "general manager", "president", "vice president", "svp", "evp",
      "head of", "country director", "regional director"
    ],
    
    management: [
      "manager", "senior manager", "program manager", "project manager", "product manager",
      "operations manager", "general manager", "department head", "team lead", "supervisor",
      "director", "associate director", "senior director"
    ],
    
    technical: [
      "engineer", "developer", "architect", "analyst", "data scientist", "ml engineer",
      "software engineer", "systems engineer", "network engineer", "devops", "sysadmin",
      "database administrator", "dba", "security analyst", "cloud architect"
    ],
    
    operations: [
      "operations", "coordinator", "specialist", "associate", "administrator", "clerk",
      "assistant", "officer", "analyst", "logistics", "supply chain", "procurement",
      "warehouse", "inventory", "quality", "compliance"
    ],
    
    sales_business: [
      "sales", "business development", "account executive", "account manager", "bd",
      "partnerships", "strategic partnerships", "client relationship", "customer success",
      "revenue", "growth", "commercial", "territory manager", "regional sales"
    ],
    
    marketing_comms: [
      "marketing", "communications", "brand", "content", "social media", "seo", "sem",
      "digital marketing", "growth marketing", "pr", "public relations", "corporate communications",
      "campaign manager", "product marketing"
    ],
    
    finance_accounting: [
      "finance", "accounting", "financial analyst", "accountant", "controller", "treasury",
      "audit", "tax", "fp&a", "budget", "forecasting", "investment", "banking", "credit",
      "risk", "compliance", "actuary"
    ],
    
    legal: [
      "legal", "attorney", "lawyer", "counsel", "paralegal", "compliance officer",
      "regulatory", "contracts", "intellectual property", "litigation", "corporate counsel",
      "general counsel", "legal advisor", "legal analyst"
    ],
    
    healthcare: [
      "doctor", "physician", "nurse", "clinician", "medical", "clinical", "health",
      "public health", "epidemiologist", "pharmacist", "therapist", "radiologist",
      "lab technician", "medical assistant", "healthcare administrator", "hospital",
      "clinic", "patient care", "health services"
    ],
    
    education: [
      "teacher", "professor", "instructor", "lecturer", "educator", "principal",
      "dean", "academic", "curriculum", "instructional", "librarian", "counselor",
      "registrar", "admissions", "student affairs", "faculty"
    ],
    
    hr_people: [
      "hr", "human resources", "recruiter", "talent acquisition", "people operations",
      "hrbp", "hr business partner", "learning and development", "l&d", "training",
      "organizational development", "od", "compensation", "benefits", "payroll",
      "employee relations", "hr generalist"
    ]
  };
  
  export function detectRoleType(jdText) {
    if (!jdText || typeof jdText !== 'string') return "unknown";
    const lowerText = jdText.toLowerCase();
    
    for (const [roleType, titles] of Object.entries(JOB_TITLES)) {
      for (const title of titles) {
        const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          return roleType;
        }
      }
    }
    return "unknown";
  }
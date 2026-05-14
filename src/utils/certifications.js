// src/utils/certifications.js

/**
 * Comprehensive certification dictionary by category
 * Add to this list as new certifications emerge. No worker redeploy needed.
 * Updates instantly when the frontend is rebuilt.
 */

export const CERTIFICATIONS = {
  // Project Management
  project_mgmt: [
    "pmp", "capm", "prince2", "prince2 practitioner", "prince2 foundation",
    "agile", "scrum master", "csm", "psm", "safe", "safe agilist",
    "certified scrum master", "scaled agile", "kanban", "lean six sigma",
    "six sigma", "green belt", "black belt", "itil", "pmi-acp",
    "pgmp", "pfmp", "disciplined agile", "msp", "moP", "apmg"
  ],

  // Cloud & Infrastructure
  cloud_infrastructure: [
    "aws certified", "aws solutions architect", "aws developer",
    "aws sysops", "azure certified", "azure administrator",
    "azure architect", "gcp certified", "google cloud architect",
    "kubernetes", "cka", "ckad", "docker certified",
    "terraform certified", "vmware certified", "openstack",
    "ccna", "ccnp", "ccie", "juniper certified",
    "network+", "security+", "linux+", "mcse", "microsoft certified"
  ],

  // Cybersecurity
  cybersecurity: [
    "cissp", "cism", "cisa", "ceh", "oscp",
    "gsec", "gcfa", "gcih", "ccsp", "cyberops",
    "casp+",
    "iso 27001 lead auditor", "iso 27001 lead implementer",
    "crisc", "comptia security+", "security analyst"
  ],

  // Data & AI
  data_ai: [
    "artificial intelligence","tableau certified",
    "power bi certified", "sql certified", "google data analytics",
    "ibm data science", "azure ai engineer",
    "aws machine learning", "tensorflow developer",
    "sas certified", "cloudera certified", "snowflake certified",
    "databricks certified", "deep learning specialization",
    "prompt engineering", "generative ai"
  ],

  // Software Engineering
  software_engineering: [
    "oracle java certified", "java certified", "python institute",
    "pcap", "pcpp", "microsoft developer",
    "salesforce developer", "scrum developer",
    "certified kubernetes application developer",
    "red hat certified engineer", "rhce", "rhcsa",
    "oracle certified professional",
  ],

  // Finance & Accounting
  finance_accounting: [
    "cfa", "cpa", "acca", "cma", "ca", "cima",
    "frm", "cfp", "ea", "cia", "cfe",
    "financial modeling", "quickbooks certified",
    "xero advisor", "sap fico", "investment foundations",
    "ifrs certification", "treasury professional", "ctp"
  ],

  // Human Resources
  hr: [
    "shrm-cp", "shrm-scp", "phr", "sphr", "gphr",
    "cipd", "talent management practitioner", "workday hcm",
    "hr analytics", "people analytics", "certified recruiter"
  ],

  // Healthcare & Public Health
  healthcare_public_health: [
    "cph", "mph", "public health certification",
    "lean healthcare", "health informatics",
    "epidemiology certification", "infection prevention",
    "icd-10 certification", "icd-11 certification",
    "medical coding", "cpc", "rhia", "rhit", "gcp certification",
    "bls", "acls", "pals", "nih stroke scale",
    "emergency management", "incident command system"
  ],

  // Monitoring, Evaluation & Development
  monitoring_evaluation: [
    "monitoring and evaluation", "m&e certification",
    "results based management", "logframe",
    "theory of change", "project dpro",
    "grant management", "usaid certification",
    "humanitarian response", "sphere standards",
    "donor compliance",
  ],

  // Supply Chain & Procurement
  supply_chain_procurement: [
    "cscp", "cpim", "cltd", "procurement certification",
    "SCMP", "logistics certification",
    "sap mm", "sap scm", "warehouse management",
    "inventory management", "lean logistics",
    "chartered institute of procurement",
    "cips", "certified purchasing manager"
  ],

  // Quality & Operations
  quality_operations: [
    "iso 9001 lead auditor", "iso 14001",
    "iso 45001", "quality management",
    "lean practitioner", 
    "kaizen", "tqm", "root cause analysis", "Six Sigma"
  ],

  // Legal & Compliance
  legal_compliance: [
    "certified compliance officer", "aml certification",
    "kyc certification", "gdpr certification",
    "privacy professional", "cipm", "cipp",
    " CPCM",
    "regulatory affairs certification"
  ],

  // Education & Training
  education_training: [
    "tesol", "tefl", "instructional design",
    "adult learning", "curriculum development",
    "google educator", "microsoft educator",
    "moodle certified",
  ],

  // Marketing & Communications
  marketing_communications: [
    "google ads", "google analytics",
    "hubspot certified", "facebook blueprint",
    "seo certification", "content marketing",
    "digital marketing institute", "email marketing"
  ],

  // Design & Creative
  design_creative: [
    "adobe certified", "ux certification",
    "ui certification",
    "autodesk certified", "revit certified",
    "solidworks certified", "video editing certification",
    "motion graphics", "creative direction"
  ],

  // Engineering & Manufacturing
  engineering_manufacturing: [
    "pe license", "fe exam", "autocad certified",
    "solidworks","catia certification",
    "osha certification", "nebosh", "hazmat"
  ],

  // Energy & Environment
  energy_environment: [
    "leed ap", "energy auditor",
    "environmental management", "sustainability reporting",
    "esg certification", "carbon accounting", "iso 50001"
  ],

  // Aviation & Maritime
  aviation_maritime: [
    "iata certification", "icao certification",
    "aviation safety", "air traffic control",
    "maritime security",
    "stcw", "customs compliance",
    "dangerous goods certification"
  ],

  // Security & Defense
  security_defense: [
    "unclos", "iatg", "mosaic",
    "weapons management", "ammunition management", "marsec"
  ],

  // Research & Analytics
  research_analytics: ["sas certification", "stata certification",
    "spss certification", "nvivo certification"
  ],

  // Agriculture & Food Systems
  agriculture_food: [
    "food safety", "haccp", "organic certification",
    "farm management", "nutrition certification"
  ],

  // Hospitality & Tourism
  hospitality_tourism: ["culinary certification", "food service management"],

  // Real Estate & Construction
  construction_real_estate: [
    "primavera p6", "CCM",
    "quantity surveying", "CPM",
    "real estate license", "facility management",
    "bim certification"
  ],

  // Languages & International Affairs
  languages_international: [
    "delf", "dele", "jlpt", "toefl", "ielts",
    "translation certification", "interpretation certification"],

  // Business & Leadership
  business_leadership: [
    "mba", "management certification",
   , "business analysis", "cbap",
    "change management", "prosci", "organizational development",
    "coaching certification", "icf accredited"
  ],

  // Sales & Customer Success
  sales_customer_success: [
    "sales certification", "certified sales professional", "customer experience certification",
    "sandler sales", "challenger sale", "spin selling",
    "negotiation certification"],

  // Risk Management
  risk_management: [
    "frm", "prm", "financial risk manager","enterprise risk management", "erm certification",
    "business continuity", "bcp certification",]
};

/**
 * Escapes special regex characters in a string
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  // SAFETY: Return empty string if input is invalid
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Counts certification categories mentioned in a job description
 * @param {string} jdText - The job description text
 * @returns {number} Count of unique certification categories found
 */
export function countCertifications(jdText) {
  // SAFETY: Return 0 if input is invalid
  if (!jdText || typeof jdText !== 'string' || jdText.trim().length === 0) return 0;
  
  const lowerText = jdText.toLowerCase();
  let foundCategories = new Set();
  
  for (const [category, certs] of Object.entries(CERTIFICATIONS)) {
    if (!Array.isArray(certs)) continue;
    for (const cert of certs) {
      // Skip invalid cert entries
      if (!cert || typeof cert !== 'string') continue;
      // Match whole words or phrases (not substrings)
      const regex = new RegExp(`\\b${escapeRegex(cert)}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundCategories.add(category);
        break; // Count category once even if multiple certs from same category found
      }
    }
  }
  
  return foundCategories.size;
}

/**
 * Gets detailed certification match information
 * @param {string} jdText - The job description text
 * @returns {Object} Detailed breakdown of matches by category
 */
export function getCertificationDetails(jdText) {
  // SAFETY: Return empty result if input is invalid
  if (!jdText || typeof jdText !== 'string' || jdText.trim().length === 0) {
    return { total_count: 0, matches: {} };
  }
  
  const lowerText = jdText.toLowerCase();
  const matches = {};
  let totalCount = 0;
  
  for (const [category, certs] of Object.entries(CERTIFICATIONS)) {
    if (!Array.isArray(certs)) continue;
    const categoryMatches = [];
    for (const cert of certs) {
      // Skip invalid cert entries
      if (!cert || typeof cert !== 'string') continue;
      const regex = new RegExp(`\\b${escapeRegex(cert)}\\b`, 'i');
      if (regex.test(lowerText)) {
        categoryMatches.push(cert);
      }
    }
    if (categoryMatches.length > 0) {
      matches[category] = categoryMatches;
      totalCount++;
    }
  }
  
  return {
    total_count: totalCount,
    matches: matches
  };
}
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
      "cissp", "cism", "cisa", "ceh", "oscp", "sans",
      "gsec", "gcfa", "gcih", "ccsp", "cyberops",
      "casp+", "penetration tester", "ethical hacker",
      "iso 27001 lead auditor", "iso 27001 lead implementer",
      "crisc", "comptia security+", "security analyst"
    ],
  
    // Data & AI
    data_ai: [
      "data analyst", "data scientist", "machine learning",
      "artificial intelligence", "tableau certified",
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
      "pcap", "pcpp", "microsoft developer", "full stack developer",
      "salesforce developer", "scrum developer",
      "certified kubernetes application developer",
      "red hat certified engineer", "rhce", "rhcsa",
      "oracle certified professional", "devops engineer"
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
      "cipd", "talent management practitioner",
      "human capital strategist", "workday hcm",
      "hr analytics", "people analytics", "certified recruiter"
    ],
  
    // Healthcare & Public Health
    healthcare_public_health: [
      "cph", "mph", "public health certification",
      "lean healthcare", "health informatics",
      "epidemiology certification", "infection prevention",
      "icd-10 certification", "icd-11 certification",
      "medical coding", "cpc", "rhia", "rhit",
      "clinical research associate", "gcp certification",
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
      "donor compliance", "proposal development"
    ],
  
    // Supply Chain & Procurement
    supply_chain_procurement: [
      "cscp", "cpim", "cltd", "procurement certification",
      "supply chain professional", "logistics certification",
      "sap mm", "sap scm", "warehouse management",
      "inventory management", "lean logistics",
      "chartered institute of procurement",
      "cips", "certified purchasing manager"
    ],
  
    // Quality & Operations
    quality_operations: [
      "iso 9001 lead auditor", "iso 14001",
      "iso 45001", "quality management",
      "lean practitioner", "operational excellence",
      "kaizen", "tqm", "continuous improvement",
      "root cause analysis", "business process management"
    ],
  
    // Legal & Compliance
    legal_compliance: [
      "certified compliance officer", "aml certification",
      "kyc certification", "gdpr certification",
      "privacy professional", "cipm", "cipp",
      "contract management", "legal operations",
      "regulatory affairs certification"
    ],
  
    // Education & Training
    education_training: [
      "tesol", "tefl", "instructional design",
      "adult learning", "curriculum development",
      "google educator", "microsoft educator",
      "moodle certified", "training facilitator",
      "corporate trainer"
    ],
  
    // Marketing & Communications
    marketing_communications: [
      "google ads", "google analytics",
      "hubspot certified", "facebook blueprint",
      "seo certification", "content marketing",
      "digital marketing institute", "email marketing",
      "brand management", "public relations"
    ],
  
    // Design & Creative
    design_creative: [
      "adobe certified", "ux certification",
      "ui certification", "graphic design",
      "autodesk certified", "revit certified",
      "solidworks certified", "video editing certification",
      "motion graphics", "creative direction"
    ],
  
    // Engineering & Manufacturing
    engineering_manufacturing: [
      "pe license", "fe exam", "autocad certified",
      "solidworks", "catia certification",
      "industrial engineering", "manufacturing engineer",
      "quality engineer", "reliability engineer",
      "osha certification", "nebosh", "hazmat"
    ],
  
    // Energy & Environment
    energy_environment: [
      "leed ap", "energy auditor", "renewable energy",
      "environmental management", "sustainability reporting",
      "esg certification", "carbon accounting",
      "climate risk", "iso 50001"
    ],
  
    // Aviation & Maritime
    aviation_maritime: [
      "iata certification", "icao certification",
      "aviation safety", "air traffic control",
      "maritime security", "port operations",
      "stcw", "customs compliance",
      "dangerous goods certification"
    ],
  
    // Security & Defense
    security_defense: [
      "unclos", "iatg", "mosaic", "arms control",
      "security sector reform", "crisis management",
      "disaster risk reduction", "humanitarian logistics",
      "peacekeeping operations", "counter terrorism",
      "weapons management", "ammunition management", "marsec"
    ],
  
    // Research & Analytics
    research_analytics: [
      "research methods", "biostatistics",
      "sas certification", "stata certification",
      "spss certification", "nvivo certification",
      "qualitative research", "quantitative research",
      "policy analysis", "economic analysis"
    ],
  
    // Agriculture & Food Systems
    agriculture_food: [
      "food safety", "haccp", "agriculture extension",
      "precision agriculture", "organic certification",
      "farm management", "nutrition certification",
      "food systems", "livestock management"
    ],
  
    // Hospitality & Tourism
    hospitality_tourism: [
      "hotel management", "hospitality management",
      "tourism management", "event planning",
      "culinary certification", "food service management",
      "customer experience", "guest relations"
    ],
  
    // Real Estate & Construction
    construction_real_estate: [
      "primavera p6", "construction management",
      "quantity surveying", "property management",
      "real estate license", "facility management",
      "bim certification", "site supervision"
    ],
  
    // Languages & International Affairs
    languages_international: [
      "delf", "dele", "jlpt", "toefl", "ielts",
      "translation certification", "interpretation certification",
      "diplomatic protocol", "international relations",
      "foreign service"
    ],
  
    // Business & Leadership
    business_leadership: [
      "mba", "executive leadership", "management certification",
      "strategic planning", "business analysis", "cbap",
      "change management", "prosci", "organizational development",
      "coaching certification", "icf accredited", "mentoring"
    ],
  
    // Sales & Customer Success
    sales_customer_success: [
      "sales certification", "certified sales professional",
      "customer success manager", "customer experience certification",
      "sandler sales", "challenger sale", "spin selling",
      "negotiation certification", "account management"
    ],
  
    // Risk Management
    risk_management: [
      "frm", "prm", "financial risk manager",
      "operational risk", "credit risk", "market risk",
      "enterprise risk management", "erm certification",
      "business continuity", "bcp certification", "crisis management"
    ]
  };
  
  /**
   * Escapes special regex characters in a string
   * @param {string} str - Input string
   * @returns {string} Escaped string
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Counts certification categories mentioned in a job description
   * @param {string} jdText - The job description text
   * @returns {number} Count of unique certification categories found
   */
  export function countCertifications(jdText) {
    if (!jdText || typeof jdText !== 'string') return 0;
    
    const lowerText = jdText.toLowerCase();
    let foundCategories = new Set();
    
    for (const [category, certs] of Object.entries(CERTIFICATIONS)) {
      for (const cert of certs) {
        // Match whole words or phrases (not substrings)
        // Example: "PMP" should match "PMP" but not "PMP-ACP" (handled by word boundary)
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
    if (!jdText || typeof jdText !== 'string') return { total_count: 0, matches: {} };
    
    const lowerText = jdText.toLowerCase();
    const matches = {};
    let totalCount = 0;
    
    for (const [category, certs] of Object.entries(CERTIFICATIONS)) {
      const categoryMatches = [];
      for (const cert of certs) {
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
// src/utils/domainPatterns.js

/**
 * Domain Pattern Library v1.0
 * Sector-aware pattern matching for job descriptions
 * Used by featureExtractor.js to pre-compute domain term counts for the worker
 */

// ============================================================
// SECTOR PATTERNS (25+ per sector, organized by category)
// ============================================================

export const SECTOR_DOMAIN_PATTERNS = {
    // ============================================================
    // HEALTH_PUBLIC – Public Health / Regional Health Agencies
    // ============================================================
    HEALTH_PUBLIC: {
      // Core domain terms (25+)
      all_terms: [
        "public health", "epidemiology", "surveillance", "health systems", "pandemic",
        "vaccination", "immunization", "disease control", "infection prevention",
        "health security", "outbreak", "contact tracing", "biosafety", "biosecurity",
        "clinical", "medical", "healthcare", "one health", "zoonotic", "vector borne",
        "foodborne", "laboratory systems", "diagnostics", "reference laboratory",
        "field epidemiology", "health emergency", "risk communication", "community health",
        "health promotion", "disease surveillance", "health information systems",
        "regulatory affairs", "health policy", "health legislation", "international health regulations",
        "ihr", "public health preparedness", "health workforce", "primary health care"
      ],
      // Compliance/regulatory terms
      regulatory_terms: [
        "regulatory", "compliance", "accreditation", "licensing", "inspection",
        "governance", "protocol", "standard", "policy", "guideline", "framework",
        "in accordance with", "no objection", "justification", "counterpart funding",
        "terms of reference", "standard operating procedure", "sop", "code of conduct",
        "ethics", "data protection", "confidentiality", "informed consent", "good clinical practice",
        "gcp", "good laboratory practice", "glp", "quality assurance", "audit"
      ],
      // Crisis/emergency terms
      crisis_terms: [
        "emergency", "outbreak", "pandemic", "crisis", "response", "surge",
        "disaster", "rapid response", "urgent", "immediate", "critical",
        "public health emergency of international concern", "pheic", "epidemic",
        "containment", "mitigation", "crisis management", "business continuity",
        "emergency operations center", "eoc", "incident command", "disaster risk reduction",
        "humanitarian", "resilience", "early warning", "alert", "rapid assessment",
        "mass casualty", "quarantine", "isolation", "lockdown", "health crisis"
      ],
      // Stakeholder terms
      stakeholder_terms: [
        "member states", "government", "ministry", "national authority",
        "international organization", "donor", "who", "paho", "cdc", "un",
        "idb", "world bank", "carpha", "caricom", "unicef", "undp",
        "global fund", "gavi", "red cross", "ifrc", "msf", "civil society",
        "community", "faith based organizations", "private sector", "pharmaceutical",
        "academia", "research institutions", "laboratories", "health facilities",
        "hospitals", "clinics", "health workers", "professional associations"
      ]
    },
  
    // ============================================================
    // INTL_DEV – International Development / Donor Funded
    // ============================================================
    INTL_DEV: {
      all_terms: [
        "international development", "humanitarian", "grant management",
        "donor compliance", "usaid", "world bank", "un", "undp", "unicef",
        "logframe", "logical framework", "monitoring", "evaluation", "m&e",
        "results based management", "theory of change", "outcome mapping",
        "capacity building", "technical assistance", "sustainable development",
        "sdg", "millennium development goals", "poverty reduction", "food security",
        "gender equality", "social protection", "governance", "rule of law",
        "human rights", "democracy", "civil society strengthening", "community development",
        "rural development", "urban development", "climate adaptation", "disaster risk reduction",
        "resilience building", "peacebuilding", "conflict sensitivity", "do no harm"
      ],
      regulatory_terms: [
        "compliance", "donor compliance", "procurement", "audit", "reporting requirement",
        "milestone", "deliverable", "terms of reference", "scope of work", "request for proposal",
        "rfp", "invitation to bid", "cost share", "matching funds", "subgrant",
        "subcontract", "memorandum of understanding", "mou", "cooperative agreement",
        "grant agreement", "disbursement", "reimbursement", "advance", "financial report",
        "narrative report", "quarterly report", "annual report", "final report"
      ],
      crisis_terms: [
        "humanitarian", "crisis", "emergency", "disaster", "relief", "recovery",
        "resilience", "fragile context", "conflict zone", "post conflict",
        "natural disaster", "food crisis", "nutrition crisis", "displacement",
        "refugee", "internally displaced", "idp", "migration", "complex emergency",
        "early recovery", "transition", "reconstruction", "peacekeeping", "stabilization"
      ],
      stakeholder_terms: [
        "beneficiary", "government", "donor", "implementing partner",
        "civil society", "community", "local ngo", "international ngo",
        "un agency", "multilateral", "bilateral", "private sector",
        "contractor", "consultant", "subgrantee", "community based organization",
        "cbo", "faith based organization", "fbo", "academia", "research institution",
        "private foundation", "corporate foundation", "social enterprise", "cooperative"
      ]
    },
  
    // ============================================================
    // MANUFACTURING / LOGISTICS
    // ============================================================
    MANUFACTURING: {
      all_terms: [
        "manufacturing", "production", "assembly line", "quality control",
        "lean manufacturing", "six sigma", "kaizen", "oee", "overall equipment effectiveness",
        "throughput", "capacity planning", "inventory management", "supply chain",
        "logistics", "material requirements planning", "mrp", "production scheduling",
        "shop floor", "quality assurance", "iso", "waste reduction", "cycle time",
        "changeover", "smed", "single minute exchange of die", "tpm", "total productive maintenance",
        "value stream mapping", "kanban", "just in time", "jit", "andon", "poka yoke",
        "root cause analysis", "five whys", "fishbone diagram", "control plan", "statistical process control",
        "spc", "first pass yield", "overall throughput", "production planning", "demand planning"
      ],
      regulatory_terms: [
        "iso", "compliance", "quality standard", "regulation", "safety standard",
        "osha", "environmental compliance", "industry standard", "ansi", "asme",
        "iec", "iec 61511", "sil assessment", "api standards", "iatf 16949",
        "as9100", "iso 13485", "iso 9001", "iso 14001", "iso 45001", "ce marking",
        "ul certification", "rohs", "reach", "haccp", "gmp", "good manufacturing practice"
      ],
      crisis_terms: [
        "supply chain disruption", "shortage", "production halt", "equipment failure",
        "downtime", "backlog", "demand surge", "capacity constraint", "bottleneck",
        "quality issue", "recall", "supplier failure", "logistics breakdown", "shipping delay"
      ],
      stakeholder_terms: [
        "supplier", "vendor", "distributor", "wholesaler", "retailer", "customer",
        "logistics provider", "3pl", "third party logistics", "freight forwarder",
        "carrier", "warehouse operator", "original equipment manufacturer", "oem",
        "contract manufacturer", "cm", "value added reseller", "var", "end user"
      ]
    },
  
    // ============================================================
    // TECH_STARTUP / SAAS
    // ============================================================
    TECH_STARTUP: {
      all_terms: [
        "agile", "scrum", "mvp", "minimum viable product", "product market fit",
        "scale", "venture", "startup", "saas", "platform", "user growth",
        "retention", "conversion", "churn", "active users", "product roadmap",
        "feature launch", "technical debt", "pivot", "series funding", "runway",
        "customer acquisition", "lifetime value", "ltv", "customer acquisition cost",
        "cac", "monthly recurring revenue", "mrr", "annual recurring revenue", "arr",
        "gross merchandise value", "gmv", "burn rate", "freemium", "tiered pricing",
        "api first", "cloud native", "microservices", "devops", "ci/cd", "continuous integration",
        "continuous deployment", "a/b testing", "experimentation", "product led growth", "plg"
      ],
      regulatory_terms: [
        "compliance", "data privacy", "gdpr", "ccpa", "soc 2", "iso 27001",
        "hipaa", "pci dss", "terms of service", "privacy policy", "security compliance"
      ],
      crisis_terms: [
        "outage", "downtime", "security breach", "data leak", "customer churn spike",
        "cash flow", "runway", "fundraising", "down round", "layoff", "restructuring"
      ],
      stakeholder_terms: [
        "investor", "venture capital", "angel investor", "board member", "advisor",
        "customer", "user", "beta tester", "early adopter", "partner", "integrations partner",
        "channel partner", "reseller", "system integrator", "consultant"
      ]
    },
  
    // ============================================================
    // FINANCE_CORP / ACCOUNTING
    // ============================================================
    FINANCE_CORP: {
      all_terms: [
        "financial analysis", "fp&a", "budgeting", "forecasting", "variance analysis",
        "audit", "internal audit", "compliance", "tax", "treasury", "risk management",
        "investment", "banking", "capital markets", "equity research", "financial modeling",
        "valuation", "mergers", "acquisitions", "due diligence", "credit analysis",
        "liquidity", "cash flow", "working capital", "financial reporting", "gaap",
        "ifrs", "sec filing", "10k", "10q", "8k", "internal controls", "sox",
        "sarbanes oxley", "financial statement", "balance sheet", "income statement",
        "cash flow statement", "financial ratios", "profitability", "margin analysis",
        "cost accounting", "managerial accounting", "tax planning", "transfer pricing"
      ],
      regulatory_terms: [
        "compliance", "regulation", "sec", "financial reporting", "gaap", "ifrs",
        "sox", "internal controls", "audit trail", "regulatory filing", "basel",
        "dodd frank", "anti money laundering", "aml", "know your customer", "kyc",
        "fatca", "crs", "sustainable finance", "esg reporting", "sfdr", "tcfd"
      ],
      crisis_terms: [
        "liquidity crisis", "cash crunch", "credit default", "bankruptcy", "restructuring",
        "turnaround", "distressed asset", "non performing loan", "write down", "impairment",
        "foreclosure", "insolvency", "receivership", "special administration"
      ],
      stakeholder_terms: [
        "auditor", "regulator", "tax authority", "investor", "shareholder", "board",
        "audit committee", "finance committee", "bank", "lender", "creditor", "rating agency",
        "financial advisor", "investment banker", "legal counsel", "external auditor"
      ]
    },
  
    // ============================================================
    // ENERGY / UTILITIES
    // ============================================================
    ENERGY: {
      all_terms: [
        "renewable energy", "solar", "wind", "petroleum", "oil and gas",
        "grid operations", "energy trading", "carbon", "emissions", "sustainability",
        "esg", "power plant", "utility", "electricity markets", "capacity market",
        "renewable portfolio standard", "energy storage", "battery storage",
        "microgrid", "smart grid", "energy efficiency", "hydropower", "geothermal",
        "bioenergy", "biomass", "nuclear", "fossil fuels", "natural gas", "lng",
        "refining", "petrochemical", "upstream", "downstream", "midstream",
        "exploration", "production", "transmission", "distribution", "retail energy",
        "demand response", "net metering", "feed in tariff", "power purchase agreement"
      ],
      regulatory_terms: [
        "regulation", "ferc", "public utility commission", "puc", "environmental regulation",
        "epa", "emissions trading", "carbon credit", "renewable energy certificate",
        "rec", "grid code", "interconnection agreement", "environmental impact assessment",
        "eia", "permit", "license", "concession", "royalty", "production sharing agreement"
      ],
      crisis_terms: [
        "grid failure", "blackout", "brownout", "supply disruption", "price spike",
        "fuel shortage", "pipeline leak", "spill", "blowout", "well control incident",
        "natural disaster", "extreme weather", "cyber attack grid", "physical security"
      ],
      stakeholder_terms: [
        "regulator", "independent system operator", "iso", "regional transmission organization",
        "rto", "utility", "generator", "transmission operator", "distribution company",
        "load serving entity", "lse", "retail energy provider", "aggregator", "consumer",
        "industrial customer", "commercial customer", "residential customer", "community"
      ]
    },
  
    // ============================================================
    // CONSTRUCTION / ENGINEERING
    // ============================================================
    CONSTRUCTION: {
      all_terms: [
        "construction", "civil engineering", "structural engineering", "geotechnical",
        "blueprint", "cad", "bim", "building information modeling", "project scheduling",
        "primavera p6", "critical path method", "cpm", "site supervision", "osha",
        "safety", "permitting", "building codes", "inspection", "subcontractor management",
        "change order", "claims management", "quality control", "concrete", "steel",
        "foundation", "earthwork", "grading", "paving", "utilities", "mep", "mechanical electrical plumbing",
        "hvac", "fire protection", "plumbing", "electrical", "low voltage", "security systems",
        "finish work", "landscaping", "road construction", "bridge construction", "tunnel construction"
      ],
      regulatory_terms: [
        "building code", "safety regulation", "osha", "environmental regulation",
        "zoning", "land use", "permit", "license", "inspection", "certificate of occupancy",
        "code compliance", "accessibility", "ada", "lead paint", "asbestos", "soil remediation"
      ],
      crisis_terms: [
        "safety incident", "accident", "injury", "fatality", "structural failure",
        "collapse", "material shortage", "labor shortage", "weather delay", "schedule slip",
        "cost overrun", "budget overrun", "design error", "defective work", "rework"
      ],
      stakeholder_terms: [
        "client", "owner", "architect", "engineer", "general contractor", "subcontractor",
        "supplier", "vendor", "material supplier", "equipment rental", "inspector",
        "building official", "fire marshal", "utility company", "neighborhood",
        "community", "labor union", "trade union", "safety officer", "quality control officer"
      ]
    },
  
    // ============================================================
    // RETAIL / CONSUMER GOODS
    // ============================================================
    RETAIL_CONSUMER: {
      all_terms: [
        "retail", "merchandising", "planogram", "inventory turns", "sell through",
        "category management", "e commerce", "omnichannel", "store operations",
        "point of sale", "customer acquisition", "average transaction value", "atv",
        "conversion rate", "foot traffic", "shrinkage", "loss prevention",
        "visual merchandising", "assortment planning", "pricing strategy", "promotion",
        "markdown optimization", "inventory accuracy", "cycle counting", "stock to sales ratio",
        "open to buy", "otb", "retail math", "gross margin return on investment", "gmroi",
        "sales per square foot", "units per transaction", "upt", "customer lifetime value"
      ],
      regulatory_terms: [
        "consumer protection", "product safety", "cpsc", "food safety", "fda",
        "weights and measures", "labeling", "advertising compliance", "gift card law",
        "return policy", "data privacy", "payment card industry", "pci", "sales tax"
      ],
      crisis_terms: [
        "supply chain disruption", "out of stock", "os", "overstock", "inventory write down",
        "shrinkage spike", "theft", "fraud", "returns surge", "customer complaint escalation",
        "social media crisis", "pr crisis", "product recall", "safety recall"
      ],
      stakeholder_terms: [
        "customer", "shopper", "consumer", "vendor", "supplier", "wholesaler", "distributor",
        "merchandise planner", "buyer", "store manager", "district manager", "regional manager",
        "loss prevention", "marketing team", "e commerce team", "logistics team", "warehouse"
      ]
    },
  
    // ============================================================
    // EDUCATION / ACADEMIA
    // ============================================================
    EDUCATION: {
      all_terms: [
        "curriculum development", "instructional design", "accreditation",
        "student affairs", "faculty development", "e learning", "lms", "learning management system",
        "pedagogy", "enrollment", "admissions", "student retention", "graduation rates",
        "assessment", "evaluation", "learning outcomes", "competency based education",
        "adult learning", "continuing education", "distance learning", "online education",
        "blended learning", "synchronous learning", "asynchronous learning", "course design",
        "lesson planning", "teaching methodology", "classroom management", "student engagement",
        "academic advising", "career counseling", "student services", "registrar", "transcript"
      ],
      regulatory_terms: [
        "accreditation", "regional accreditation", "national accreditation", "title iv",
        "federal student aid", "ferpa", "family educational rights and privacy act",
        "state authorization", "program approval", "licensing", "certification", "compliance"
      ],
      crisis_terms: [
        "enrollment decline", "budget cut", "program closure", "accreditation probation",
        "student protest", "faculty strike", "pandemic disruption", "remote learning transition"
      ],
      stakeholder_terms: [
        "student", "faculty", "professor", "instructor", "teacher", "administrator",
        "dean", "department chair", "provost", "president", "chancellor", "board of trustees",
        "alumni", "parent", "employer", "accreditor", "department of education", "legislature"
      ]
    },
  
    // ============================================================
    // DEFAULT / OTHER (Fallback with 50+ terms)
    // ============================================================
    OTHER: {
      all_terms: [
        "project management", "operations", "quality", "compliance", "risk management",
        "stakeholder engagement", "capacity building", "technical assistance",
        "data analysis", "reporting", "coordination", "liaison", "logistics",
        "procurement", "budgeting", "forecasting", "strategic planning",
        "performance monitoring", "evaluation", "audit", "governance", "policy",
        "regulation", "process improvement", "change management", "communication",
        "training", "facilitation", "negotiation", "relationship management",
        "fisheries", "marine biology", "stock assessment", "arms control",
        "weapons management", "security studies", "public health", "health system",
        "clinical", "medical", "supply chain", "inventory", "warehousing",
        "distribution", "customer service", "sales", "marketing", "human resources",
        "legal", "compliance", "information technology", "cybersecurity", "data privacy"
      ],
      regulatory_terms: [
        "compliance", "regulation", "policy", "framework", "governance", "procedure",
        "standard", "protocol", "approval", "authorization", "audit", "inspection",
        "licensing", "certification", "accreditation", "terms of reference", "scope of work",
        "memorandum of understanding", "mou", "non disclosure agreement", "nda",
        "data protection", "confidentiality", "code of conduct", "ethics", "due diligence"
      ],
      crisis_terms: [
        "emergency", "crisis", "urgent", "immediate", "critical", "time sensitive",
        "deadline driven", "pressure", "rapid response", "disaster", "outbreak",
        "pandemic", "conflict", "disruption", "shortage", "failure", "recovery",
        "business continuity", "contingency", "risk mitigation", "problem solving"
      ],
      stakeholder_terms: [
        "stakeholder", "partner", "collaborator", "coordinator", "liaison", "representative",
        "committee", "working group", "task force", "board", "council", "advisory group",
        "consultant", "contractor", "vendor", "supplier", "customer", "client", "end user",
        "government", "regulator", "donor", "funder", "community", "beneficiary"
      ]
    }
  };
  
  // ============================================================
  // HELPER FUNCTIONS FOR FEATURE EXTRACTOR
  // ============================================================
  
  /**
   * Counts occurrences of patterns in text for a specific category
   * @param {string} text - The text to search
   * @param {string} sector - The sector code (e.g., 'HEALTH_PUBLIC')
   * @param {string} category - The pattern category ('all_terms', 'regulatory_terms', 'crisis_terms', 'stakeholder_terms')
   * @returns {number} Count of matched terms
   */
  export function countDomainTermsByCategory(text, sector, category) {
    if (!text || typeof text !== 'string') return 0;
    if (!SECTOR_DOMAIN_PATTERNS[sector]) sector = 'OTHER';
    
    const patterns = SECTOR_DOMAIN_PATTERNS[sector];
    const terms = patterns[category];
    
    if (!terms || !Array.isArray(terms)) return 0;
    
    const lowerText = text.toLowerCase();
    let count = 0;
    
    for (const term of terms) {
      // Escape regex special characters
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Extracts ALL domain features for a given sector
   * @param {string} text - The text to analyze (job description)
   * @param {string} sector - The sector code
   * @returns {Object} Complete domain feature set
   */
  export function extractDomainFeatures(text, sector) {
    const safeSector = SECTOR_DOMAIN_PATTERNS[sector] ? sector : 'OTHER';
    
    return {
      sector_used: safeSector,
      domain_term_count: countDomainTermsByCategory(text, safeSector, 'all_terms'),
      regulatory_term_count: countDomainTermsByCategory(text, safeSector, 'regulatory_terms'),
      crisis_term_count: countDomainTermsByCategory(text, safeSector, 'crisis_terms'),
      stakeholder_term_count: countDomainTermsByCategory(text, safeSector, 'stakeholder_terms')
    };
  }
  
  /**
   * Gets the sector-specific term list for debugging or UI display
   * @param {string} sector - The sector code
   * @param {string} category - The pattern category
   * @returns {Array} Array of terms
   */
  export function getSectorTerms(sector, category = 'all_terms') {
    const safeSector = SECTOR_DOMAIN_PATTERNS[sector] ? sector : 'OTHER';
    return SECTOR_DOMAIN_PATTERNS[safeSector][category] || [];
  }
  
  // ============================================================
  // EXPORT ALL SECTOR CODES FOR USE ELSEWHERE
  // ============================================================
  
  export const SECTOR_CODES = Object.keys(SECTOR_DOMAIN_PATTERNS);
// src/utils/skillDictionary.js

/**
 * Comprehensive technical skills dictionary.
 * Organized by category for maintainability and potential future filtering.
 * Add new skills here as they emerge. No worker redeploy needed.
 */

// ============================================================
// PROGRAMMING LANGUAGES
// ============================================================
export const PROGRAMMING_LANGUAGES = [
    "python", "r", "sql", "nosql", "mysql", "postgresql", "mongodb", "redis", "sqlite",
    "mariadb", "cassandra", "dynamodb", "neo4j", "influxdb", "couchdb", "firebase",
    "elasticsearch", "opensearch", "hive", "hbase", "presto", "trino", "vertica",
    "clickhouse", "greenplum", "bigtable", "cosmos db", "oracle db", "db2", "snowflake",
    "bigquery", "redshift", "teradata", "java", "javascript", "typescript", "c++", "c#",
    "c", "go", "golang", "rust", "scala", "perl", "ruby", "php", "swift", "kotlin",
    "matlab", "julia", "fortran", "cobol", "vb.net", "objective-c", "dart", "lua",
    "haskell", "ocaml", "groovy", "elixir", "erlang", "assembly", "bash", "shell scripting",
    "powershell"
  ];
  
  // ============================================================
  // FRONTEND & UI
  // ============================================================
  export const FRONTEND_SKILLS = [
    "html5", "css3", "sass", "scss", "less", "react", "angular", "vue", "next.js", "nuxt",
    "svelte", "solidjs", "bootstrap", "tailwind", "material ui", "chakra ui", "redux",
    "mobx", "rxjs", "webpack", "vite", "parcel", "babel", "jquery"
  ];
  
  // ============================================================
  // BACKEND & FRAMEWORKS
  // ============================================================
  export const BACKEND_SKILLS = [
    "node.js", "express", "nestjs", "django", "flask", "fastapi", "spring", "spring boot",
    "hibernate", "laravel", "symfony", "ruby on rails", "asp.net", "asp.net core", "phoenix",
    "cakephp", "codeigniter", "struts", "micronaut", "quarkus"
  ];
  
  // ============================================================
  // MACHINE LEARNING & AI
  // ============================================================
  export const ML_AI_SKILLS = [
    "tensorflow", "pytorch", "keras", "scikit-learn", "xgboost", "lightgbm", "catboost",
    "opencv", "nltk", "spacy", "gensim", "hugging face", "langchain", "llamaindex",
    "haystack", "mlflow", "kubeflow", "airflow", "databricks", "spark", "hadoop", "mahout",
    "generative ai", "llms", "prompt engineering", "rag", "retrieval-augmented generation",
    "vector databases", "faiss", "pinecone", "weaviate", "chromadb", "claude api",
    "gemini api", "openai api", "mistral", "ollama", "vllm", "lora", "fine-tuning"
  ];
  
  // ============================================================
  // DATA & ANALYTICS
  // ============================================================
  export const DATA_ANALYTICS_SKILLS = [
    "power bi", "tableau", "looker", "qlik", "metabase", "domo", "sisense", "ibm cognos",
    "crystal reports", "ssrs", "ssis", "ssas", "alteryx", "microstrategy", "sap businessobjects",
    "thoughtspot", "excel", "vba", "macros", "pivottables", "power query", "google sheets",
    "google workspace", "microsoft 365", "sharepoint", "teams", "outlook", "word", "powerpoint",
    "visio", "spss", "stata", "sas", "eviews", "minitab", "amos", "nvivo", "atlas.ti",
    "surveymonkey", "qualtrics", "redcap", "dhis2", "openmrs", "epi info", "sas enterprise guide"
  ];
  
  // ============================================================
  // CLOUD & DEVOPS
  // ============================================================
  export const CLOUD_DEVOPS_SKILLS = [
    "aws", "azure", "gcp", "google cloud", "cloudflare", "digitalocean", "heroku", "firebase",
    "vercel", "netlify", "linode", "openstack", "vmware", "hyper-v", "oci", "alibaba cloud",
    "tencent cloud", "ibm cloud", "docker", "kubernetes", "openshift", "terraform", "pulumi",
    "ansible", "chef", "puppet", "saltstack", "jenkins", "gitlab ci", "github actions",
    "circleci", "travis ci", "argocd", "helm", "istio", "envoy", "consul", "git", "github",
    "gitlab", "bitbucket", "svn", "mercurial", "ci/cd", "devops", "gitops", "agile", "scrum",
    "kanban", "lean six sigma", "prince2", "pmp", "safe", "itil", "waterfall", "xp programming"
  ];
  
  // ============================================================
  // SYSTEMS & ADMINISTRATION
  // ============================================================
  export const SYSTEMS_SKILLS = [
    "linux", "unix", "windows server", "macos", "ubuntu", "centos", "red hat", "debian",
    "fedora", "kali linux", "freebsd", "aix", "solaris", "system administration", "virtualization",
    "unix administration", "containerization", "infrastructure as code", "cloud security",
    "hybrid cloud", "multi-cloud", "sre", "observability"
  ];
  
  // ============================================================
  // CYBERSECURITY
  // ============================================================
  export const CYBERSECURITY_SKILLS = [
    "cybersecurity", "siem", "splunk", "qradar", "wireshark", "nmap", "metasploit", "burp suite",
    "crowdstrike", "sentinelone", "okta", "iam", "zero trust", "soc 2", "iso 27001", "cis controls",
    "edr", "xdr", "threat hunting", "pci dss", "hipaa", "gdpr", "ccpa", "nist", "cobit",
    "cissp", "cism", "ceh", "compTIA security+", "compTIA network+", "compTIA a+",
    "penetration testing", "digital forensics", "ethical hacking", "red teaming", "blue teaming",
    "purple teaming", "vulnerability assessment", "incident response", "security operations center"
  ];
  
  // ============================================================
  // AUTOMATION & RPA
  // ============================================================
  export const AUTOMATION_SKILLS = [
    "power automate", "zapier", "uipath", "blue prism", "automation anywhere", "rpa", "etl",
    "elt", "data warehousing", "data lakes", "master data management", "informatica", "talend",
    "fivetran", "dbt"
  ];
  
  // ============================================================
  // HEALTHCARE & PUBLIC HEALTH
  // ============================================================
  export const HEALTHCARE_SKILLS = [
    "epic emr", "cerner", "eclinicalworks", "meditech", "athenahealth", "health informatics",
    "telemedicine", "icd-11", "icd-10", "loinc", "snomed", "hl7", "fhir", "dicom",
    "public health surveillance", "epidemiology", "vector control", "laboratory information systems",
    "amr", "one health", "health systems strengthening", "vaccination programs", "iHR", "jee",
    "spar", "who", "paho", "idb", "carphe", "carpha", "dhis2", "openmrs", "epi info", "redcap"
  ];
  
  // ============================================================
  // PROJECT MANAGEMENT & COLLABORATION
  // ============================================================
  export const PROJECT_MGMT_SKILLS = [
    "jira", "confluence", "asana", "clickup", "trello", "monday.com", "smartsheet", "notion",
    "wrike", "basecamp", "airtable", "miro", "lucidchart", "figma", "canva", "adobe xd",
    "balsamiq", "draw.io", "microsoft project", "primavera p6", "kpi development",
    "operational dashboards", "executive reporting", "strategic planning", "scenario modeling",
    "benchmarking", "balanced scorecard", "business process mapping"
  ];
  
  // ============================================================
  // ERP, CRM & FINANCE
  // ============================================================
  export const ERP_CRM_SKILLS = [
    "erp", "sap", "sap s/4hana", "sap hana", "abap", "oracle erp", "peoplesoft", "workday",
    "netsuite", "dynamics 365", "epicor", "infor", "sage", "quickbooks", "xero", "salesforce",
    "hubspot", "zoho crm", "pipedrive", "freshsales", "sugarcrm", "servicenow", "sap ariba",
    "coupa", "oracle procurement", "procurement", "contract management", "vendor management",
    "supply chain", "inventory management", "wms", "tms", "demand planning", "procure-to-pay",
    "financial modeling", "forecasting", "budgeting", "variance analysis", "risk analysis",
    "monte carlo", "bloomberg terminal", "factset", "capital iq", "equity research", "valuation"
  ];
  
  export const LEGAL_SKILLS = [
    "legal research", "westlaw", "lexisnexis", "bloomberg law", "practical law", "case law",
    "statutory interpretation", "contract drafting", "legal writing", "brief writing", "memo writing",
    "legal compliance", "regulatory compliance", "corporate governance", "due diligence",
    "mergers and acquisitions", "ma", "corporate law", "commercial law", "contract law",
    "employment law", "labor law", "intellectual property", "ip law", "trademark law",
    "patent law", "copyright law", "litigation", "arbitration", "mediation", "dispute resolution",
    "legal ethics", "professional responsibility", "client counseling", "negotiation",
    "trial preparation", "courtroom advocacy", "legal operations", "legal project management",
    "e-discovery", "legal technology", "case management software", "clio", "mycase", "practicepanther",
    "legal compliance software", "contract management software", "ironclad", "congacontract",
    "legal research ai", "case law analytics", "precedent research", "legal risk management",
    "regulatory filings", "sec filings", "fdic compliance", "cfpb compliance", "fda regulations",
    "osha compliance", "eeoc compliance", "title vii", "ada compliance", "fcpa compliance",
    "anti-corruption", "anti-bribery", "sanctions compliance", "export control", "trade compliance",
    "data privacy law", "gdpr compliance", "ccpa compliance", "hipaa privacy", "ferpa compliance",
    "immigration law", "family law", "criminal law", "bankruptcy law", "tax law", "estate planning",
    "real estate law", "environmental law", "energy law", "health law", "education law"
  ];
  export const EDUCATION_SKILLS = [
    "curriculum development", "instructional design", "lesson planning", "assessment design",
    "educational technology", "edtech", "learning management systems", "lms", "canvas", "blackboard",
    "moodle", "schology", "brightspace", "google classroom", "schoology", "edmodo",
    "student information systems", "sis", "powerschool", "infinite campus", "banner",
    "academic advising", "student counseling", "career counseling", "academic administration",
    "faculty development", "teaching pedagogy", "differentiated instruction", "special education",
    "iep development", "behavior management", "classroom management", "online teaching",
    "distance learning", "synchronous learning", "asynchronous learning", "blended learning",
    "accreditation", "assessment and evaluation", "program review", "learning outcomes",
    "competency-based education", "project-based learning", "experiential learning", "service learning",
    "early childhood education", "elementary education", "secondary education", "higher education",
    "adult education", "continuing education", "vocational training", "career and technical education",
    "cte", "esl instruction", "ell support", "special education law", "idea compliance",
    "title ix compliance", "student retention strategies", "enrollment management", "admissions",
    "registrar services", "transcript evaluation", "course scheduling", "academic policy development",
    "library science", "digital literacy", "information literacy", "academic research",
    "grant writing for education", "donor relations", "development", "alumni relations",
    "school administration", "principal certification", "superintendent experience", "board relations"
  ];
  export const MANUFACTURING_SKILLS = [
    "lean manufacturing", "six sigma", "kaizen", "5s", "tpm", "total productive maintenance",
    "value stream mapping", "kanban", "just-in-time", "jit", "andon", "poka-yoke", "mistake proofing",
    "standard work", "continuous improvement", "process improvement", "dmaic", "pdca",
    "root cause analysis", "fishbone diagram", "5 whys", "fmea", "failure mode effects analysis",
    "control plan", "sop development", "work instruction writing", "manufacturing execution systems",
    "mes", "scada", "plc programming", "hmi design", "industrial automation", "robotics",
    "cnc programming", "g-code", "computer-aided manufacturing", "cam", "computer-aided design", "cad",
    "solidworks", "autocad", "inventor", "fusion 360", "catia", "nx", "creo", "onshape",
    "production planning", "capacity planning", "material requirements planning", "mrp",
    "enterprise resource planning", "erp manufacturing", "sap manufacturing", "oracle manufacturing",
    "inventory management", "warehouse management", "wms", "supply chain management", "scm",
    "demand forecasting", "sales and operations planning", "s&op", "production scheduling",
    "shop floor control", "quality management", "quality control", "qc", "quality assurance", "qa",
    "statistical process control", "spc", "six sigma black belt", "green belt", "yellow belt",
    "iso 9001", "iso 13485", "iatf 16949", "as9100", "lean six sigma", "kaizen events",
    "gemba walks", "visual management", "andon cord", "heijunka", "level loading", "jidoka",
    "autonomation", "quick changeover", "smed", "single minute exchange of die",
    "overall equipment effectiveness", "oee", "cycle time reduction", "throughput improvement",
    "bottleneck analysis", "theory of constraints", "toc", "line balancing", "cellular manufacturing",
    "continuous flow", "pull system", "supermarket", "milk run", "cross-docking", "distributor management",
    "third-party logistics", "3pl", "fourth-party logistics", "4pl", "freight forwarding",
    "customs brokerage", "import/export compliance", "incoterms", "hazmat handling", "dangerous goods",
    "cold chain logistics", "reverse logistics", "last mile delivery", "route optimization",
    "fleet management", "transportation management system", "tms", "yard management", "ym"
  ];
  export const ENERGY_SKILLS = [
    "petroleum engineering", "reservoir engineering", "drilling engineering", "production engineering",
    "well completion", "workover", "stimulation", "hydraulic fracturing", "fracking",
    "enhanced oil recovery", "eor", "reservoir simulation", "petrel", "eclipse", "cmg",
    "well log analysis", "petrophysics", "geomechanics", "seismic interpretation", "kingdom",
    "petrosys", "landmark", "openworks", "geographic information systems", "gis", "arcgis", "qgis",
    "subsurface mapping", "geological modeling", "reserves estimation", "sec reserves", "prms",
    "hydrocarbon accounting", "production allocation", "field development planning",
    "offshore operations", "onshore operations", "deepwater drilling", "subsea engineering",
    "riser design", "flow assurance", "pipelines", "pipeline integrity management", "pigging",
    "refinery operations", "process engineering", "chemical engineering", "distillation", "cracking",
    "reforming", "hydrotreating", "catalytic cracking", "delayed coking", "alkylation",
    "liquefied natural gas", "lng", "lng operations", "regasification", "liquefaction",
    "solar pv", "photovoltaic", "wind energy", "onshore wind", "offshore wind", "hydropower",
    "battery storage", "energy storage", "grid integration", "smart grid", "microgrid",
    "renewable energy", "clean energy", "sustainable energy", "carbon capture", "ccus",
    "carbon sequestration", "emissions trading", "carbon accounting", "environmental compliance",
    "nuclear power", "nuclear engineering", "radiation safety", "health physics",
    "power plant operations", "generator operations", "transmission", "distribution",
    "energy trading", "commodities trading", "power purchase agreements", "ppa",
    "energy risk management", "hedging strategies", "energy markets", "electricity markets",
    "oil trading", "gas trading", "crude oil pricing", "gas pricing", "hedge accounting",
    "energy policy", "energy regulation", "ferc compliance", "ercot", "pjm", "miso", "caiso",
    "nrc regulations", "safety cases", "bowtie analysis", "layered risk assessment", "process safety",
    "psm compliance", "osha psm", "api standards", "iso 14224", "iec 61511", "sil assessment"
  ];
  export const CONSTRUCTION_SKILLS = [
    "project management", "construction management", "site supervision", "field coordination",
    "blueprint reading", "shop drawing review", "as-built documentation", "takeoff", "estimating",
    "cost estimation", "quantity surveying", "cost planning", "cost control", "value engineering",
    "budget tracking", "cost forecasting", "project scheduling", "cpm scheduling", "primavera p6",
    "microsoft project", "critical path method", "gantt charts", "resource loading", "leveling",
    "earned value management", "evm", "progress reporting", "s-curve analysis", "forensic scheduling",
    "delay analysis", "construction law", "contract administration", "prime contract", "subcontracts",
    "purchase orders", "change order management", "claims management", "dispute resolution",
    "construction safety", "osha compliance", "site safety audits", "job hazard analysis", "jha",
    "safety data sheets", "confined space entry", "working at heights", "excavation safety",
    "crane safety", "rigging", "heavy equipment operation", "building codes", "international building code",
    "ibc", "local codes", "zoning regulations", "permitting", "environmental compliance", "swppp",
    "stormwater management", "leed certification", "green building", "bim", "building information modeling",
    "revit", "navisworks", "bim 360", "autodesk construction cloud", "tekla", "bentley", "synchro",
    "civil engineering", "structural engineering", "geotechnical engineering", "soils analysis",
    "foundation design", "earthwork", "grading", "paving", "concrete work", "formwork", "rebar",
    "post-tensioning", "structural steel", "erection", "welding", "ndt", "non-destructive testing",
    "mechanical engineering", "hvac", "plumbing", "fire protection", "electrical engineering",
    "power distribution", "lighting design", "low voltage systems", "security systems", "av systems",
    "real estate acquisition", "site selection", "feasibility analysis", "due diligence",
    "zoning analysis", "entitlements", "land use planning", "environmental site assessment", "phase i",
    "real estate finance", "proforma modeling", "cap rate analysis", "irr analysis", "cash flow modeling",
    "loan underwriting", "construction lending", "permanent financing", "tax credit finance",
    "property management", "leasing", "tenant improvement", "facilities management", "cmms",
    "property condition assessment", "capital planning", "deferred maintenance", "space planning",
    "move management"
  ];
  export const AGRICULTURE_SKILLS = [
    "agronomy", "crop science", "soil science", "soil fertility", "nutrient management", "fertilization",
    "irrigation management", "drip irrigation", "center pivot", "flood irrigation", "crop rotation",
    "cover cropping", "conservation tillage", "no-till farming", "precision agriculture", "variable rate",
    "yield monitoring", "field mapping", "remote sensing", "drone scouting", "ndvi", "vegetation indices",
    "pest management", "integrated pest management", "ipm", "pesticide application", "herbicides",
    "fungicide application", "weed control", "disease scouting", "entomology", "livestock management",
    "animal nutrition", "feed formulation", "herd health", "veterinary care", "bovine management",
    "swine management", "poultry management", "dairy management", "milking operations", "reproductive management",
    "artificial insemination", "calving", "lambing", "farrowing", "feedlot management", "grazing management",
    "rotational grazing", "pasture management", "fencing", "water management", "aquaculture",
    "fish farming", "shrimp farming", "tilapia production", "algae cultivation", "hydroponics",
    "greenhouse management", "controlled environment agriculture", "cea", "vertical farming",
    "indoor farming", "aeroponics", "aquaponics", "food safety", "haccp", "gfsi", "sqf", "bap certification",
    "usda regulations", "fsma compliance", "traceability", "cold chain management", "post-harvest handling",
    "storage management", "grain handling", "silo management", "drying", "aeration", "temperature monitoring",
    "food processing", "canning", "freezing", "dehydration", "packaging", "quality assurance",
    "food testing", "microbiology", "chemistry", "sensory evaluation", "shelf life studies",
    "supply chain agriculture", "commodity trading", "futures contracts", "hedging", "agricultural economics",
    "farm management", "agricultural finance", "subsidy programs", "crop insurance", "farm labor management",
    "organic certification", "usda organic", "non-gmo verification", "fair trade", "rainforest alliance",
    "sustainable agriculture", "regenerative agriculture", "agroecology", "permaculture", "silvopasture",
    "agricultural technology", "agtech", "farm management software", "conservation planning"
  ];
  export const HOSPITALITY_SKILLS = [
    "hotel management", "front desk operations", "guest services", "concierge", "housekeeping management",
    "laundry operations", "maintenance coordination", "food and beverage management", "restaurant management",
    "bar management", "banquet operations", "catering sales", "event planning", "conference coordination",
    "wedding planning", "corporate events", "trade shows", "audiovisual setup", "stage management",
    "culinary arts", "kitchen management", "menu development", "recipe costing", "inventory management",
    "food safety", "servsafe", "haccp", "alcohol service", "responsible beverage service", "bartending",
    "wine service", "sommelier", "mixology", "beer program", "cellar management", "procurement",
    "supplier negotiation", "cost control", "budgeting hospitality", "revenue management", "yield management",
    "occupancy forecasting", "average daily rate", "adr", "revpar", "revenue per available room",
    "gross operating profit per available room", "goppar", "distribution channels", "online travel agencies",
    "ota management", "direct booking strategy", "loyalty programs", "guest loyalty", "reputation management",
    "online review response", "tripadvisor", "google reviews", "yelp", "social media hospitality",
    "instagram marketing", "facebook marketing", "travel agency relations", "corporate sales",
    "group sales", "tour operator relationships", "destination management", "tour planning", "itinerary design",
    "sightseeing logistics", "transportation coordination", "cruise ship operations", "deck management",
    "marine operations", "port logistics", "guest activities", "shore excursion management",
    "casino operations", "spa management", "wellness center operations", "fitness facility management",
    "resort management", "timeshare management", "vacation rental management", "airbnb management",
    "vrbo management", "property management systems", "pms", "opera pms", "lightspeed", "hotelogix",
    "rezlynx", "qloapps", "channel manager", "booking engine", "rate parity monitoring", "custoner relationship management",
    "crm hospitality", "salesforce hospitality", "guest feedback analysis", "text analysis", "sentiment analysis"
  ];
  export const GOVERNMENT_SKILLS = [
    "policy analysis", "policy development", "legislative affairs", "regulatory affairs", "public policy",
    "program evaluation", "performance measurement", "results-based management", "logic model development",
    "theory of change", "outcome mapping", "cost-benefit analysis", "economic impact analysis",
    "social return on investment", "sroi", "environmental impact assessment", "eia", "strategic planning",
    "public administration", "government operations", "civil service", "administrative procedure",
    "public procurement", "government contracting", "request for proposal", "rfp", "invitation to bid",
    "sole source procurement", "grants management", "grant writing", "federal grants", "state grants",
    "local grants", "formula funding", "discretionary grants", "cooperative agreements", "interagency coordination",
    "memorandum of understanding", "mou", "intergovernmental relations", "federalism", "stakeholder engagement",
    "public consultation", "town hall facilitation", "public hearings", "community outreach", "public comment analysis",
    "budget formulation", "government budgeting", "appropriations", "allotment", "obligation analysis",
    "encumbrance accounting", "audit preparation", "inspector general", "omb circulars", "green book",
    "yellow book", "acfra", "single audit", "freedom of information", "foia", "public records",
    "transparency reporting", "open data", "ethics compliance", "conflict of interest", "financial disclosure",
    "lobbying compliance", "gift rules", "travel rules", "procurement integrity", "whistleblower protection",
    "oversight hearings", "briefing preparation", "congressional testimony", "senate confirmation",
    "rule-making process", "notice and comment", "federal register", "code of federal regulations", "cfr",
    "united states code", "usc", "executive orders", "presidential memoranda", "signing statements",
    "agency guidance", "regulatory impact analysis", "pandemic response", "emergency operations center", "eoc",
    "continuity of operations", "coop", "continuity of government", "cog", "disaster declaration process",
    "stafford act", "fema coordination", "public assistance", "individual assistance", "hazard mitigation"
  ];
  export const RETAIL_SKILLS = [
    "store operations", "retail management", "visual merchandising", "planogram design", "space planning",
    "shelf management", "product placement", "end cap display", "signage", "retail analytics",
    "foot traffic analysis", "conversion optimization", "average transaction value", "atv",
    "items per transaction", "ipt", "sell-through rate", "shrink management", "lost prevention",
    "electronic article surveillance", "eas", "inventory accuracy", "cycle counting", "physical inventory",
    "abc analysis", "inventory turnover", "stock-to-sales ratio", "open-to-buy", "otb", "merchandise planning",
    "assortment planning", "category management", "vendor negotiation", "retail buying", "purchase order management",
    "retail pricing strategy", "markdown optimization", "promotion planning", "weekly ad", "circular development",
    "e-commerce operations", "omnichannel retail", "buy online pick up in-store", "bopis", "ship from store",
    "endless aisle", "dropshipping", "marketplace operations", "amazon seller central", "amazon vendor central",
    "walmart marketplace", "ebay", "etsy", "shopify", "magento", "bigcommerce", "wix e-commerce", "squarespace commerce",
    "payment processing", "pos systems", "clover", "square pos", "shopify pos", "lightspeed pos", "till pos",
    "customer loyalty programs", "rewards program management", "gift card management", "retail credit card operations",
    "clienteling", "personal shopping", "omni-channel customer service", "buy online return in-store", "boris",
    "curbside pickup", "click and collect", "same-day delivery", "last-mile logistics", "route planning",
    "parcel shipping", "shipment tracking", "returns management", "reverse logistics", "exchange processing",
    "refund authorization", "customer dispute resolution", "chargeback management", "retail workforce management",
    "store scheduling", "labor modeling", "sales per labor hour", "store manager training", "floor supervision",
    "cash management", "safe count", "deposit preparation", "cashier training", "overs and shorts analysis",
    "retail banking partnership", "store-in-store operations", "concession management", "pop-up operations",
    "franchise support", "licensee management", "wholesale distribution", "direct-to-consumer", "dtc operations"
  ];

// ============================================================
// SKILL COUNTING FUNCTION (ADDED)
// ============================================================

/**
 * Counts unique technical skill categories mentioned in a job description
 * @param {string} jdText - The job description text
 * @returns {number} Count of distinct skill categories found
 */
export function countTechnicalSkills(jdText) {
  if (!jdText || typeof jdText !== 'string') return 0;
  
  const lowerText = jdText.toLowerCase();
  let foundCategories = new Set();
  
  // Collection of all skill arrays to check
  const skillCategories = {
    PROGRAMMING_LANGUAGES,
    FRONTEND_SKILLS,
    BACKEND_SKILLS,
    ML_AI_SKILLS,
    DATA_ANALYTICS_SKILLS,
    CLOUD_DEVOPS_SKILLS,
    SYSTEMS_SKILLS,
    CYBERSECURITY_SKILLS,
    AUTOMATION_SKILLS,
    HEALTHCARE_SKILLS,
    PROJECT_MGMT_SKILLS,
    ERP_CRM_SKILLS,
    LEGAL_SKILLS,
    EDUCATION_SKILLS,
    MANUFACTURING_SKILLS,
    ENERGY_SKILLS,
    CONSTRUCTION_SKILLS,
    AGRICULTURE_SKILLS,
    HOSPITALITY_SKILLS,
    GOVERNMENT_SKILLS,
    RETAIL_SKILLS
  };
  
  // Check each category
  for (const [categoryName, skills] of Object.entries(skillCategories)) {
    for (const skill of skills) {
      // Match whole words or phrases (not substrings)
      // Escape special regex characters in the skill name
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundCategories.add(categoryName);
        break; // Count category once even if multiple skills from same category
      }
    }
  }
  
  return foundCategories.size;
}
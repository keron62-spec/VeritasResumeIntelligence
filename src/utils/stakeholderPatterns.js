// src/utils/stakeholderPatterns.js

/**
 * Stakeholder patterns organized by type.
 * Each pattern is a regex-compatible string (lowercase for matching).
 * Used to count distinct stakeholder types mentioned in a JD.
 */

export const STAKEHOLDER_PATTERNS = {
    // ============================================================
    // GOVERNMENT & PUBLIC SECTOR
    // ============================================================
    government: [
      "government agencies",
      "government ministries",
      "ministry of",
      "national authorities",
      "public sector",
      "government departments",
      "regulatory bodies",
      "government officials",
      "public health authorities",
      "local government",
      "municipal government",
      "state government",
      "federal agencies",
      "parliamentary",
      "legislative",
      "executive branch",
      "cabinet members",
      "government representatives",
      "civil service",
      "public administration"
    ],
  
    // ============================================================
    // INTERNATIONAL & REGIONAL BODIES
    // ============================================================
    international_bodies: [
      "member states",
      "united nations",
      "who",
      "world health organization",
      "paho",
      "pan american health organization",
      "caricom",
      "carphe",
      "carpha",
      "oas",
      "organization of american states",
      "commonwealth",
      "european union",
      "au",
      "african union",
      "asean",
      "world bank",
      "imf",
      "international monetary fund",
      "idb",
      "inter-american development bank",
      "undp",
      "unicef",
      "unhcr",
      "wfp",
      "fao",
      "ilo",
      "unesco",
      "gavi",
      "global fund",
      "international organization for migration",
      "iom",
      "red cross",
      "ifrc",
      "icrc",
      "ngo",
      "non-governmental organization",
      "international ngo",
      "bilateral donors",
      "multilateral organizations",
      "regional bodies",
      "supranational organizations",
      "cdema",
      "caribbean disaster emergency management agency",
      "rss",
      "regional security system",
      "icc",
      "international criminal court",
      "icj",
      "international court of justice"
    ],
  
    // ============================================================
    // DONORS & FUNDING PARTNERS
    // ============================================================
    donors: [
      "donor agencies",
      "donor partners",
      "funding partners",
      "development partners",
      "bilateral donors",
      "multilateral donors",
      "philanthropic organizations",
      "foundations",
      "grant-making organizations",
      "development banks",
      "export credit agencies",
      "private donors",
      "corporate donors",
      "individual donors",
      "crowdfunding",
      "impact investors",
      "social investors",
      "venture philanthropy",
      "gates foundation",
      "rockefeller foundation",
      "ford foundation",
      "open society foundations",
      "usaid",
      "dfid",
      "fcd",
      "gac",
      "global affairs canada",
      "european commission",
      "echo",
      "giz",
      "sida",
      "norad",
      "danida",
      "australian aid",
      "jica",
      "kfw"
    ],
  
    // ============================================================
    // CIVIL SOCIETY & COMMUNITY
    // ============================================================
    civil_society: [
      "civil society",
      "civil society organizations",
      "community organizations",
      "community-based organizations",
      "cbo",
      "faith-based organizations",
      "religious organizations",
      "grassroots organizations",
      "community groups",
      "local communities",
      "indigenous communities",
      "traditional leaders",
      "community health workers",
      "village health teams",
      "community volunteers",
      "patient advocacy groups",
      "disability organizations",
      "women's groups",
      "youth groups",
      "student organizations",
      "labor unions",
      "trade unions",
      "workers' associations",
      "cooperatives",
      "farmer cooperatives",
      "savings groups",
      "village savings and loan associations"
    ],
  
    // ============================================================
    // PRIVATE SECTOR
    // ============================================================
    private_sector: [
      "private sector",
      "corporate partners",
      "industry partners",
      "business associations",
      "chambers of commerce",
      "small and medium enterprises",
      "sme",
      "multinational corporations",
      "private companies",
      "contractors",
      "subcontractors",
      "vendors",
      "suppliers",
      "service providers",
      "consultants",
      "consulting firms",
      "private labs",
      "private hospitals",
      "private clinics",
      "pharmaceutical companies",
      "pharma",
      "biotech companies",
      "insurance companies",
      "banks",
      "financial institutions",
      "private equity",
      "venture capital",
      "corporate foundations",
      "industry associations",
      "trade associations",
      "professional associations"
    ],
  
    // ============================================================
    // ACADEMIC & RESEARCH
    // ============================================================
    academic: [
      "academic institutions",
      "universities",
      "colleges",
      "research institutions",
      "research centers",
      "academia",
      "academic partners",
      "educational institutions",
      "schools",
      "training institutions",
      "medical schools",
      "schools of public health",
      "research universities",
      "polytechnics",
      "community colleges",
      "technical institutes",
      "vocational schools",
      "think tanks",
      "policy institutes",
      "research councils",
      "national academies",
      "academic publishers",
      "journals",
      "peer review"
    ],
  
    // ============================================================
    // HEALTHCARE & MEDICAL
    // ============================================================
    healthcare: [
      "healthcare providers",
      "health facilities",
      "hospitals",
      "clinics",
      "health centers",
      "primary care facilities",
      "community health centers",
      "health workers",
      "doctors",
      "physicians",
      "nurses",
      "midwives",
      "community health workers",
      "laboratories",
      "diagnostic centers",
      "pharmacies",
      "medical associations",
      "nursing associations",
      "professional health councils",
      "regulatory health authorities",
      "medical licensing boards",
      "public health departments",
      "health authorities",
      "regional health authorities",
      "national health services",
      "ministry of health"
    ],
  
    // ============================================================
    // INTERNAL STAKEHOLDERS
    // ============================================================
    internal: [
      "internal teams",
      "cross-functional teams",
      "departments",
      "senior management",
      "executive leadership",
      "c-suite",
      "board of directors",
      "board members",
      "governance board",
      "steering committee",
      "advisory committee",
      "technical working group",
      "project team",
      "program team",
      "operations team",
      "finance department",
      "hr department",
      "human resources",
      "legal department",
      "procurement department",
      "supply chain department",
      "m&e department",
      "monitoring and evaluation",
      "communications team",
      "pr team",
      "it department",
      "information technology",
      "administration",
      "management",
      "supervisors",
      "direct reports",
      "staff members",
      "colleagues",
      "peers"
    ],
  
    // ============================================================
    // SECURITY & DEFENSE (for CARICOM/IMPACS/MAG roles)
    // ============================================================
    security_defense: [
      "security sector",
      "defense sector",
      "military",
      "armed forces",
      "police",
      "law enforcement",
      "coast guard",
      "maritime security",
      "border control",
      "customs",
      "immigration",
      "intelligence agencies",
      "security agencies",
      "defense ministries",
      "ministry of defense",
      "ministry of national security",
      "homeland security",
      "peacekeeping missions",
      "security forces",
      "paramilitary",
      "corrections",
      "prison service",
      "judicial system",
      "courts",
      "judiciary"
    ],
  
    // ============================================================
    // TECHNICAL EXPERTS & ADVISORS
    // ============================================================
    technical_experts: [
      "subject matter experts",
      "technical experts",
      "technical advisors",
      "specialists",
      "consultants",
      "technical consultants",
      "advisors",
      "technical working groups",
      "expert panels",
      "advisory boards",
      "scientific advisory committee",
      "technical review committee",
      "independent experts",
      "external experts",
      "domain experts"
    ]
  };
  
  /**
   * Counts distinct stakeholder types mentioned in a job description
   * @param {string} jdText - The job description text
   * @returns {number} Count of distinct stakeholder categories found
   */
  export function countStakeholders(jdText) {
    const lowerText = jdText.toLowerCase();
    let foundCount = 0;
    
    for (const [category, patterns] of Object.entries(STAKEHOLDER_PATTERNS)) {
      for (const pattern of patterns) {
        // Match whole words or phrases
        const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b|${escapeRegex(pattern)}`, 'i');
        if (regex.test(lowerText)) {
          foundCount++;
          break; // Count category once even if multiple patterns match
        }
      }
    }
    
    return foundCount;
  }
  
  /**
   * Gets the list of stakeholder categories found in a job description
   * @param {string} jdText - The job description text
   * @returns {string[]} Array of stakeholder category names found
   */
  export function getStakeholderCategoriesFound(jdText) {
    const lowerText = jdText.toLowerCase();
    const found = [];
    
    for (const [category, patterns] of Object.entries(STAKEHOLDER_PATTERNS)) {
      for (const pattern of patterns) {
        const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b|${escapeRegex(pattern)}`, 'i');
        if (regex.test(lowerText)) {
          found.push(category);
          break;
        }
      }
    }
    
    return found;
  }
  
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
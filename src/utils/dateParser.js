// src/utils/dateParser.js

/**
 * Deterministic date parser for career gap detection
 * Handles common resume date formats
 */

const MONTHS = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
    nov: 11, november: 11, dec: 12, december: 12
  };
  
  /**
   * Parses a date string into { year, month }
   * @param {string} dateStr - Date string (e.g., "Jan 2020", "2020-01", "01/2020")
   * @returns {Object|null} Parsed date or null
   */
  export function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const str = dateStr.trim().toLowerCase();
    
    // Format: "Jan 2020" or "January 2020"
    const monthYearMatch = str.match(/([a-z]+)\s+(\d{4})/);
    if (monthYearMatch) {
      const month = MONTHS[monthYearMatch[1].substring(0, 3)];
      const year = parseInt(monthYearMatch[2], 10);
      if (month && year) return { year, month };
    }
    
    // Format: "2020-01" or "2020/01"
    const isoMatch = str.match(/(\d{4})[-/](\d{1,2})/);
    if (isoMatch) {
      return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
    }
    
    // Format: "01/2020" (US)
    const usMatch = str.match(/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      return { year: parseInt(usMatch[2], 10), month: parseInt(usMatch[1], 10) };
    }
    
    // Format: "2020" (year only)
    const yearMatch = str.match(/(\d{4})/);
    if (yearMatch) {
      return { year: parseInt(yearMatch[1], 10), month: 6 }; // Default to June if only year
    }
    
    return null;
  }
  
  /**
   * Calculates tenure in months between two dates
   * @param {Object} start - { year, month }
   * @param {Object} end - { year, month }
   * @returns {number} Months between
   */
  function getMonthsDifference(start, end) {
    if (!start || !end) return 0;
    return (end.year - start.year) * 12 + (end.month - start.month);
  }
  
  /**
   * Detects career gaps in a list of roles
   * @param {Array} roles - Array of { title, company, startDate, endDate }
   * @returns {Object} Gap analysis
   */
  export function detectCareerGaps(roles) {
    if (!roles || roles.length < 2) return { gaps: [], totalGapMonths: 0, hasGaps: false };
    
    const gaps = [];
    let totalGapMonths = 0;
    
    // Sort roles by end date (most recent first, then by start date)
    const sortedRoles = [...roles].sort((a, b) => {
      const aEnd = parseDate(a.endDate);
      const bEnd = parseDate(b.endDate);
      if (!aEnd || !bEnd) return 0;
      return bEnd.year - aEnd.year || bEnd.month - aEnd.month;
    });
    
    for (let i = 0; i < sortedRoles.length - 1; i++) {
      const current = sortedRoles[i];
      const next = sortedRoles[i + 1];
      
      const currentStart = parseDate(current.startDate);
      const nextEnd = parseDate(next.endDate);
      
      if (currentStart && nextEnd) {
        // Gap = next end date to current start date
        const gapMonths = getMonthsDifference(nextEnd, currentStart);
        
        if (gapMonths > 6) {
          gaps.push({
            fromRole: next.title,
            fromCompany: next.company,
            toRole: current.title,
            toCompany: current.company,
            gapMonths,
            startDate: next.endDate,
            endDate: current.startDate
          });
          totalGapMonths += gapMonths;
        }
      }
    }
    
    return {
      gaps,
      totalGapMonths,
      hasGaps: gaps.length > 0,
      hasSignificantGaps: totalGapMonths > 12
    };
  }
  
  /**
   * Detects job hopping (short tenures)
   * @param {Array} roles - Array of { title, company, startDate, endDate }
   * @param {number} thresholdMonths - Minimum months to consider "stable" (default 18)
   * @returns {Object} Job hopping analysis
   */
  export function detectJobHopping(roles, thresholdMonths = 18) {
    if (!roles || roles.length === 0) return { shortTenures: [], averageTenure: 0, isJobHopper: false };
    
    const tenures = [];
    const shortTenures = [];
    
    for (const role of roles) {
      const start = parseDate(role.startDate);
      const end = parseDate(role.endDate) || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
      
      if (start && end) {
        const tenureMonths = getMonthsDifference(start, end);
        tenures.push(tenureMonths);
        
        if (tenureMonths < thresholdMonths && tenureMonths > 0) {
          shortTenures.push({
            title: role.title,
            company: role.company,
            tenureMonths,
            startDate: role.startDate,
            endDate: role.endDate
          });
        }
      }
    }
    
    const averageTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;
    const isJobHopper = shortTenures.length >= 2 && averageTenure < thresholdMonths;
    
    return {
      shortTenures,
      averageTenure: Math.round(averageTenure),
      isJobHopper,
      severity: shortTenures.length >= 3 ? "high" : shortTenures.length >= 2 ? "medium" : "low"
    };
  }
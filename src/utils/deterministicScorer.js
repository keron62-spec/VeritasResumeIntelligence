// src/utils/deterministicScorer.js

/**
 * Complete deterministic scoring orchestrator
 * Combines all dictionaries into a single scoring pass
 */

import { extractBullets } from './bulletParser.js';
import { analyzeVerbs } from './verbs.js';
import { detectBuzzwords } from './buzzwords.js';
import { extractMetrics, calculateMetricStrength } from './metricsPatterns.js';
import { calculateDeterministicBloom } from './deterministicBloom.js';
import { detectSeniorityFromText } from './seniorityDetector.js';
import { countTechnicalSkills } from './skillDictionary.js';
import { countCertifications } from './certifications.js';

export class DeterministicScorer {
  constructor(resumeText, jdText = null) {
    this.resumeText = resumeText;
    this.jdText = jdText;
    this.cache = {};
  }
  
  /**
   * Run all scoring passes
   */
  score() {
    return {
      ats: this.scoreATS(),
      credibility: this.scoreCredibility(),
      semantic: this.scoreSemantic(),
      bloom: this.scoreBloom(),
      fit: this.jdText ? this.scoreFit() : null,
      summary: this.generateSummaryStats()
    };
  }
  
  scoreATS() {
    if (this.cache.ats) return this.cache.ats;
    
    let score = 100;
    const deductions = [];
    
    // Header check
    if (!this.resumeText.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) {
      score -= 10;
      deductions.push('Missing or unclear name in header');
    }
    
    // Contact info
    if (!this.resumeText.match(/@/)) {
      score -= 5;
      deductions.push('Missing email address');
    }
    if (!this.resumeText.match(/[\d\s-]{10,}/)) {
      score -= 5;
      deductions.push('Missing or incomplete phone number');
    }
    
    // Quantified results
    const metrics = extractMetrics(this.resumeText);
    const metricStrength = calculateMetricStrength(this.resumeText);
    if (metricStrength < 30) {
      score -= 20;
      deductions.push('Few or no quantified results - add metrics to demonstrate impact');
    } else if (metricStrength < 60) {
      score -= 10;
      deductions.push('Quantified results lack context - add baselines or comparisons');
    }
    
    // Action verbs
    const verbAnalysis = analyzeVerbs(this.resumeText);
    if (verbAnalysis.weakCount > verbAnalysis.strongCount) {
      score -= 15;
      deductions.push(`Use stronger action verbs - ${verbAnalysis.weakCount} weak verbs detected`);
    }
    
    // Buzzwords
    const buzzwords = detectBuzzwords(this.resumeText);
    if (buzzwords.total > 3) {
      score -= Math.min(10, buzzwords.total);
      deductions.push(`${buzzwords.total} buzzwords detected - replace with specific evidence`);
    }
    
    // Skills section
    const hasSkillsSection = /skills/i.test(this.resumeText);
    if (!hasSkillsSection) {
      score -= 10;
      deductions.push('Missing dedicated skills section');
    }
    
    // Length
    const wordCount = this.resumeText.split(/\s+/).length;
    if (wordCount > 1000) {
      score -= 5;
      deductions.push('Resume is longer than 1000 words - consider condensing');
    }
    
    this.cache.ats = {
      score: Math.max(0, Math.min(100, score)),
      label: score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Needs Work',
      deductions
    };
    
    return this.cache.ats;
  }
  
  scoreCredibility() {
    if (this.cache.credibility) return this.cache.credibility;
    
    let score = 100;
    const issues = [];
    
    // Check for inflated claims
    const execTitles = ['executive', 'director', 'chief', 'vp', 'head of'];
    const hasExecTitle = execTitles.some(t => this.resumeText.toLowerCase().includes(t));
    const hasAdvancedDegree = /master|msc|ms|ma|mba|mph|phd|doctorate/i.test(this.resumeText);
    
    if (hasExecTitle && !hasAdvancedDegree) {
      score -= 15;
      issues.push('Executive title without advanced degree - ensure qualifications match seniority');
    }
    
    // Check for suspicious metrics
    const suspiciousPatterns = [
      { pattern: /100%/gi, penalty: 5, message: '100% claims without context - add baseline' },
      { pattern: /zero\s+incident|no\s+issues/gi, penalty: 3, message: 'Absolute claims (zero incidents) - provide verification' }
    ];
    
    for (const { pattern, penalty, message } of suspiciousPatterns) {
      if (pattern.test(this.resumeText)) {
        score -= penalty;
        issues.push(message);
      }
    }
    
    // Check for acting/interim titles (reduces authority weight)
    const hasActingTitle = /acting|interim/i.test(this.resumeText);
    if (hasActingTitle) {
      issues.push('Acting/Interim title detected - clarify if role became permanent');
    }
    
    this.cache.credibility = {
      score: Math.max(0, Math.min(100, score)),
      label: score >= 80 ? 'Credible' : score >= 60 ? 'Moderately Credible' : 'Questionable',
      issues
    };
    
    return this.cache.credibility;
  }
  
  scoreSemantic() {
    if (this.cache.semantic) return this.cache.semantic;
    
    const verbAnalysis = analyzeVerbs(this.resumeText);
    const seniority = detectSeniorityFromText(this.resumeText);
    
    // Calculate position score (-5 to +5)
    let positionScore = 0;
    let detectedLevel = seniority.level;
    let expectedVerbStrength = 3;
    
    if (detectedLevel === 'executive') expectedVerbStrength = 8;
    else if (detectedLevel === 'senior') expectedVerbStrength = 6;
    else if (detectedLevel === 'mid') expectedVerbStrength = 5;
    
    const strengthGap = verbAnalysis.averageStrength - expectedVerbStrength;
    
    if (strengthGap > 2) positionScore = 3;
    else if (strengthGap > 1) positionScore = 2;
    else if (strengthGap > 0.5) positionScore = 1;
    else if (strengthGap < -2) positionScore = -3;
    else if (strengthGap < -1) positionScore = -2;
    else if (strengthGap < -0.5) positionScore = -1;
    
    let positionLabel = 'Perfectly positioned';
    if (Math.abs(positionScore) > 2) {
      positionLabel = positionScore > 0 ? 'Significantly Over-positioned' : 'Significantly Under-positioned';
    } else if (Math.abs(positionScore) > 1) {
      positionLabel = positionScore > 0 ? 'Moderately Over-positioned' : 'Moderately Under-positioned';
    }
    
    this.cache.semantic = {
      position_score: positionScore,
      position_label: positionLabel,
      detected_level: detectedLevel,
      confidence: 85
    };
    
    return this.cache.semantic;
  }
  
  scoreBloom() {
    if (this.cache.bloom) return this.cache.bloom;
    
    const bullets = extractBullets(this.resumeText);
    let totalLevel = 0;
    let bulletCount = 0;
    
    for (const bullet of bullets.bullets) {
      const bloom = calculateDeterministicBloom(bullet.original_text);
      totalLevel += bloom.level;
      bulletCount++;
    }
    
    const averageLevel = bulletCount > 0 ? totalLevel / bulletCount : 3.5;
    const seniority = detectSeniorityFromText(this.resumeText);
    
    let expectedLevel = 3.5;
    if (seniority.level === 'executive') expectedLevel = 5.5;
    else if (seniority.level === 'senior') expectedLevel = 4.5;
    else if (seniority.level === 'entry') expectedLevel = 2.5;
    
    const gap = averageLevel - expectedLevel;
    
    let assessment = 'Cognitive complexity aligns with expectations';
    let flag = null;
    
    if (gap > 1.5) {
      assessment = 'Your language suggests significantly higher cognitive complexity than expected for your level. Potential over-positioning risk.';
      flag = 'bloom_inflation';
    } else if (gap > 0.8) {
      assessment = 'Your language suggests higher cognitive complexity than expected. Ensure claims are fully supported.';
      flag = 'potential_inflation';
    } else if (gap < -1.5) {
      assessment = 'Your language suggests significantly lower cognitive complexity than expected. Use stronger action verbs and add strategic framing.';
      flag = 'bloom_under_selling';
    } else if (gap < -0.8) {
      assessment = 'Your language suggests lower cognitive complexity than expected. Add more analytical and strategic language.';
      flag = 'potential_under_selling';
    }
    
    this.cache.bloom = {
      average_level: Math.round(averageLevel * 10) / 10,
      expected_level: expectedLevel,
      gap: Math.round(gap * 10) / 10,
      assessment,
      flag,
      bullets_assessed: bulletCount
    };
    
    return this.cache.bloom;
  }
  
  scoreFit() {
    if (!this.jdText) return null;
    if (this.cache.fit) return this.cache.fit;
    
    // Simplified fit scoring - would be enhanced with JD features
    let score = 70;
    
    // Keyword match (simplified)
    const resumeLower = this.resumeText.toLowerCase();
    const jdLower = this.jdText.toLowerCase();
    
    // Extract potential keywords from JD (capitalized terms, technical words)
    const jdWords = jdLower.split(/\s+/);
    const keywords = new Set();
    for (const word of jdWords) {
      const clean = word.replace(/[^\w]/g, '');
      if (clean.length > 3 && /[A-Za-z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note)$/i.test(clean)) {
        keywords.add(clean);
      }
    }
    
    let matches = 0;
    for (const keyword of keywords) {
      if (resumeLower.includes(keyword)) matches++;
    }
    
    const matchRate = keywords.size > 0 ? (matches / keywords.size) * 100 : 50;
    score += (matchRate - 50) * 0.3;
    
    // Years match
    const yearsMatch = this.resumeText.match(/\b(19|20)\d{2}\b/g);
    const jdYearsMatch = this.jdText.match(/\b(19|20)\d{2}\b/g);
    if (yearsMatch && jdYearsMatch) {
      const resumeYears = Math.max(...yearsMatch.map(Number)) - Math.min(...yearsMatch.map(Number));
      const jdYears = Math.max(...jdYearsMatch.map(Number)) - Math.min(...jdYearsMatch.map(Number));
      if (resumeYears < jdYears) {
        score -= Math.min(20, (jdYears - resumeYears) * 2);
      }
    }
    
    this.cache.fit = {
      score: Math.max(0, Math.min(100, Math.round(score))),
      label: score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Poor'
    };
    
    return this.cache.fit;
  }
  
  generateSummaryStats() {
    const words = this.resumeText.split(/\s+/).length;
    const bullets = extractBullets(this.resumeText);
    const metrics = extractMetrics(this.resumeText);
    const verbAnalysis = analyzeVerbs(this.resumeText);
    
    return {
      word_count: words,
      bullet_count: bullets.total_count,
      metric_count: metrics.currency.length + metrics.percentages.length + metrics.volume.length,
      strong_verb_count: verbAnalysis.strongCount,
      weak_verb_count: verbAnalysis.weakCount,
      has_summary: /summary|profile|about/i.test(this.resumeText)
    };
  }
}
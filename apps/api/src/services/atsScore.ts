const COMMON_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "need",
  "must", "this", "that", "these", "those", "it", "its", "we", "our",
  "you", "your", "they", "their", "he", "she", "him", "her", "his",
  "all", "each", "every", "both", "few", "some", "any", "no", "not",
  "very", "too", "so", "just", "about", "also", "than", "then",
  "now", "here", "there", "when", "where", "how", "what", "which",
  "who", "whom", "while", "during", "before", "after", "above",
  "below", "between", "through", "without", "within", "along",
  "among", "including", "such", "more", "most", "less", "least",
  "able", "like", "well", "over", "under", "up", "out", "off", "down",
  "into", "onto", "upon", "per", "via", "using", "based", "other",
  "new", "many", "much", "make", "made", "used", "use", "work",
  "team", "role", "year", "years", "time", "experience", "including",
  "related", "required", "preferred", "ability", "skills", "knowledge",
  "etc", "e", "g", "ie", "vs", "de", "la", "le", "en", "el", "un", "du",
  "des", "est", "sont", "pour", "dans", "avec", "une", "que", "les",
  "se", "no", "si", "lo", "las", "los", "del", "como", "más", "por",
  "para", "sin", "sus", "son", "era", "han", "has", "haber", "puede",
  "todo", "bien", "muy", "cada", "otro", "cual", "quien", "donde",
]);

interface FormatCheckResult {
  score: number;
  details: string[];
}

export interface ATSScoreResult {
  score: number;
  keywordMatch: number;
  formatting: number;
  contentScore: number;
  missingSkills: string[];
  presentSkills: string[];
  suggestions: string[];
}

function extractKeywords(text: string, minLength = 3): string[] {
  const tokens = text.split(/[\s,;.()\[\]{}""''|/\\\n\r\t]+/);
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of tokens) {
    const clean = token.replace(/^[^a-zA-Z0-9+#.]+|[^a-zA-Z0-9+#.]+$/g, "").trim();
    if (
      clean.length >= minLength &&
      !COMMON_WORDS.has(clean.toLowerCase()) &&
      !/^\d+$/.test(clean) &&
      !seen.has(clean.toLowerCase())
    ) {
      seen.add(clean.toLowerCase());
      keywords.push(clean);
    }
  }

  return keywords;
}

function checkFormatting(text: string): FormatCheckResult {
  const details: string[] = [];
  let score = 0;

  const hasSectionHeaders = /\b(education|experience|skills?|summary|objective|projects?|certifications?|languages|publications|awards|interests|volunteer|leadership|achievements?|employment|qualifications?|profile|technical|professional|background|work)\b\s*:?\n/i.test(text);
  if (hasSectionHeaders) {
    score += 25;
    details.push("Section headers found");
  } else {
    details.push("Missing clear section headers");
  }

  const hasBulletPoints = /^[-*•‣⁃◦●◆◇▸▹►▻▪▫■□✦✧]|\d+[.)]\s/m.test(text);
  if (hasBulletPoints) {
    score += 20;
    details.push("Bullet points found");
  } else {
    details.push("No bullet points detected");
  }

  const hasMetrics = /\d+%/m.test(text);
  if (hasMetrics) {
    score += 20;
    details.push("Quantified achievements found");
  } else {
    details.push("No quantified metrics found");
  }

  const lines = text.split("\n").filter(l => l.trim().length > 0);
  const avgLineLength = lines.length > 0 ? text.length / lines.length : 0;
  if (avgLineLength > 30 && avgLineLength < 150) {
    score += 15;
    details.push("Readable line lengths");
  } else {
    details.push("Line lengths may impact readability");
  }

  const totalWords = text.split(/\s+/).length;
  if (totalWords >= 200 && totalWords <= 1500) {
    score += 10;
    details.push("Good document length");
  } else {
    details.push("Document length outside optimal range (200-1500 words)");
  }

  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text);
  if (hasEmail) score += 5;

  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
  if (hasPhone) score += 5;

  return { score: Math.min(score, 100), details };
}

function generateSuggestions(
  missingSkills: string[],
  formattingDetails: string[],
  keywordMatch: number,
  formattingScore: number,
): string[] {
  const suggestions: string[] = [];

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 5).join(", ");
    suggestions.push(`Add experience with these missing keywords: ${topMissing}.`);
  }

  if (formattingScore < 50) {
    suggestions.push("Improve resume formatting with clear section headers like 'Experience', 'Education', 'Skills'.");
  }

  if (formattingDetails.some(d => d.includes("No bullet"))) {
    suggestions.push("Use bullet points to list achievements — ATS systems parse bulleted content more reliably.");
  }

  if (formattingDetails.some(d => d.includes("metrics") || d.includes("quantified"))) {
    suggestions.push("Include quantifiable achievements (percentages, dollar amounts, time saved) to boost score.");
  }

  if (keywordMatch < 40) {
    suggestions.push("Low keyword match — tailor your resume with more terminology from the job description.");
  }

  if (keywordMatch >= 80 && formattingScore >= 70) {
    suggestions.push("Strong ATS match — consider submitting directly or adding a cover letter for an edge.");
  }

  return suggestions;
}

function estimateContentScore(
  presentSkillCount: number,
  totalKeywords: number,
  formattingScore: number,
  wordCount: number,
): number {
  let score = 0;

  const matchRatio = totalKeywords > 0 ? presentSkillCount / totalKeywords : 0;
  score += matchRatio * 50;

  if (wordCount >= 250) score += 15;
  if (formattingScore >= 50) score += 15;
  if (presentSkillCount >= 15) score += 10;
  if (presentSkillCount >= 30) score += 10;

  return Math.min(100, Math.round(score));
}

export function calculateATSScore(resumeText: string, jobDescription: string): ATSScoreResult {
  const jdKeywords = extractKeywords(jobDescription);

  const resumeLower = resumeText.toLowerCase();
  const presentSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const kw of jdKeywords) {
    const kwLower = kw.toLowerCase();
    const isPresent =
      resumeLower.includes(kwLower) ||
      new RegExp("\\b" + kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(resumeText);

    if (isPresent) {
      presentSkills.push(kw);
    } else {
      missingSkills.push(kw);
    }
  }

  const totalKeywords = jdKeywords.length;
  const keywordMatch = totalKeywords > 0
    ? Math.round((presentSkills.length / totalKeywords) * 100)
    : 0;

  const { score: formattingScore, details: formattingDetails } = checkFormatting(resumeText);

  const wordCount = resumeText.split(/\s+/).length;
  const contentScore = estimateContentScore(
    presentSkills.length,
    totalKeywords,
    formattingScore,
    wordCount,
  );

  const score = Math.round(
    keywordMatch * 0.50 + formattingScore * 0.20 + contentScore * 0.30,
  );

  const suggestions = generateSuggestions(
    missingSkills,
    formattingDetails,
    keywordMatch,
    formattingScore,
  );

  return {
    score: Math.min(100, score),
    keywordMatch,
    formatting: formattingScore,
    contentScore,
    missingSkills,
    presentSkills,
    suggestions,
  };
}

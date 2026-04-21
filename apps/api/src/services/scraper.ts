import FirecrawlApp from "firecrawl";
import { config } from "../core/config.js";
import { llm } from "../ai/model.js";
import { JDExtractionSchema } from "../ai/schemas.js";

const firecrawl = config.FIRECRAWL_API_KEY
  ? new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY })
  : null;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata.google",
]);

const BLOCKED_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function isInternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    if (BLOCKED_HOSTS.has(hostname)) return true;

    const ipPatterns = [/^(\d{1,3}\.){3}\d{1,3}$/, /^\[::1\]$/];

    for (const pattern of ipPatterns) {
      if (pattern.test(hostname)) {
        if (BLOCKED_IP_PATTERNS.some((p) => p.test(hostname))) {
          return true;
        }
      }
    }

    if (hostname === "metadata.google.internal") return true;

    return false;
  } catch {
    return true;
  }
}

export interface JobDescriptionResult {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary?: string;
  url: string;
  source: "firecrawl" | "scrape" | "serp";
}

export async function scrapeJobDescription(
  url: string,
): Promise<JobDescriptionResult | null> {
  if (isInternalUrl(url)) {
    console.error("SSRF attempt blocked:", url);
    return null;
  }

  if (firecrawl) {
    try {
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
      });

      const resultData = scrapeResult as any;
      if (resultData.success && resultData.data) {
        const text = resultData.data.markdown || resultData.data.html || "";
        const aiData = await extractJDInfoWithAI(text);

        return {
          title: aiData?.title || extractTitle(text) || "Unknown Title",
          company: extractCompany(text) || "Unknown Company",
          location: extractLocation(text) || "Not Specified",
          description: text,
          requirements:
            aiData?.requiredSkills?.map((s: any) => s.name) ||
            extractRequirements(text),
          benefits: extractBenefits(text),
          salary: extractSalary(text) || undefined,
          url,
          source: "firecrawl",
        };
      }
    } catch (error) {
      console.error("Firecrawl error:", error);
    }
  }

  const fallback = await fallbackScrape(url);
  if (fallback) {
    const aiData = await extractJDInfoWithAI(fallback.description);
    return {
      ...fallback,
      title: aiData?.title || fallback.title,
      requirements:
        aiData?.requiredSkills?.map((s: any) => s.name) ||
        fallback.requirements,
    };
  }

  return null;
}

async function extractJDInfoWithAI(text: string): Promise<any> {
  try {
    const response = await llm.withStructuredOutput(JDExtractionSchema).invoke([
      {
        role: "system",
        content:
          "You are an expert recruiter. Extract structured job description information from the provided text.",
      },
      { role: "user", content: text.substring(0, 10000) },
    ]);
    return response;
  } catch (error) {
    console.error("AI extraction error:", error);
    return null;
  }
}

export async function searchJobListings(
  query: string,
  limit: number = 10,
): Promise<JobDescriptionResult[]> {
  if (!config.SERP_API_KEY) {
    console.warn("SERP_API_KEY not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${limit}&gl=us&hl=en&api_key=${config.SERP_API_KEY}`,
    );

    if (!response.ok) {
      console.error("SERP API error:", response.status);
      return [];
    }

    const data = await response.json();
    const results: JobDescriptionResult[] = [];

    if (data.organic_results) {
      for (const result of data.organic_results.slice(0, limit)) {
        results.push({
          title: result.title || "Unknown Title",
          company: result.source || "Unknown Company",
          location: result.location || "Not Specified",
          description: result.snippet || "",
          requirements: [],
          benefits: [],
          url: result.link || "",
          source: "serp",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("SERP search error:", error);
    return [];
  }
}

async function fallbackScrape(
  url: string,
): Promise<JobDescriptionResult | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    const title =
      $("title").text() || $("h1").first().text() || "Unknown Title";
    const description =
      $('meta[name="description"]').attr("content") ||
      $("body").text().substring(0, 2000);

    return {
      title: title.trim(),
      company: extractCompany(description) || "Unknown Company",
      location: extractLocation(description) || "Not Specified",
      description,
      requirements: extractRequirements(description),
      benefits: extractBenefits(description),
      salary: extractSalary(description) || undefined,
      url,
      source: "scrape",
    };
  } catch (error) {
    console.error("Fallback scrape error:", error);
    return null;
  }
}

function extractTitle(text: string): string {
  const patterns = [
    /^(.+?)\s+[-|]\s*.+?(?:job|career)/i,
    /^(.+?)\s+at\s+.+/i,
    /title:\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "Unknown Title";
}

function extractCompany(text: string): string {
  const patterns = [
    /(?:company|employer|at)\s*[:\-]?\s*(.+)/i,
    /(?:company|employer)\s*:\s*(.+)/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function extractLocation(text: string): string {
  const patterns = [
    /(?:location|remote|location:)\s*[:\-]?\s*(.+)/i,
    /(?:location|remote)\s*:\s*(.+)/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}

function extractRequirements(text: string): string[] {
  const requirements: string[] = [];
  const patterns = [
    /(?:requirements?|qualifications?|what you[' ]?ll need)[:\s]([\s\S]{0,500})/i,
    /(?:must have|required)[:\s]([\s\S]{0,500})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const items = match[1]
        .split(/[,•\n]/)
        .filter((s: string) => s.trim().length > 5);
      requirements.push(...items.slice(0, 10));
      break;
    }
  }

  return requirements.slice(0, 15);
}

function extractBenefits(text: string): string[] {
  const benefits: string[] = [];
  const patterns = [
    /(?:benefits|perks|what we offer)[:\s]([\s\S]{0,500})/i,
    /(?:benefits|perks)[:\s]([\s\S]{0,500})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const items = match[1]
        .split(/[,•\n]/)
        .filter((s: string) => s.trim().length > 5);
      benefits.push(...items.slice(0, 10));
      break;
    }
  }

  return benefits.slice(0, 10);
}

function extractSalary(text: string): string {
  const patterns = [
    /\$\d{1,3}(?:,\d{3})*(?:\s*-\s*\$?\d{1,3}(?:,\d{3})*)?(?:\s*(?:per|\/)\s*(?:year|month|hour))?/gi,
    /(?:salary|compensation|pay)[:\s]*\$?\d{1,3}(?:,\d{3})*(?:\s*-\s*\$?\d{1,3}(?:,\d{3})*)?/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }

  return "";
}

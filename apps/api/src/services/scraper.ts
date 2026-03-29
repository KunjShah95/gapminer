import { FirecrawlApp } from 'firecrawl';
import { GoogleSearch } from 'google-search-results';
import { config } from '../core/config.js';

const firecrawl = config.FIRECRAWL_API_KEY ? new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY }) : null;

export interface JobDescriptionResult {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary?: string;
  url: string;
  source: 'firecrawl' | 'scrape' | 'serp';
}

export async function scrapeJobDescription(url: string): Promise<JobDescriptionResult | null> {
  if (firecrawl) {
    try {
      const scrapeResult = await firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (scrapeResult.success && scrapeResult.data) {
        return {
          title: extractTitle(scrapeResult.data.markdown || '') || 'Unknown Title',
          company: extractCompany(scrapeResult.data.markdown || '') || 'Unknown Company',
          location: extractLocation(scrapeResult.data.markdown || '') || 'Not Specified',
          description: scrapeResult.data.markdown || '',
          requirements: extractRequirements(scrapeResult.data.markdown || ''),
          benefits: extractBenefits(scrapeResult.data.markdown || ''),
          salary: extractSalary(scrapeResult.data.markdown || ''),
          url,
          source: 'firecrawl',
        };
      }
    } catch (error) {
      console.error('Firecrawl error:', error);
    }
  }

  return fallbackScrape(url);
}

export async function searchJobListings(query: string, limit: number = 10): Promise<JobDescriptionResult[]> {
  if (!config.SERP_API_KEY) {
    console.warn('SERP_API_KEY not configured');
    return [];
  }

  return new Promise((resolve) => {
    const search = new GoogleSearch(config.SERP_API_KEY);

    const params = {
      q: query,
      num: limit,
      gl: 'us',
      hl: 'en',
      start: 0,
    };

    search.json(params, (data: any) => {
      const results: JobDescriptionResult[] = [];

      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, limit)) {
          results.push({
            title: result.title || 'Unknown Title',
            company: result.source || 'Unknown Company',
            location: result.location || 'Not Specified',
            description: result.snippet || '',
            requirements: [],
            benefits: [],
            url: result.link || '',
            source: 'serp',
          });
        }
      }

      resolve(results);
    });
  });
}

async function fallbackScrape(url: string): Promise<JobDescriptionResult | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    const title = $('title').text() || $('h1').first().text() || 'Unknown Title';
    const description = $('meta[name="description"]').attr('content') || $('body').text().substring(0, 2000);

    return {
      title: title.trim(),
      company: extractCompany(description),
      location: extractLocation(description),
      description,
      requirements: extractRequirements(description),
      benefits: extractBenefits(description),
      salary: extractSalary(description),
      url,
      source: 'scrape',
    };
  } catch (error) {
    console.error('Fallback scrape error:', error);
    return null;
  }
}

function extractTitle(text: string): string | null {
  const patterns = [
    /^(.+?)\s+[-|]\s*.+?(?:job|career)/i,
    /^(.+?)\s+at\s+.+/i,
    /title:\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractCompany(text: string): string | null {
  const patterns = [
    /(?:company|employer|at)\s*[:\-]?\s*(.+)/i,
    /(?:company|employer)\s*:\s*(.+)/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractLocation(text: string): string | null {
  const patterns = [
    /(?:location|remote|location:)\s*[:\-]?\s*(.+)/i,
    /(?:location|remote)\s*:\s*(.+)/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
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
      const items = match[1].split(/[,•\n]/).filter((s: string) => s.trim().length > 5);
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
      const items = match[1].split(/[,•\n]/).filter((s: string) => s.trim().length > 5);
      benefits.push(...items.slice(0, 10));
      break;
    }
  }

  return benefits.slice(0, 10);
}

function extractSalary(text: string): string | undefined {
  const patterns = [
    /\$\d{1,3}(?:,\d{3})*(?:\s*-\s*\$?\d{1,3}(?:,\d{3})*)?(?:\s*(?:per|\/)\s*(?:year|month|hour))?/gi,
    /(?:salary|compensation|pay)[:\s]*\$?\d{1,3}(?:,\d{3})*(?:\s*-\s*\$?\d{1,3}(?:,\d{3})*)?/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }

  return undefined;
}

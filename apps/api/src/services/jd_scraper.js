// JD Scraper service — mirrors app/services/jd_scraper.py

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export async function scrapeJdFromUrl(url) {
  try {
    const response = await fetch(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get plain text content
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    // Get title
    const titleText = $('title').text().trim() || 'Unknown Position';

    // Get company meta
    const companyMeta = $('meta[name="company"]').attr('content');

    return {
      title: titleText,
      company: companyMeta || null,
      text: textContent.substring(0, 50000),
      parsed: {
        url,
        scraped: true,
      },
    };
  } catch (error) {
    return {
      title: 'Job Description',
      company: null,
      text: `Failed to scrape URL: ${error.message}`,
      parsed: { error: error.message },
    };
  }
}

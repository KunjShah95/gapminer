import express from 'express';
import { scrapeJobDescription, searchJobListings, type JobDescriptionResult } from '../../../services/scraper.js';
import { requireAuth } from '../../../core/security.js';

const router = express.Router();

router.post('/scrape', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await scrapeJobDescription(url);

    if (!result) {
      return res.status(422).json({ error: 'Failed to scrape job description' });
    }

    res.json(result);
  } catch (err: any) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/search', requireAuth, async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await searchJobListings(query, limit || 10);

    res.json({ results });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

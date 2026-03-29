// Job Description endpoints — mirrors app/api/endpoints/job_descriptions.py
// Routes: POST /scrape, POST /, GET /:id, GET /

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../core/database.js';
import { requireUser } from '../../../core/security.js';
import { scrapeJdFromUrl } from '../../../services/jd_scraper.js';

const router = Router();

// ─── POST /jd/scrape ──────────────────────────────────────────
router.post('/scrape', requireUser, async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(422).json({ error: 'url is required' });

    const scraped = await scrapeJdFromUrl(url);
    const id = uuidv4();

    await query(
      `INSERT INTO job_descriptions (id, user_id, title, company, raw_text, source_url, parsed_data, scraped_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
      [
        id,
        req.userId,
        scraped.title ?? 'Unknown',
        scraped.company ?? null,
        scraped.text ?? '',
        url,
        JSON.stringify(scraped.parsed ?? {}),
      ]
    );

    return res.status(201).json({ id, title: scraped.title, company: scraped.company });
  } catch (err) {
    next(err);
  }
});

// ─── POST /jd/ ────────────────────────────────────────────────
router.post('/', requireUser, async (req, res, next) => {
  try {
    const { title, company, raw_text, source_url } = req.body;
    if (!title || !raw_text) {
      return res.status(422).json({ error: 'title and raw_text are required' });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO job_descriptions (id, user_id, title, company, raw_text, source_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [id, req.userId, title, company ?? null, raw_text, source_url ?? null]
    );

    return res.status(201).json({ id, title });
  } catch (err) {
    next(err);
  }
});

// ─── GET /jd/:jdId ────────────────────────────────────────────
router.get('/:jdId', requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM job_descriptions WHERE id = $1 AND user_id = $2',
      [req.params.jdId, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Job description not found' });
    const jd = rows[0];
    return res.json({
      id: jd.id,
      title: jd.title,
      company: jd.company,
      raw_text: jd.raw_text,
      parsed_data: jd.parsed_data,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /jd/ ─────────────────────────────────────────────────
router.get('/', requireUser, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, title, company, created_at FROM job_descriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;

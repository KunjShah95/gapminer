// Skills Trend endpoints — provides skill demand analytics and market trends
// Routes: GET /trends, GET /top

import { Router } from 'express';
import { requireAuth } from '../../../core/security.js';
import { getTopTrendingSkills, generateSkillTrendData } from '../../../ai/agents/marketTrend.js';

const router = Router();

/**
 * @typedef {Object} SkillTrendData
 * @property {string} skill - Skill name
 * @property {string} category - Skill category
 * @property {string} trend - Trend direction (emerging, stable, declining)
 * @property {number} demandScore - Current demand score (0-100)
 * @property {number} growthRate - Year-over-year growth percentage
 * @property {Array} historicalData - 12 months of historical data
 */

// ─── GET /skills/trends ─────────────────────────────────────────
/**
 * Get skill demand trends over time
 * Query params:
 *   - category: Filter by category (Programming Languages, Web Frameworks, Cloud & DevOps, AI/ML, Data)
 *   - skills: Comma-separated list of skills to compare
 *   - timeframe: Time range in months (default: 12)
 */
router.get('/trends', requireAuth, async (req, res, next) => {
  try {
    const {
      category,
      skills,
      timeframe = '12'
    } = req.query;

    const months = parseInt(timeframe, 10) || 12;

    // If specific skills are requested, generate trend data for them
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      const skillTrends = skillList.map((skill) => ({
        skill,
        category: category || 'Custom',
        demandScore: 70 + Math.floor(Math.random() * 30),
        trend: Math.random() > 0.6 ? 'emerging' : Math.random() > 0.3 ? 'stable' : 'declining',
        growthRate: Math.round((Math.random() * 40 - 10) * 10) / 10,
        historicalData: generateSkillTrendData(
          skill,
          Math.random() > 0.6 ? 'emerging' : Math.random() > 0.3 ? 'stable' : 'declining',
          70 + Math.floor(Math.random() * 30)
        ).slice(-months)
      }));

      return res.json({
        skills: skillTrends,
        timeframe: months,
        generatedAt: new Date().toISOString()
      });
    }

    // Otherwise return all trending skills (optionally filtered by category)
    const trendingSkills = await getTopTrendingSkills(
      category || undefined,
      50 // Return more for filtering/display purposes
    );

    // Limit historical data to requested timeframe
    const limitedTrends = trendingSkills.map(skill => ({
      ...skill,
      historicalData: skill.historicalData.slice(-months)
    }));

    return res.json({
      skills: limitedTrends,
      timeframe: months,
      categories: [...new Set(limitedTrends.map(s => s.category))],
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /skills/top ────────────────────────────────────────────
/**
 * Get top trending skills
 * Query params:
 *   - category: Filter by category
 *   - limit: Number of skills to return (default: 10)
 *   - trend: Filter by trend type (emerging, stable, declining)
 */
router.get('/top', requireAuth, async (req, res, next) => {
  try {
    const {
      category,
      limit = '10',
      trend
    } = req.query;

    const maxResults = Math.min(parseInt(limit, 10) || 10, 50);

    let topSkills = await getTopTrendingSkills(
      category || undefined,
      maxResults * 2 // Fetch extra for filtering
    );

    // Filter by trend if specified
    if (trend) {
      topSkills = topSkills.filter(s => s.trend === trend);
    }

    // Limit to requested number
    topSkills = topSkills.slice(0, maxResults);

    return res.json({
      skills: topSkills,
      total: topSkills.length,
      filters: {
        category: category || null,
        trend: trend || null
      },
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /skills/categories ─────────────────────────────────────
/**
 * Get available skill categories
 */
router.get('/categories', requireAuth, async (req, res, next) => {
  try {
    const categories = [
      { id: 'programming-languages', name: 'Programming Languages', icon: 'code' },
      { id: 'web-frameworks', name: 'Web Frameworks', icon: 'layout' },
      { id: 'cloud-devops', name: 'Cloud & DevOps', icon: 'cloud' },
      { id: 'ai-ml', name: 'AI/ML', icon: 'brain' },
      { id: 'data', name: 'Data', icon: 'database' }
    ];

    return res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// ─── GET /skills/compare ────────────────────────────────────────
/**
 * Compare multiple skills side-by-side
 * Query params:
 *   - skills: Comma-separated list of skills (required)
 */
router.get('/compare', requireAuth, async (req, res, next) => {
  try {
    const { skills, timeframe = '12' } = req.query;

    if (!skills) {
      return res.status(400).json({ error: 'skills parameter is required' });
    }

    const skillList = skills.split(',').map((s) => s.trim()).slice(0, 5); // Max 5 skills
    const months = parseInt(timeframe, 10) || 12;

    const allTrends = await getTopTrendingSkills(undefined, 100);

    const comparison = skillList.map((skillName) => {
      const existingSkill = allTrends.find(
        s => s.skill.toLowerCase() === skillName.toLowerCase()
      );

      if (existingSkill) {
        return {
          ...existingSkill,
          historicalData: existingSkill.historicalData.slice(-months)
        };
      }

      // Generate data for unknown skills
      const demandScore = 60 + Math.floor(Math.random() * 30);
      const trend = Math.random() > 0.5 ? 'stable' : 'emerging';
      return {
        skill: skillName,
        category: 'Unknown',
        trend,
        demandScore,
        growthRate: Math.round((Math.random() * 20 - 5) * 10) / 10,
        historicalData: generateSkillTrendData(skillName, trend, demandScore).slice(-months)
      };
    });

    return res.json({
      comparison,
      timeframe: months,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

export default router;

// AI Pipeline service — mirrors app/services/ai_pipeline.py

import { v4 as uuidv4 } from 'uuid';
import { query } from '../core/database.js';

class DocumentParser {
  async parse(resumeId) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      name: 'John Doe',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Node.js', 'Express'],
      experience: [],
    };
  }
}

class SemanticSkillExtractor {
  async extract(resumeText, jdText) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      resume_skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'Node.js'],
      jd_skills: ['Python', 'Node.js', 'Express', 'PostgreSQL', 'Kubernetes', 'Redis'],
      required_skills: ['Kubernetes', 'Express', 'Redis'],
      preferred_skills: ['AWS', 'Terraform'],
    };
  }
}

class GapAnalyzer {
  async analyze(resumeSkills, jdSkills) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const gaps = [];
    
    // Quick string hash for stable random-ish values
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };

    for (const skill of jdSkills) {
      if (resumeSkills.includes(skill)) {
        gaps.push({
          skill,
          status: 'matched',
          severity: 'low',
          confidence: 0.95,
          radar_score: 85,
        });
      } else {
        const h = hash(skill);
        gaps.push({
          skill,
          status: 'missing',
          severity: 'high',
          confidence: 0.88,
          radar_score: 30,
          market_demand: 80 + (h % 20),
          trend_delta: (h % 30) - 10,
        });
      }
    }
    return gaps;
  }
}

class RoadmapGenerator {
  async generate(gaps, seniority) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const missing = gaps.filter((g) => g.status === 'missing').slice(0, 4);
    const milestones = missing.map((gap, i) => ({
      week: i + 1,
      title: `Learn ${gap.skill}`,
      description: `Master ${gap.skill} fundamentals and practical applications`,
      skills: [gap.skill],
      estimated_hours: 20,
      resources: [
        {
          title: `${gap.skill} Documentation`,
          url: `https://docs.${gap.skill.toLowerCase()}.com`,
          type: 'documentation',
          provider: 'Official',
          estimated_hours: 8,
          is_free: true,
        },
        {
          title: `${gap.skill} Course`,
          url: `https://coursera.org/${gap.skill.toLowerCase()}`,
          type: 'course',
          provider: 'Coursera',
          estimated_hours: 12,
          is_free: false,
        },
      ],
    }));

    const totalHours = milestones.reduce((sum, m) => sum + m.estimated_hours, 0);

    return {
      title: `Learning Roadmap - ${seniority.charAt(0).toUpperCase() + seniority.slice(1)} Level`,
      total_weeks: milestones.length,
      total_hours: totalHours,
      milestones,
    };
  }
}

async function updateStep(analysisId, label, status, message = null) {
  let q = 'UPDATE analysis_steps SET status = $1';
  const args = [status, analysisId, label];
  if (message) {
    q += ', message = $4';
    args.push(message);
  }
  q += ' WHERE analysis_id = $2 AND label = $3';
  await query(q, args);
}

export async function runAnalysisPipeline(analysisId, seniority = 'mid') {
  try {
    const { rows: analyses } = await query('SELECT * FROM analyses WHERE id = $1', [analysisId]);
    const analysis = analyses[0];
    if (!analysis) return;

    // -- 1. Parsing Resume
    await updateStep(analysisId, 'Parsing resume', 'running');
    await query("UPDATE analyses SET status = 'parsing' WHERE id = $1", [analysisId]);

    const parser = new DocumentParser();
    const parsedResume = await parser.parse(analysis.resume_id);

    await query('UPDATE resumes SET parsed_data = $1 WHERE id = $2', [JSON.stringify(parsedResume), analysis.resume_id]);
    await updateStep(analysisId, 'Parsing resume', 'done', 'Resume parsed successfully');

    // -- 2. Extracting Skills
    await updateStep(analysisId, 'Extracting skills', 'running');
    await query("UPDATE analyses SET status = 'extracting' WHERE id = $1", [analysisId]);

    const extractor = new SemanticSkillExtractor();
    const resumeText = parsedResume.summary || '';
    
    let jdText = '';
    if (analysis.job_description_id) {
      const { rows: jds } = await query('SELECT raw_text FROM job_descriptions WHERE id = $1', [analysis.job_description_id]);
      if (jds[0]) jdText = jds[0].raw_text;
    }

    const skillData = await extractor.extract(resumeText, jdText);
    await updateStep(
      analysisId,
      'Extracting skills',
      'done',
      `Found ${skillData.resume_skills.length} resume skills, ${skillData.jd_skills.length} required skills`
    );

    // -- 3. Comparing Requirements
    await updateStep(analysisId, 'Comparing with job requirements', 'running');
    await query("UPDATE analyses SET status = 'comparing' WHERE id = $1", [analysisId]);

    const analyzer = new GapAnalyzer();
    const gaps = await analyzer.analyze(skillData.resume_skills, skillData.jd_skills);

    for (const gap of gaps) {
      await query(
        `INSERT INTO skill_gaps (id, analysis_id, skill, category, status, severity, confidence, radar_score, market_demand, trend_delta)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuidv4(),
          analysisId,
          gap.skill,
          'technical',
          gap.status,
          gap.severity,
          gap.confidence,
          gap.radar_score,
          gap.market_demand || null,
          gap.trend_delta || null,
        ]
      );
    }

    const matched = gaps.filter((g) => g.status === 'matched').length;
    const total = gaps.length;
    const overallScore = total > 0 ? Math.floor((matched / total) * 100) : 0;

    await query(
      `UPDATE analyses SET overall_score = $1, resume_strength_score = $2, ats_score = $3 WHERE id = $4`,
      [overallScore, 70, 75, analysisId]
    );

    const missingCount = gaps.filter((g) => g.status === 'missing').length;
    await updateStep(
      analysisId,
      'Comparing with job requirements',
      'done',
      `Found ${missingCount} skill gaps`
    );

    // -- 4. Generating Roadmap
    await updateStep(analysisId, 'Generating roadmap', 'running');
    await query("UPDATE analyses SET status = 'generating' WHERE id = $1", [analysisId]);

    const roadmapGen = new RoadmapGenerator();
    const roadmapData = await roadmapGen.generate(gaps, seniority);

    const roadmapId = uuidv4();
    await query(
      `INSERT INTO roadmaps (id, analysis_id, user_id, title, total_weeks, total_hours, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [roadmapId, analysisId, analysis.user_id, roadmapData.title, roadmapData.total_weeks, roadmapData.total_hours]
    );

    for (const mData of roadmapData.milestones) {
      const milestoneId = uuidv4();
      await query(
        `INSERT INTO roadmap_milestones (id, roadmap_id, week, title, description, skills, estimated_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          milestoneId,
          roadmapId,
          mData.week,
          mData.title,
          mData.description,
          JSON.stringify(mData.skills),
          mData.estimated_hours,
        ]
      );

      for (const rData of mData.resources) {
        await query(
          `INSERT INTO learning_resources (id, milestone_id, title, url, type, provider, estimated_hours, is_free)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            milestoneId,
            rData.title,
            rData.url,
            rData.type,
            rData.provider,
            rData.estimated_hours,
            rData.is_free,
          ]
        );
      }
    }

    await query(
      "UPDATE analyses SET status = 'complete', roadmap_id = $1, completed_at = NOW() WHERE id = $2",
      [roadmapId, analysisId]
    );
    await updateStep(analysisId, 'Generating roadmap', 'done', `Roadmap created with ${roadmapData.milestones.length} milestones`);

  } catch (err) {
    console.error('Analysis failed:', err);
    await query("UPDATE analyses SET status = 'failed' WHERE id = $1", [analysisId]);
  }
}

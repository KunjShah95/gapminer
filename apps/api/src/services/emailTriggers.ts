import { prisma } from '../core/database.js';
import { sendEmail } from './email.js';

export async function onAnalysisComplete(userId: string, analysisId: string) {
  const [analysis, user] = await Promise.all([
    prisma.analysis.findUnique({ where: { id: analysisId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!user || !analysis) {
    console.warn(`[emailTriggers] User or Analysis not found: userId=${userId}, analysisId=${analysisId}`);
    return;
  }

  const gapAnalysis = analysis.gapAnalysis as any;
  const topGaps: string[] = gapAnalysis?.missingSkills?.slice(0, 5) || [];

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h1>Your Analysis Is Ready</h1>
      <p>Hi ${user.name || 'there'},</p>
      <p>We've analyzed your resume against your target role. Here's a summary of what we found:</p>
      ${topGaps.length > 0 ? `
        <h2>Top Skills to Develop</h2>
        <ul>${topGaps.map((s: string) => `<li><strong>${s}</strong></li>`).join('')}</ul>
      ` : '<p>No critical gaps found — great alignment!</p>'}
      <p style="margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analysis/${analysisId}"
           style="display:inline-block;padding:12px 28px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          View Full Results
        </a>
      </p>
    </div>`;

  return sendEmail({ to: user.email, subject: 'Your Skill Gap Analysis Is Ready', html });
}

export async function onWeeklyDigest(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const recentAnalyses = await prisma.analysis.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const allGaps: string[] = [];
  for (const a of recentAnalyses) {
    const ga = a.gapAnalysis as any;
    if (ga?.missingSkills) allGaps.push(...ga.missingSkills);
  }
  const uniqueGaps = [...new Set(allGaps)].slice(0, 5);

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h1>Your Weekly Digest</h1>
      <p>Hi ${user.name || 'there'},</p>
      ${uniqueGaps.length > 0 ? `
        <p>Here are the skills to prioritise this week:</p>
        <ul>${uniqueGaps.map((s: string) => `<li><strong>${s}</strong></li>`).join('')}</ul>
      ` : '<p>No outstanding gaps — you\'re in great shape!</p>'}
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">Go to Dashboard →</a></p>
    </div>`;

  return sendEmail({ to: user.email, subject: 'Your Weekly GapMiner Digest', html });
}

export async function onMilestoneReached(userId: string, milestoneId: string, roadmapId: string) {
  const [user, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.$queryRawUnsafe<Array<{ id: string; title: string; week: number }>>(
      'SELECT id, title, week FROM roadmap_milestones WHERE id = $1',
      milestoneId,
    ),
  ]);

  if (!user || !rows?.[0]) return;

  const m = rows[0];
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h1>Milestone Unlocked!</h1>
      <p>Hi ${user.name || 'there'},</p>
      <p>You've completed <strong>${m.title}</strong> (Week ${m.week}) on your learning roadmap.</p>
      <p>Every step brings you closer to your career goals — keep going!</p>
      <p style="margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/roadmap/${roadmapId}"
           style="display:inline-block;padding:12px 28px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          View Roadmap
        </a>
      </p>
    </div>`;

  return sendEmail({ to: user.email, subject: `Milestone Reached: ${m.title}`, html });
}

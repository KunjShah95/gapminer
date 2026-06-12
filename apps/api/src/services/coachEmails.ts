import { llmService } from './llm.js';
import { prisma } from '../core/database.js';
import { sendEmail } from './email.js';

export async function generateWeeklyCheckin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.warn(`[coachEmails] User not found: ${userId}`);
    return;
  }

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
  const uniqueGaps = [...new Set(allGaps)];
  const targetRole = user.targetRole || 'your desired role';

  const systemMsg = 'You are an encouraging career coach. Keep responses concise, supportive, and actionable. Output plain text paragraphs separated by blank lines.';

  const userMsg = `Write a short weekly coaching email for ${user.name || 'a professional'} targeting a ${targetRole} role.

Skills to develop: ${uniqueGaps.length > 0 ? uniqueGaps.join(', ') : 'None identified — keep building on existing strengths.'}

Structure:
1. Warm greeting and progress recap
2. Specific next steps for the week ahead
3. Motivational closing

Sign as "Your GapMiner Coach".`;

  let content: string;
  try {
    const response = await llmService.initialize().chat([
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ]);
    content = response.content || 'Keep up the great work on your career journey!';
  } catch (err: any) {
    console.error('[coachEmails] LLM call failed:', err.message);
    content = `Hi ${user.name || 'there'},

Here's your weekly check-in! Keep working on your skills — consistency is key. Focus on one area at a time and celebrate small wins along the way.

Your GapMiner Coach`;
  }

  const html = content
    .split('\n')
    .filter(Boolean)
    .map(line => line.trim() ? `<p>${line}</p>` : '')
    .join('');

  return sendEmail({
    to: user.email,
    subject: 'Your Weekly Coaching Check-in',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">${html}</div>`,
  });
}

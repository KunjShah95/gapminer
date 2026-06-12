/**
 * Cover Letter Engine v2
 *
 * Features:
 * - Template management (CRUD)
 * - Auto-tailor per job (master template → JD-specific version)
 * - Variant generation (multiple tones/angles per job)
 * - Outcome tracking
 */

import { v4 as uuidv4 } from "uuid";
import { query } from "../core/database.js";
import { llm } from "../ai/model.js";
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// ─── Types ─────────────────────────────────────────────────────

export interface CoverLetterTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  tone: "professional" | "enthusiastic" | "casual";
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterVariant {
  id: string;
  templateId: string;
  userId: string;
  variantName: string;
  content: string;
  tone: string;
  jobUrl?: string;
  companyName?: string;
  jobTitle?: string;
  status: "draft" | "sent" | "rejected" | "interview";
  createdAt: string;
}

export interface TailorRequest {
  templateId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  resumeText?: string;
}

export interface TailorResult {
  variants: CoverLetterVariant[];
  highlights: string[];
}

// ─── Template CRUD ─────────────────────────────────────────────

export async function createTemplate(
  userId: string,
  data: {
    name: string;
    content: string;
    tone?: string;
    targetRole?: string;
  },
): Promise<CoverLetterTemplate> {
  const id = uuidv4();
  const tone = data.tone || "professional";

  await query(
    `INSERT INTO cover_letter_templates (id, user_id, name, content, tone, target_role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [id, userId, data.name, data.content, tone, data.targetRole || null],
  );

  return {
    id,
    userId,
    name: data.name,
    content: data.content,
    tone: tone as CoverLetterTemplate["tone"],
    targetRole: data.targetRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function listTemplates(userId: string): Promise<CoverLetterTemplate[]> {
  const { rows } = await query(
    `SELECT * FROM cover_letter_templates WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map(mapTemplate);
}

export async function getTemplate(id: string, userId: string): Promise<CoverLetterTemplate | null> {
  const { rows } = await query(
    `SELECT * FROM cover_letter_templates WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ? mapTemplate(rows[0]) : null;
}

export async function updateTemplate(
  id: string,
  userId: string,
  data: { name?: string; content?: string; tone?: string; targetRole?: string },
): Promise<CoverLetterTemplate | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.content !== undefined) { updates.push(`content = $${idx++}`); values.push(data.content); }
  if (data.tone !== undefined) { updates.push(`tone = $${idx++}`); values.push(data.tone); }
  if (data.targetRole !== undefined) { updates.push(`target_role = $${idx++}`); values.push(data.targetRole); }

  if (updates.length === 0) return getTemplate(id, userId);

  updates.push(`updated_at = NOW()`);
  values.push(id, userId);

  const { rows } = await query(
    `UPDATE cover_letter_templates SET ${updates.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values,
  );
  return rows[0] ? mapTemplate(rows[0]) : null;
}

export async function deleteTemplate(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM cover_letter_templates WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (rowCount ?? 0) > 0;
}

function mapTemplate(row: any): CoverLetterTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    content: row.content,
    tone: row.tone || "professional",
    targetRole: row.target_role,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
  };
}

// ─── Variant Management ────────────────────────────────────────

export async function saveVariant(
  userId: string,
  data: {
    templateId: string;
    variantName: string;
    content: string;
    tone: string;
    jobUrl?: string;
    companyName?: string;
    jobTitle?: string;
  },
): Promise<CoverLetterVariant> {
  const id = uuidv4();

  await query(
    `INSERT INTO cover_letter_variants (id, template_id, user_id, variant_name, content, tone, job_url, company_name, job_title, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', NOW())`,
    [
      id,
      data.templateId,
      userId,
      data.variantName,
      data.content,
      data.tone,
      data.jobUrl || null,
      data.companyName || null,
      data.jobTitle || null,
    ],
  );

  return {
    id,
    templateId: data.templateId,
    userId,
    variantName: data.variantName,
    content: data.content,
    tone: data.tone,
    jobUrl: data.jobUrl,
    companyName: data.companyName,
    jobTitle: data.jobTitle,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export async function listVariants(
  userId: string,
  templateId?: string,
): Promise<CoverLetterVariant[]> {
  let sql = `SELECT * FROM cover_letter_variants WHERE user_id = $1`;
  const params: any[] = [userId];

  if (templateId) {
    sql += ` AND template_id = $2`;
    params.push(templateId);
  }

  sql += ` ORDER BY created_at DESC`;

  const { rows } = await query(sql, params);
  return rows.map(mapVariant);
}

export async function updateVariantStatus(
  id: string,
  userId: string,
  status: "sent" | "rejected" | "interview",
): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE cover_letter_variants SET status = $1 WHERE id = $2 AND user_id = $3`,
    [status, id, userId],
  );
  return (rowCount ?? 0) > 0;
}

function mapVariant(row: any): CoverLetterVariant {
  return {
    id: row.id,
    templateId: row.template_id,
    userId: row.user_id,
    variantName: row.variant_name,
    content: row.content,
    tone: row.tone,
    jobUrl: row.job_url,
    companyName: row.company_name,
    jobTitle: row.job_title,
    status: row.status || "draft",
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

// ─── Auto-Tailor Engine ────────────────────────────────────────

const TailorVariantsSchema = z.object({
  variants: z.array(
    z.object({
      variantName: z.string().describe("Short name for this variant tone"),
      content: z
        .string()
        .describe(
          "The full cover letter content tailored to this job posting",
        ),
      tone: z
        .enum(["professional", "enthusiastic", "casual", "skill-focused"])
        .describe("The tone used for this variant"),
    }),
  ),
  highlights: z
    .array(z.string())
    .describe("Top 3-5 candidate strengths emphasized across variants"),
});

/**
 * Auto-tailor a template to a specific job.
 * Generates 3 variants with different tones/angles.
 */
export async function autoTailor(
  request: TailorRequest,
): Promise<TailorResult> {
  const template = await query(
    `SELECT * FROM cover_letter_templates WHERE id = $1`,
    [request.templateId],
  );

  if (!template.rows[0]) {
    throw new Error("Template not found");
  }

  const masterTemplate = template.rows[0].content;

  const response = await llm
    .withStructuredOutput(TailorVariantsSchema)
    .invoke([
      new SystemMessage(`
        You are an expert cover letter writer who tailors applications to specific job postings.

        MASTER TEMPLATE:
        ${masterTemplate}

        JOB TITLE: ${request.jobTitle}
        COMPANY: ${request.companyName}
        JOB DESCRIPTION: ${request.jobDescription}

        ${request.resumeText ? `CANDIDATE RESUME:\n${request.resumeText}` : ""}

        TASK:
        Generate 3 distinct variants of this cover letter tailored to the job posting.

        VARIANT 1 - Professional: Formal, data-driven, emphasizes qualifications and achievements.
        VARIANT 2 - Enthusiastic: Energetic, highlights culture fit and passion for the role.
        VARIANT 3 - Skill-Focused: Heavily optimized for keywords and technical requirements.

        Each variant should:
        - Be 3-4 paragraphs (250-400 words)
        - Incorporate specific requirements from the job description
        - Mention the company name naturally
        - Adjust tone while keeping the applicant's core narrative
      `),
      new HumanMessage(
        `Create 3 tailored variants for ${request.jobTitle} at ${request.companyName}`,
      ),
    ]);

  return response;
}

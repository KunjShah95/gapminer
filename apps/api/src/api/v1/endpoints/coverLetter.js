import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { generateCoverLetter } from "../../../services/transformerModels.js";
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  saveVariant,
  listVariants,
  updateVariantStatus,
  autoTailor,
} from "../../../services/coverLetterV2.js";

const router = Router();

// ─── Legacy generation route ───────────────────────────────────

router.post("/", async (req, res) => {
  try {
    const { resumeText, jobDescription, resumeData, jdData } = req.body;

    if (!resumeText || !jobDescription) {
      return res
        .status(400)
        .json({ error: "resumeText and jobDescription are required" });
    }

    const coverLetter = await generateCoverLetter(
      resumeData || { workExperience: [], skills: [], summary: resumeText },
      jdData || {
        title: "",
        requiredSkills: [],
        description: jobDescription,
      },
    );

    res.json({
      success: true,
      coverLetter,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: "LaMini-Flan-T5-783m",
      },
    });
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    res.status(500).json({
      error: "Failed to generate cover letter",
      details: error.message,
    });
  }
});

// ─── Template CRUD (all require auth) ─────────────────────────

/**
 * POST /api/v1/cover-letter/templates — Create template
 */
router.post("/templates", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { name, content, tone, targetRole } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: "name and content are required" });
    }

    const template = await createTemplate(userId, {
      name,
      content,
      tone,
      targetRole,
    });

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cover-letter/templates — List templates
 */
router.get("/templates", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const templates = await listTemplates(userId);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/cover-letter/templates/:id — Get single template
 */
router.get("/templates/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const template = await getTemplate(req.params.id, userId);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ template });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/cover-letter/templates/:id — Update template
 */
router.put("/templates/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { name, content, tone, targetRole } = req.body;

    const template = await updateTemplate(req.params.id, userId, {
      name,
      content,
      tone,
      targetRole,
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ template });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/cover-letter/templates/:id — Delete template
 */
router.delete("/templates/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const deleted = await deleteTemplate(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ message: "Template deleted" });
  } catch (err) {
    next(err);
  }
});

// ─── Auto-Tailor ───────────────────────────────────────────────

/**
 * POST /api/v1/cover-letter/tailor — Auto-tailor template to job
 */
router.post("/tailor", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const { templateId, jobTitle, companyName, jobDescription, resumeText } =
      req.body;

    if (!templateId || !jobDescription) {
      return res.status(400).json({
        error: "templateId and jobDescription are required",
      });
    }

    const result = await autoTailor({
      templateId,
      jobTitle: jobTitle || "Unknown Role",
      companyName: companyName || "Company",
      jobDescription,
      resumeText,
    });

    // Save all generated variants
    const savedVariants = await Promise.all(
      result.variants.map((v) =>
        saveVariant(userId, {
          templateId,
          variantName: v.variantName,
          content: v.content,
          tone: v.tone,
          jobTitle,
          companyName,
        }),
      ),
    );

    res.json({
      variants: savedVariants,
      highlights: result.highlights,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Variants ──────────────────────────────────────────────────

/**
 * GET /api/v1/cover-letter/variants — List variants
 */
router.get("/variants", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const templateId = req.query.templateId as string | undefined;
    const variants = await listVariants(userId, templateId);
    res.json({ variants });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cover-letter/variants/:id/status — Track outcome
 */
router.post(
  "/variants/:id/status",
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = (req as any).userId;
      const { status } = req.body;

      if (!["sent", "rejected", "interview"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be: sent, rejected, interview" });
      }

      const updated = await updateVariantStatus(
        req.params.id,
        userId,
        status,
      );

      if (!updated) {
        return res.status(404).json({ error: "Variant not found" });
      }

      res.json({ message: "Status updated" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { llm } from "../../../ai/model.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
  extractSkills,
  generateCoverLetter,
} from "../../../services/transformerModels.js";

const router = Router();

router.post("/optimize", requireAuth, async (req, res) => {
  try {
    const { resumeText, targetRole, industry } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "Resume text is required" });
    }

    const extractedSkills = await extractSkills(resumeText);

    const response = await llm
      .withStructuredOutput(
        require("zod").z.object({
          headline: require("zod")
            .z.string()
            .describe("Optimized LinkedIn headline (max 220 chars)"),
          about: require("zod")
            .z.string()
            .describe("Optimized About/Summary section (max 2600 chars)"),
          experienceBullets: require("zod")
            .z.array(
              require("zod").z.object({
                role: require("zod").z.string(),
                bullets: require("zod").z.array(require("zod").z.string()),
              }),
            )
            .describe("Optimized experience bullet points using XYZ formula"),
          skills: require("zod")
            .z.array(require("zod").z.string())
            .describe("Top 10 skills to highlight"),
          recommendations: require("zod")
            .z.array(require("zod").z.string())
            .describe("General LinkedIn optimization tips"),
        }),
      )
      .invoke([
        new SystemMessage(`
        You are a LinkedIn Profile Optimization Expert.
        
        TASK:
        1. Create a compelling headline that includes key skills and target role
        2. Write an engaging About section that tells a professional story
        3. Optimize experience bullets using the XYZ formula (Accomplished X as measured by Y, by doing Z)
        4. Identify top skills to feature
        5. Provide actionable optimization recommendations
        
        CANDIDATE RESUME:
        ${resumeText.substring(0, 5000)}
        
        EXTRACTED SKILLS:
        ${extractedSkills.join(", ")}
        
        ${targetRole ? `TARGET ROLE: ${targetRole}` : ""}
        ${industry ? `INDUSTRY: ${industry}` : ""}
        
        Focus on making the profile stand out to recruiters and hiring managers.
      `),
        new HumanMessage("Generate optimized LinkedIn profile content."),
      ]);

    res.json({
      optimized: response,
      extractedSkills,
    });
  } catch (err) {
    console.error("LinkedIn optimization error:", err);
    res.status(500).json({ error: "Failed to optimize LinkedIn profile" });
  }
});

export default router;

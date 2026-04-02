import { Router } from "express";
import { generateCoverLetter } from "../../services/transformerModels.js";

const router = Router();

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

export default router;

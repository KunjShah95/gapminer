import express from "express";
import { requireAuth } from "../../../core/security.js";
import { llm } from "../../../ai/model.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import multer from "multer";
import { config } from "../../../core/config.js";
import {
  generateInterviewQuestions,
  classifyJobDescription,
  classifySeniorityLevel,
} from "../../../services/transformerModels.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/v1/interview/next-question
 * Generates the next question based on the interview transcript.
 */
router.post("/next-question", requireAuth, async (req, res) => {
  try {
    const { transcript, resumeData, jdData } = req.body;

    const jdText =
      jdData?.description || jdData?.raw_text || JSON.stringify(jdData || {});

    const [jdCategories, seniority] = await Promise.all([
      classifyJobDescription(jdText).catch(() => []),
      classifySeniorityLevel(jdText).catch(() => ({
        level: "mid-level",
        confidence: 0.5,
      })),
    ]);

    const candidateSkills =
      resumeData?.skills?.map((s: any) => s.name || s) || [];
    const jdSkills = jdData?.requiredSkills?.map((s: any) => s.name) || [];
    const allSkills = [...new Set([...candidateSkills, ...jdSkills])];

    const transformerQuestions = await generateInterviewQuestions(
      allSkills.length > 0 ? allSkills : ["software engineering"],
      seniority.level === "senior" || seniority.level === "staff"
        ? "hard"
        : "medium",
    );

    const response = await llm.invoke([
      new SystemMessage(`
        You are an Expert Technical Interviewer.
        
        CONTEXT:
        JD: ${JSON.stringify(jdData || {})}
        Candidate Resume: ${JSON.stringify(resumeData || {})}
        
        TRANSFORMER-BASED JD ANALYSIS:
        Categories: ${jdCategories.map((c: any) => `${c.category} (${(c.confidence * 100).toFixed(0)}%)`).join(", ")}
        Seniority: ${seniority.level} (${(seniority.confidence * 100).toFixed(0)}%)
        
        PRE-GENERATED QUESTIONS (for reference):
        ${transformerQuestions.map((q: any) => `- ${q.question}`).join("\n")}
        
        TRANSCRIPT SO FAR:
        ${(transcript || []).join("\n")}
        
        TASK:
        Based on the candidate's last response and the JD requirements, ask a follow-up technical question or pivot to a new relevant topic.
        Keep the conversation professional, challenging, and focused on technical depth.
        Respond ONLY with the question or response to the candidate.
      `),
      new HumanMessage("Generate the next interviewer response."),
    ]);

    res.json({
      question: response.content,
      metadata: {
        jdCategories,
        seniority,
        suggestedQuestions: transformerQuestions,
      },
    });
  } catch (err: any) {
    console.error("Interview Question Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/interview/transcribe
 * Transcribes audio using OpenAI Whisper API.
 */
router.post(
  "/transcribe",
  requireAuth,
  upload.single("audio"),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided." });
      }

      if (!config.OPENAI_API_KEY) {
        // Fallback for demo if no API key
        return res.json({
          text: "This is a simulated transcription. (OPENAI_API_KEY not configured)",
          warning: "Configure OPENAI_API_KEY for real Whisper transcription.",
        });
      }

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-1");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Whisper transcription failed");
      }

      const data = await response.json();
      res.json({ text: data.text });
    } catch (err: any) {
      console.error("Transcription Error:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;

import { Router } from "express";
import { requireAuth } from "../../../core/security.js";
import { llm } from "../../../ai/model.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const router = Router();

const sessions = new Map();

router.post("/start", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { offer, company, role, marketData, goals } = req.body;

    const sessionId = `${userId}-${Date.now()}`;
    sessions.set(sessionId, {
      userId,
      offer,
      company,
      role,
      marketData,
      goals,
      history: [],
      turn: 0,
      startedAt: new Date(),
    });

    const recruiterResponse = await llm.invoke([
      new SystemMessage(`
        You are a tough but fair HR recruiter negotiating a compensation package.
        
        CONTEXT:
        Company: ${company || "TechCorp"}
        Role: ${role || "Software Engineer"}
        Offer: ${JSON.stringify(offer || {})}
        Market Data: ${JSON.stringify(marketData || {})}
        
        Start the negotiation by presenting the initial offer and asking the candidate for their thoughts.
        Be professional but firm. Push back on unreasonable requests.
        You have a budget range and can only go so far.
      `),
      new HumanMessage("Start the negotiation. Present the initial offer."),
    ]);

    res.json({ sessionId, recruiterMessage: recruiterResponse.content });
  } catch (err) {
    console.error("Start negotiation error:", err);
    res.status(500).json({ error: "Failed to start negotiation" });
  }
});

router.post("/respond", requireAuth, async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.history.push({ role: "candidate", message });
    session.turn++;

    const historyText = session.history
      .map((h) => `${h.role}: ${h.message}`)
      .join("\n");

    const recruiterResponse = await llm.invoke([
      new SystemMessage(`
        You are an HR recruiter in a salary negotiation role-play.
        
        OFFER DETAILS:
        Company: ${session.company}
        Role: ${session.role}
        Budget: ${JSON.stringify(session.offer || {})}
        
        CANDIDATE GOALS: ${JSON.stringify(session.goals || {})}
        
        CONVERSATION HISTORY:
        ${historyText}
        
        Respond as the recruiter. Be realistic - you can adjust the offer within reason but have limits.
        After ${session.turn >= 5 ? "several rounds" : "a few more rounds"}, you'll need to finalize.
      `),
      new HumanMessage(message),
    ]);

    session.history.push({
      role: "recruiter",
      message: recruiterResponse.content,
    });

    const isFinalized =
      session.turn >= 8 ||
      recruiterResponse.content.toLowerCase().includes("final offer");

    res.json({
      recruiterMessage: recruiterResponse.content,
      turn: session.turn,
      isFinalized,
    });
  } catch (err) {
    console.error("Negotiation respond error:", err);
    res.status(500).json({ error: "Failed to process response" });
  }
});

router.get("/score/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const historyText = session.history
      .map((h) => `${h.role}: ${h.message}`)
      .join("\n");

    const scorecard = await llm.invoke([
      new SystemMessage(`
        You are evaluating a salary negotiation role-play performance.
        
        Score on these criteria (1-10):
        1. Preparation - Did they research market rates?
        2. Communication - Clear, professional, confident?
        3. Strategy - Used effective negotiation tactics?
        4. Outcome - Achieved a reasonable result?
        
        CONVERSATION:
        ${historyText}
        
        Respond with ONLY a JSON object: {"preparation": N, "communication": N, "strategy": N, "outcome": N, "overall": N, "feedback": "text", "tips": ["tip1", "tip2"]}
      `),
      new HumanMessage("Evaluate the negotiation performance."),
    ]);

    res.json({
      scorecard: scorecard.content,
      sessionDuration: Date.now() - session.startedAt.getTime(),
      totalTurns: session.turn,
    });
  } catch (err) {
    console.error("Score negotiation error:", err);
    res.status(500).json({ error: "Failed to score negotiation" });
  }
});

export default router;

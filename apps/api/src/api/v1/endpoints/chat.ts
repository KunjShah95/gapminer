import { Router } from "express";
import { llm } from "../../../ai/model.js";

const router = Router();

router.post("/", async (req, res) => {
  const { messages } = req.body;

  try {
    const formattedMessages = messages.map(
      (msg: { role: string; content: string }) => [
        msg.role === "user" ? "user" : "assistant",
        msg.content,
      ],
    );

    const result = await llm.invoke(formattedMessages);

    return res.json({ text: result.content });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;

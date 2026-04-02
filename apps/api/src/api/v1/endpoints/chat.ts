import { Router } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const router = Router();

router.post("/", async (req, res) => {
  const { messages } = req.body;

  try {
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    const formattedMessages = messages.map(
      (msg: { role: string; content: string }) => [
        msg.role === "user" ? "user" : "assistant",
        msg.content,
      ],
    );

    const result = await model.invoke(formattedMessages);

    return res.json({ text: result.content });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;

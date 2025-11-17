import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";

dotenv.config();
console.log("Loaded KEY:", process.env.OPENAI_API_KEY);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -------------------------
// Initialize OpenAI Client
// -------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------
// POST /process_text
// -------------------------
app.post("/process_text", async (req, res) => {
  try {
    const text = req.body.text || "";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
          Analyze this text. Return JSON only:
          {
            "sentiment": "...",
            "score": 0-100,
            "keywords": ["...", "..."]
          }

          Text: """${text}"""
        `,
        },
      ],
    });

    // Parse JSON from model
    const raw = completion.choices[0].message.content;
    const json = JSON.parse(raw);

    res.json(json);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// -------------------------
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

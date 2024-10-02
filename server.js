// Node.js Example
require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

app.post("/chat", async (req, res) => {
    const { userInput } = req.body;
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: userInput }],
        });
        res.json({ botResponse: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));

import "dotenv/config";
import express from "express"; //const OpenAI = require("openai");
import OpenAI from "openai";

const app = express();
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

app.post("/chat", async (req, res) => {
    const { userInput } = req.body;
    try {
        const { data: chatCompletion, response: raw } =
            await client.chat.completions
                .create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: userInput }],
                })
                .withResponse();
        console.log(raw);
        res.json({
            botResponse: chatCompletion.choices[0].message.content,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));

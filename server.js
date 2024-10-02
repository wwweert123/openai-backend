import "dotenv/config";
import express from "express"; //const OpenAI = require("openai");
import OpenAI from "openai";
import { rootRouter } from "./routes/root.js";
import { assistantRouter } from "./routes/api/assistant.js";
const PORT = process.env.PORT || 3000;

const app = express();
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

app.use("/", rootRouter);

app.use("/assistant", assistantRouter);

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

app.all("*", (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
        res.json({ error: "404 Not Found" });
    } else {
        res.type("txt").send("404 Not Found");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

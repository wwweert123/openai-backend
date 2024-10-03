import "dotenv/config";
import { client } from "../helpers/api/Openai.js";
import { eventHandler } from "../helpers/EventEmitter.js";

const createNewThreadId = async () => {
    const thread = await client.beta.threads.create();
    return thread.id;
};

export const postUserInput = async (req, res) => {
    console.log("Post User Input called");
    const { userInput, currentThreadId } = req.body;
    try {
        const threadId = currentThreadId || (await createNewThreadId());

        const message = await client.beta.threads.messages.create(threadId, {
            role: "user",
            content: userInput,
        });

        // Reset the accumulated message in the event handler before streaming
        eventHandler.resetMessage();

        const stream = await client.beta.threads.runs.stream(
            threadId,
            { assistant_id: process.env.ASSISTANT_ID },
            eventHandler
        );

        for await (const event of stream) {
            eventHandler.emit("event", event);
        }

        // Once the stream is complete, send the full message to the frontend
        const fullMessage = eventHandler.getFullMessage();
        res.json({
            threadId,
            reply:
                fullMessage === ""
                    ? "No message received at backend"
                    : fullMessage,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

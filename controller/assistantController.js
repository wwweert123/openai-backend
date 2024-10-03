import "dotenv/config";
import { assistantService } from "../helpers/AssistantService.js";

const createNewThreadId = async () => {
    const thread = await assistantService.client.beta.threads.create();
    return thread.id;
};

export const postUserInput = async (req, res) => {
    try {
        // await assistantService.client.beta.threads.runs.cancel(
        //     "thread_spTObfwfWggnETipjR7qA19D",
        //     "run_ItKHtZZtncswGP4PMFGTJlJ0"
        // );
        const { userInput, currentThreadId } = req.body;
        const threadId = currentThreadId || (await createNewThreadId());

        // Reset the accumulated message before starting the stream
        assistantService.resetMessage();

        // Create a new user message in the thread
        await assistantService.client.beta.threads.messages.create(threadId, {
            role: "user",
            content: userInput,
        });

        // Start streaming the assistant's response
        const stream = await assistantService.client.beta.threads.runs.stream(
            threadId,
            {
                assistant_id: process.env.ASSISTANT_ID,
            }
        );

        // Process the stream and accumulate messages
        await assistantService.processStream(stream);

        // Send the accumulated response to the frontend
        res.json({
            threadId,
            reply: assistantService.getFullMessage(),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

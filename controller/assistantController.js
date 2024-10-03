import "dotenv/config";

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
        const run = await client.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
            // instructions: "Please address the user as Mervin Praison.",
        });
        if (run.status === "completed") {
            const messages = await client.beta.threads.messages.list(
                run.thread_id
            );
            console.log(messages);
            res.json({
                threadId: threadId,
                reply: messages.data[0].content[0].text.value,
            });
        } else {
            res.json({
                threadId: threadId,
                runStatus: run.status,
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

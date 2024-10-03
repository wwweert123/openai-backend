import "dotenv/config";
import EventEmitter from "node:events";

class EventHandler extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
    }

    async onEvent(event) {
        try {
            console.log(event);
            // Retrieve events that are denoted with 'requires_action'
            // since these will have our tool_calls
            if (event.event === "thread.run.requires_action") {
                await this.handleRequiresAction(
                    event.data,
                    event.data.id,
                    event.data.thread_id
                );
            }
        } catch (error) {
            console.error("Error handling event:", error);
        }
    }
    async handleRequiresAction(data, runId, threadId) {
        try {
            const toolOutputs =
                data.required_action.submit_tool_outputs.tool_calls.map(
                    (toolCall) => {
                        if (
                            toolCall.function.name === "getCurrentTemperature"
                        ) {
                            return {
                                tool_call_id: toolCall.id,
                                output: "57",
                            };
                        } else if (
                            toolCall.function.name === "getRainProbability"
                        ) {
                            return {
                                tool_call_id: toolCall.id,
                                output: "0.06",
                            };
                        }
                    }
                );
            // Submit all the tool outputs at the same time
            await this.submitToolOutputs(toolOutputs, runId, threadId);
        } catch (error) {
            console.error("Error processing required action:", error);
        }
    }

    async submitToolOutputs(toolOutputs, runId, threadId) {
        try {
            // Use the submitToolOutputsStream helper
            const stream =
                this.client.beta.threads.runs.submitToolOutputsStream(
                    threadId,
                    runId,
                    { tool_outputs: toolOutputs }
                );
            for await (const event of stream) {
                this.emit("event", event);
            }
        } catch (error) {
            console.error("Error submitting tool outputs:", error);
        }
    }
}

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

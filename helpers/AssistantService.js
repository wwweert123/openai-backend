import { client } from "./api/Openai.js";

class AssistantService {
    constructor(client) {
        this.client = client;
        this.message = ""; // To accumulate assistant's response
    }

    // Handle events and accumulate the response message
    async processStream(stream) {
        for await (const event of stream) {
            // Accumulate messages from the assistant
            if (event.event === "thread.message.delta") {
                this.message += event.data.delta.content[0].text.value;
            }

            // Handle requires_action event, submit tool outputs, and continue
            if (event.event === "thread.run.requires_action") {
                await this.handleRequiresAction(
                    event.data,
                    event.data.id,
                    event.data.thread_id
                );
            }
        }
    }

    // Handle tool call actions like fetching external data (e.g., cat images)
    async handleRequiresAction(data, runId, threadId) {
        const toolOutputs =
            data.required_action.submit_tool_outputs.tool_calls.map(
                (toolCall) => {
                    if (toolCall.function.name === "fetch_cat_images") {
                        return {
                            tool_call_id: toolCall.id,
                            output: "id:a5d,url:https://cdn2.thecatapi.com/images/a5d.jpg,width:560,height:395",
                        };
                    }
                }
            );

        // Submit tool outputs and process follow-up events
        const stream =
            await this.client.beta.threads.runs.submitToolOutputsStream(
                threadId,
                runId,
                {
                    tool_outputs: toolOutputs,
                }
            );
        await this.processStream(stream); // Continue processing the stream after action
    }

    // Reset the message accumulator before starting a new stream
    resetMessage() {
        this.message = "";
    }

    // Return the full message after processing
    getFullMessage() {
        return this.message;
    }
}

export const assistantService = new AssistantService(client);

import EventEmitter from "node:events";
import { client } from "./api/Openai.js";

class EventHandler extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.message = ""; // This will accumulate the assistant's response
    }

    async onEvent(event) {
        try {
            // Check if the event is a delta (part of the assistant's message)
            if (event.event === "thread.message.delta") {
                const deltaContent = event.data.delta.content[0].text.value;
                this.message += deltaContent; // Accumulate the content
            }
            if (event.event === "thread.run.requires_action") {
                console.log(event.data);
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
                        if (toolCall.function.name === "fetch_cat_images") {
                            return {
                                tool_call_id: toolCall.id,
                                output: "id:a5d,url:https://cdn2.thecatapi.com/images/a5d.jpg,width:560,height:395}",
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

    // Method to reset the message accumulator when needed
    resetMessage() {
        this.message = "";
    }

    // Method to get the full message once streaming is done
    getFullMessage() {
        return this.message;
    }
}

export const eventHandler = new EventHandler(client);
eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

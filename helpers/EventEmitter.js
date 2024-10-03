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
            // if (event.event === "thread.run.requires_action") {
            //     await this.handleRequiresAction(
            //         event.data,
            //         event.data.id,
            //         event.data.thread_id
            //     );
            // }
        } catch (error) {
            console.error("Error handling event:", error);
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

import { client } from "./api/Openai.js";
import { theCatAPI } from "./api/CatAPI.js";
import { Breed } from "@thatapicompany/thecatapi";

// Function to check if a breed exists in the Breed enum (case-insensitive)
function getValidBreed(breed) {
    const lowerCaseBreed = breed.toLowerCase();

    // Check if breed matches any enum keys (names) or values (ids) case-insensitively
    for (const key of Object.keys(Breed)) {
        if (key.toLowerCase() === lowerCaseBreed) {
            // If it matches the enum key, return the corresponding value
            return Breed[key];
        }
        if (Breed[key].toLowerCase() === lowerCaseBreed) {
            // If it matches the enum value, return the value itself
            return Breed[key];
        }
    }
    console.warn(`Breed "${breed}" is not valid. Proceeding without breed.`);
    return null; // Return null if no match found
}

async function getCatImages(arg) {
    // Parse the string into an object
    let parsedArg;

    try {
        parsedArg = JSON.parse(arg); // Convert the string to a JavaScript object
    } catch (error) {
        return "JSON cannot be parsed at function call: " + error;
    }

    const breed = getValidBreed(parsedArg.breed) || "";

    // Now you can access the properties of the parsed object
    const images = await theCatAPI.images.searchImages({
        limit: parsedArg.number_of_images || 1, // Access number_of_images
        breeds: [breed],
    });

    console.log("Parsed Argument:", parsedArg);
    console.log("Images fetched:", images);

    return JSON.stringify(images);
}

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
        const toolOutputs = await Promise.all(
            data.required_action.submit_tool_outputs.tool_calls.map(
                async (toolCall) => {
                    if (toolCall.function.name === "fetch_cat_images") {
                        console.log(toolCall.function.arguments);
                        return {
                            tool_call_id: toolCall.id,
                            output: await getCatImages(
                                toolCall.function.arguments || {}
                            ),
                        };
                    }
                }
            )
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

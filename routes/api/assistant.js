import express from "express";
import { postUserInput } from "../../controller/assistantController.js";
export const assistantRouter = express.Router();

// POST /assistant
assistantRouter.post("/", postUserInput);

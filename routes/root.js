import express from "express";
import path from "path";
import { fileURLToPath } from "url";
export const rootRouter = express.Router();

rootRouter.get("^/$|index(.html)?", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

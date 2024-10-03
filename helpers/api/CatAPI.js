import { TheCatAPI } from "@thatapicompany/thecatapi";
import "dotenv/config";

export const theCatAPI = new TheCatAPI(process.env.CATAPI);

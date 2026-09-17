import "dotenv/config"
import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
    apiKey: process.env.API_KEY,
    baseURL: process.env.BASE_URL
})
import "dotenv/config"
import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
    apiKey: process.env.GATEWAY_API_KEY,
    baseURL: process.env.GATEWAY_BASE_URL
})
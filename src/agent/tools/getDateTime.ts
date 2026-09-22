import { tool } from "ai";
import {z} from "zod";

export const getCurrentDateTimeTool = tool({
    description: "This tool returns the current data and time. Use this tool before any time and date related task or query. ",
    inputSchema: z.object({}),
    execute: async () => {
        return `The current and date and time in ISO format is ${Date.now().toString()}`
    }
})
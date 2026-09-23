import "dotenv/config"
import {generateText} from "ai";
import type { ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { tools } from "./tools";
import executeTool from "./executeTool";
import { SYSTEM_PROMPT } from "./system/prompt";
import type { AgentCallbacks, ToolName } from "../types";
import {Laminar, getTracer} from "@lmnr-ai/lmnr"

type RunAgentParams = {
    message: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
}

Laminar.initialize({
    projectApiKey: process.env.LMNR_API_KEY,
})

export const runAgent = async ({message, conversationHistory = [], callbacks}: RunAgentParams) => {
    const {text, toolCalls} = await generateText({
        model: anthropic("claude-sonnet-4-5"),
        system: SYSTEM_PROMPT,
        prompt: message,
        tools,
        experimental_telemetry: {
            isEnabled: true,
            tracer: getTracer()
        }
    })

    if(toolCalls) {
        for(const tc of toolCalls) {
            const toolName = tc.toolName as ToolName;
            const toolResult = await executeTool({toolName})
            console.log("tool result - ", toolResult)
        }
    }

    console.log(text);

    Laminar.flush();
}

runAgent({message: "Hey! My birthday is on 24th Decemeber. How many days are left for my birthday?"})
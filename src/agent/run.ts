import {generateText} from "ai";
import type { ModelMessage } from "ai";
import type { AgentCallbacks, ToolName } from "../types";
import { openai } from "./client";
import { SYSTEM_PROMPT } from "./system/prompt";
import { tools } from "./tools";
import executeTool from "./executeTool";

type RunAgentParams = {
    message: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
}

export const runAgent = async ({message, conversationHistory = [], callbacks}: RunAgentParams) => {
    const {text, toolCalls} = await generateText({
        model: openai("gpt-5-mini"),
        system: SYSTEM_PROMPT,
        prompt: message,
        tools
    })

    if(toolCalls) {
        for(const tc of toolCalls) {
            const toolName = tc.toolName as ToolName;
            const toolResult = await executeTool({toolName})
            console.log("tool result - ", toolResult)
        }
    }

    console.log(text);
}

runAgent({message: "Hey! What is the current time?"})
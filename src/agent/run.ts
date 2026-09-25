import "dotenv/config"
import {generateText} from "ai";
import type { ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { tools } from "./tools/index.js";
import executeTool from "./executeTool.js";
import { SYSTEM_PROMPT } from "./system/prompt.js";
import type { AgentCallbacks, ToolName } from "../types.js";
import {Laminar, getTracer} from "@lmnr-ai/lmnr"

Laminar.initialize()

export const runAgent = async (message: string, conversationHistory: ModelMessage[] = [], callbacks?: AgentCallbacks): Promise<ModelMessage[]> => {
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

    callbacks?.onComplete(text);

   await Laminar.flush();

   return [
       ...conversationHistory,
       { role: "user", content: message },
       { role: "assistant", content: text },
   ];
}

runAgent("Hey! My birthday is on 24th Decemeber. How many days are left for my birthday?")

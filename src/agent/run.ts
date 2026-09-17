import {generateText} from "ai";
import type { ModelMessage } from "ai";
import type { AgentCallbacks } from "../types";
import { openai } from "./client";
import { SYSTEM_PROMPT } from "./system/prompt";

type RunAgentParams = {
    message: string,
    conversationHistory?: ModelMessage[],
    callbacks?: AgentCallbacks
}

export const runAgent = async ({message, conversationHistory, callbacks}: RunAgentParams) => {
    const {text} = await generateText({
        model: openai("gpt-5-mini"),
        system: SYSTEM_PROMPT,
        prompt: message
    })

    console.log(text);
}

runAgent({message: "Hey! How are you doing today?"})
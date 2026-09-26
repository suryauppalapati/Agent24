import "dotenv/config"
import { streamText } from "ai";
import type { ModelMessage, SystemModelMessage } from "ai";
import { tools } from "./tools/index.js";
import { SYSTEM_PROMPT } from "./system/prompt.js";
import type { AgentCallbacks, ToolCallInfo } from "../types.js";
import {Laminar, getTracer} from "@lmnr-ai/lmnr"
import { filterCompatibleMessages } from "./system/filterMessages.js";
import { log } from "node:console";
import openai from "./client.js"

Laminar.initialize()

export const runAgent = async (message: string, conversationHistory: ModelMessage[] = [], callbacks?: AgentCallbacks): Promise<ModelMessage[]> => {
  const previousMessages = filterCompatibleMessages(conversationHistory);
  // const previousMessages = convertToModelMessages(conversationHistory);
  const systemMessage: SystemModelMessage = { role: "system", content: SYSTEM_PROMPT };
  const modelMessages: ModelMessage[] = [systemMessage, ...previousMessages, { role: "user", content: message }];

  let fullResponse = "";

  while (true) {
    const result = streamText({
      model: openai("gpt-5-mini"),
      messages: modelMessages,
      tools,
      allowSystemInMessages: true,
      experimental_telemetry: {
        isEnabled: true,
        tracer: getTracer(),
      }
    })

    let currentText = "";
    const toolCalls: ToolCallInfo[] = [];

    try {
      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
          currentText += chunk.text;
          callbacks?.onToken(chunk.text);
        }

        if (chunk.type === "tool-call") {
          const toolInput = "input" in chunk ? chunk.input as Record<string, unknown> : {}
          toolCalls.push({
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: toolInput
          })
          callbacks?.onToolCallStart(chunk.toolName, toolInput);
        }

        if (chunk.type === "tool-result") {
          callbacks?.onToolCallEnd(chunk.toolName, String(chunk.output));
        }
      }
    } catch (error: unknown) {
      console.error(error);
      const streamError = error instanceof Error ? error : new Error("Unknown error occurred during streaming.");

      if (!currentText) {
        fullResponse = "Something went wrong while generating the response. Please try again.";
        callbacks?.onToken(fullResponse);
      };

      throw streamError;
    }

    fullResponse += currentText;
    const finishReason = await result.finishReason;

    if (finishReason !== "tool-calls" && toolCalls.length === 0) {
      const response = await result.response;
      modelMessages.push(...response.messages);
      break;
    }

    const responseMessages = await result.response;
    modelMessages.push(...responseMessages.messages);

  }

  callbacks?.onComplete(fullResponse);

  return modelMessages;
}

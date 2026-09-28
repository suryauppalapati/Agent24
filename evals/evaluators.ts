import { generateObject } from "ai";
import openai from "../src/agent/client.ts";
import { z } from "zod";

import type {
  EvalTarget,
  SingleTurnResult,
  MultiTurnTarget,
  MultiTurnResult,
} from "./types.ts";
import { LLM_JUDGE_PROMPT } from "../src/agent/system/prompt.ts";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";

/**
 * Evaluator(multi-turn): Uses LLM to judge the quality of the conversation.
 * Returns a score from 1 to 10 and a brief explanation of the rationale behind the score.
*/

const judgeSchema = z.object({
  score: z.number().min(1).max(10).describe("Score from 1 to 10, where 1 is the worst and 10 is the best."),
  reason: z.string().describe("Brief explanation of the rationale behind the score."),
})

export async function llmJudge(output: MultiTurnResult, target: MultiTurnTarget) {
  const response = await generateObject({
    model: openai("gpt-6-sol"),
    providerOptions: {
      openai: {
       reasoningEffort: "high"
      }
    },
    schema: judgeSchema,
    messages: [
      {
        role: "system",
        content: LLM_JUDGE_PROMPT
      },
      {
        role: "user",
        content: `
        Task: ${target.originalTask}

        Tools called: ${JSON.stringify(output.toolsUsed)}
        Tool results provided: ${JSON.stringify(target.mockToolResults)}

        Agent's final response: ${output.text}

        Evaluate the agent's performance in the conversation above and provide a score from 1 to 10, along with a brief explanation of the rationale behind the score.ß
        `
      }
    ],
    schemaDescription: "Score: <1-10>\nReasoning: <brief explanation>",
    schemaName: "EvaluationResult",
  })

  return response.object;
}

/**
 * Evaluator(single-turn): Precision/recall score for tool selection.
 * Returns a score between 0 and 1 based on correct selections.
 * For secondary prompts.
 */
export function toolSelectionScore(
  output: SingleTurnResult,
  target: EvalTarget,
): number {
  if (!target.expectedTools?.length) {
    return output.selectedAny ? 0.5 : 1;
  }

  const expected = new Set(target.expectedTools);
  const selected = new Set(output.toolNames);

  const hits = output.toolNames.filter((t) => expected.has(t)).length;
  const precision = selected.size > 0 ? hits / selected.size : 0;
  const recall = expected.size > 0 ? hits / expected.size : 0;

  // Simple F1-ish score
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

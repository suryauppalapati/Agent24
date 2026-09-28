import { evaluate, Laminar, observe } from "@lmnr-ai/lmnr";
import { llmJudge } from "./evaluators";

import type { MultiTurnEvalData, MultiTurnTarget, MultiTurnResult } from "./types";
import dataset from "./data/agent-multiturn.json";
import { mockMultiTurnExecutor } from "./executors";

const executor = async (evalData: MultiTurnEvalData) => {
  return mockMultiTurnExecutor(evalData);
}

evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    evaluationScore: async (output: any, target: any) => {
      if (!target) return 1;
      const result = await observe(
        { name: "llm-judge", spanType: "EVALUATOR" },
        async () => {
          const judgeResult = await llmJudge(output, target);
          Laminar.setSpanOutput({
            evaluationScore: judgeResult.score,
            evaluationReason: judgeResult.reason,
          });
          return judgeResult;
        },
      );
      return result.score;
    },
  },
  name: "Agent Multi-turn Evals v1 (gpt-6-sol)",
  groupName: "agent-multiturn-evaluation"
})

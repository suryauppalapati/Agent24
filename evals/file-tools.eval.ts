import { evaluate } from "@lmnr-ai/lmnr";
import { toolSelectionScore } from "./evaluators";

import type { EvalData, EvalTarget, SingleTurnResult } from "./types";
import dataset from "./data/file-tools.json";
import { mockSingleTurnExecutor } from "./executors";

const executor = async (evalData: EvalData): Promise<SingleTurnResult> => {
  return await mockSingleTurnExecutor(evalData);
};

evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    selectionScore: (output: any, target: any) => {
      if (target?.category === "secondary") return 1;

      return toolSelectionScore(output, target);
    }
  },
  name: "File Tool Evals v5 (claude-haiku-4-5)",
  groupName: "file-tools-evaluation"
})

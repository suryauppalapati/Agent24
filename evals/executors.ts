import {generateText, getToolName, stepCountIs, tool, type ModelMessage, type Tool, type ToolSet, type TypedToolCall} from 'ai'
import { anthropic } from '@ai-sdk/anthropic';
import {z} from 'zod'

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { SYSTEM_PROMPT } from '../src/agent/system/prompt.ts';
import { buildMessages, buildMockedTools } from './utils.ts';
import openai  from '../src/agent/client.ts';
import { describe } from 'zod/mini';

const TOOL_DEFINITIONS : Record<string, Tool> = {
  readFile: {
    description: 'Reads the file from the given path. Use this tool to read the content of a file.',
    inputSchema: z.object({
      path: z.string().describe('Path to the file to read.')
    }),
  },
  writeFile: {
    description: 'Writes the file to the given path. Use this tool to write the content of a file.',
    inputSchema: z.object({
      path: z.string().describe('Path to the file to write.'),
      content: z.string().describe('Content to write to the file.')
    })
  },
  deleteFile: {
    description: 'Deletes the file from the given path. Use this tool to delete a file.',
    inputSchema: z.object({
      path: z.string().describe('Path to the file to delete.')
    })
  },
  listFiles: {
    description: 'Lists the files in the given directory. Use this tool to list the files.',
    inputSchema: z.object({
      path: z.string().describe('Path to the directory to list.')
    })
  },
  runCommand: {
    description: 'Runs a command in the terminal. Use this tool to run a command.',
    inputSchema: z.object({
      command: z.string().describe('Command to run.')
    })
  }
}

export const mockSingleTurnExecutor = async (evalData: EvalData): Promise<SingleTurnResult> => {
  const { tools, systemPrompt, config } = evalData;
  const messages = buildMessages(evalData)

  const activeTools = tools.reduce<ToolSet>((acc, toolName) => {
    const t = TOOL_DEFINITIONS[toolName];
    if (t !== undefined) {
      acc[toolName] = tool({
        description: t.description,
        inputSchema: t.inputSchema,
      });
    }
    return acc;
  }, {});

  const {toolCalls, text} = await generateText({
    model: openai(config?.model ?? 'gpt-5-mini'),
    messages,
    allowSystemInMessages: true,
    tools: activeTools,
    system: systemPrompt ?? SYSTEM_PROMPT,
    ...config?.temperature && {temperature: config.temperature}
  })

  const modelSelectedTools = toolCalls.map(tc => ({ toolName: tc.toolName, args: tc.input }))
  const modelSelectedToolNames = modelSelectedTools?.map(tc => tc.toolName);

  return{
    toolCalls: modelSelectedTools,
    toolNames: modelSelectedToolNames ?? [],
    selectedAny: !!modelSelectedToolNames?.length,
  }
}


export const mockMultiTurnExecutor = async (evalData: MultiTurnEvalData): Promise<MultiTurnResult> => {
  const { mockTools, config, messages, prompt } = evalData;

  const tools = buildMockedTools(mockTools);
  const modelMessages: ModelMessage[] = messages ?? [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt! }
  ]

  const {text, steps} = await generateText({
    model: openai(config?.model ?? 'gpt-5-mini'),
    messages: modelMessages,
    tools,
    allowSystemInMessages: true,
    stopWhen: stepCountIs(config?.maxSteps ?? 10),
  })

  const normalizedSteps: MultiTurnResult["steps"] = steps.map((step) => ({
    toolCalls: step.toolCalls.map((tc) => ({
      toolName: tc.toolName,
      args: tc.input,
    })),
    toolResults: step.toolResults.map((tr) => ({
      toolName: tr.toolName,
      result: tr.output,
    })),
    text: step.text,
  }));

  const toolsCalledInOrder = normalizedSteps.flatMap(step => step.toolCalls?.map(tc => tc.toolName)).filter(t => t !== undefined);

  return {
    text,
    toolsUsed: toolsCalledInOrder ?? [],
    toolCallOrder: toolsCalledInOrder ?? [],
    steps: normalizedSteps,
  }
}

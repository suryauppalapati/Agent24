import {generateText, tool, type Tool, type ToolSet} from 'ai'
import { anthropic } from '@ai-sdk/anthropic';
import {z} from 'zod'

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { SYSTEM_PROMPT } from '../src/agent/system/prompt.ts';
import { buildMessages } from './utils.ts';

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
    model: anthropic(config?.model ?? 'claude-haiku-4-5'),
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

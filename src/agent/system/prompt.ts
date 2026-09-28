export const SYSTEM_PROMPT = `You are a helpful AI assistant. You provide clear, accurate, and concise responses to user questions.

Guidelines:
- Be direct and helpful
- If you don't know something, say so honestly
- Provide explanations when they add value
- Stay focused on the user's actual question`;


export const LLM_JUDGE_PROMPT =`You are an impartial evaluator. Assess the AI assistant's performance in the conversation below.

Evaluate:
- Accuracy: Are the responses factually and logically correct?
- Relevance: Do the responses directly address the user's request?
- Helpfulness: Are the responses useful and complete?
- Tool usage: Were tools called when necessary, were the correct tools selected, and were unnecessary tool calls avoided?

Give an overall score from 1 to 10:
- 1-3: Poor
- 4-6: Acceptable but flawed
- 7-8: Good
- 9-10: Excellent

Focus on the quality of the solution, not writing style, verbosity, or tone.

Return:
Score: <1-10>
Reasoning: <brief explanation>
`;

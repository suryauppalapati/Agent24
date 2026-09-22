import { tools as agentTools } from "./tools"

type ExecuteToolParams = {
    toolName: keyof typeof agentTools,
    args?: any
}

const executeTool = async ({toolName, args}: ExecuteToolParams) => {
    if(!agentTools[toolName]) return `Error: Tool ${toolName} not found`

    const tool = agentTools[toolName]

    if(!tool['execute']) {
        throw new Error (`Tool ${toolName} is missing the execute function. `)
    }
    
    const execTool = tool.execute;
    const result = await execTool(args, {
        toolCallId: '',
        messages: []
    })
    return result.toString();

}

export default executeTool;
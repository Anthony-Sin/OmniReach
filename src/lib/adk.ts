
import { LlmAgent, FunctionTool, LlmAgentConfig, ToolOptions as AdkToolOptions, Context, isFunctionTool } from '@google/adk';
import { z } from 'zod';
import { workerQueues } from './workerQueue';

const agentRegistry = new Map<string, Agent>();

export class Agent extends LlmAgent {
  private messageHandlers: ((message: any) => void)[] = [];
  public agentTools: FunctionTool<any>[] = [];

  constructor(config: LlmAgentConfig) {
    super(config);
    this.agentTools = (config.tools || []) as FunctionTool<any>[];
    agentRegistry.set(config.name, this);
  }

  /**
   * Sends a message to another agent.
   * This implements the A2A (Agent-to-Agent) communication pattern.
   */
  sendMessage(targetName: string, message: any) {
    const target = agentRegistry.get(targetName);
    if (target) {
      target.receiveMessage(message);
    } else {
      console.warn(`[ADK] Target agent "${targetName}" not found for message:`, message);
    }
  }

  private receiveMessage(message: any) {
    this.messageHandlers.forEach(h => h(message));
  }

  /**
   * Registers a handler for incoming A2A messages.
   * Returns an unsubscribe function.
   */
  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
    return () => this.offMessage(handler);
  }

  /**
   * Unregisters a handler for incoming A2A messages.
   */
  offMessage(handler: (message: any) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  /**
   * Invokes a tool on an agent.
   * Supports cross-agent tool invocation.
   */
  async runTool(name: string, args: any, options?: { targetAgent?: string; queueName?: string }) {
    let target: Agent = this;
    if (options?.targetAgent) {
      const found = agentRegistry.get(options.targetAgent);
      if (found) {
        target = found;
      } else {
        throw new Error(`[ADK] Target agent "${options.targetAgent}" not found for tool invocation.`);
      }
    }

    const tool = target.agentTools.find(t => 'name' in t && t.name === name);
    if (tool && isFunctionTool(tool)) {
      // Create a minimal Context for the tool execution
      const toolContext: Context = {
        args,
        agent: target,
        tool
      } as any;

      try {
        const executeTool = () => tool.runAsync({ args, toolContext });
        if (options?.queueName) {
          return await workerQueues.enqueue(options.queueName, executeTool);
        }
        return await executeTool();
      } catch (error) {
        throw new Error(`[ADK] Tool "${name}" failed on agent "${target.name}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`[ADK] Tool "${name}" not found on agent "${target.name}"`);
  }
}

export interface ToolOptions {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  run: (args: any, context: Context) => Promise<any>;
}

export class Tool extends FunctionTool<any> {
  constructor(options: ToolOptions) {
    super({
      name: options.name,
      description: options.description,
      parameters: options.inputSchema,
      execute: (args, context) => {
        // Explicitly validate input with Zod schema
        const validatedArgs = options.inputSchema.parse(args);
        return options.run(validatedArgs, context!);
      }
    });
  }
}

import { streamObject } from "ai";
import { customModelProvider } from "lib/ai/models";
import { buildAgentGenerationPrompt } from "lib/ai/prompts";
import globalLogger from "logger";
import { ChatModel } from "app-types/chat";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { AgentGenerateSchema } from "app-types/agent";
import { z } from "zod";
import { loadAppDefaultTools } from "../../chat/shared.chat";
import { workflowRepository } from "lib/db/repository";
// import { safe } from "ts-safe";
import { objectFlow } from "lib/utils";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Agent Generate API: `),
});

// Interface untuk log data
interface AgentRequestLog {
  id: string;
  timestamp: string;
  session: {
    userId: string;
    email: string;
  };
  request: {
    chatModel?: {
      provider: string;
      model: string;
    };
    message: string;
  };
  tools: {
    available: string[];
    appTools: string[];
    mcpTools: string[];
    workflowTools: string[];
  };
  response?: {
    schema: any;
    systemPrompt: string;
    error?: {
      message: string;
      stack?: string;
    };
  };
  metadata: {
    userAgent?: string;
    ip?: string;
    endpoint: string;
  };
}

class AgentRequestLogger {
  private logDir: string;

  constructor() {
    // Buat base directory untuk logs
    this.logDir = path.join(process.cwd(), "logs", "agent-requests");
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }

  private getCurrentDateTimeFolder(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");

    return `${year}-${month}-${day}_${hour}`;
  }

  // private getCurrentTimestamp(): string {
  //   return new Date().toISOString();
  // }

  async saveLog(logData: AgentRequestLog): Promise<string> {
    try {
      const dateTimeFolder = this.getCurrentDateTimeFolder();
      const folderPath = path.join(this.logDir, dateTimeFolder);

      // Buat folder berdasarkan datetime
      await fs.mkdir(folderPath, { recursive: true });

      // Nama file menggunakan UUID
      const fileName = `${logData.id}.json`;
      const filePath = path.join(folderPath, fileName);

      // Simpan log sebagai JSON
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2), "utf-8");

      logger.success(`Agent request log saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error("Failed to save agent request log:", error);
      throw error;
    }
  }

  // Method untuk extract IP dari request
  getClientIP(request: Request): string {
    try {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");

      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      if (realIp) {
        return realIp;
      }

      return "unknown";
    } catch {
      return "unknown";
    }
  }
}

// Buat instance logger
const agentLogger = new AgentRequestLogger();

// Helper function untuk safe execution dengan error handling yang kompatibel
async function safeExecute<T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId: string,
): Promise<{ result?: T; error?: Error }> {
  try {
    const result = await operation();
    return { result };
  } catch (error) {
    logger.error(`[${requestId}] Failed to ${operationName}:`, error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function POST(request: Request) {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Buat log data structure
  const logData: AgentRequestLog = {
    id: requestId,
    timestamp: new Date().toISOString(),
    session: {
      userId: "",
      email: "",
    },
    request: {
      message: "",
    },
    tools: {
      available: [],
      appTools: [],
      mcpTools: [],
      workflowTools: [],
    },
    metadata: {
      userAgent: request.headers.get("user-agent") || "unknown",
      ip: agentLogger.getClientIP(request),
      endpoint: "/api/agent/ai",
    },
  };

  try {
    const json = await request.json();

    const { chatModel, message = "hello" } = json as {
      chatModel?: ChatModel;
      message: string;
    };

    // Update log data dengan request info
    logData.request = {
      chatModel: chatModel
        ? {
            provider: chatModel.provider,
            model: chatModel.model,
          }
        : undefined,
      message,
    };

    logger.info(
      `[${requestId}] chatModel: ${chatModel?.provider}/${chatModel?.model}`,
    );
    logger.info(`[${requestId}] Message: ${message}`);

    const session = await getSession();
    if (!session) {
      logData.metadata.endpoint += " - UNAUTHORIZED";
      await agentLogger.saveLog(logData);
      return new Response("Unauthorized", { status: 401 });
    }

    // Update session info di log
    logData.session = {
      userId: session.user.id,
      email: session.user.email || "unknown",
    };

    const toolNames = new Set<string>();
    const appTools: string[] = [];
    const mcpTools: string[] = [];
    const workflowTools: string[] = [];

    // Load App Default Tools
    const appToolsResult = await safeExecute(
      async () => {
        const result = await loadAppDefaultTools();
        objectFlow(result).forEach((_, toolName) => {
          toolNames.add(toolName);
          appTools.push(toolName);
          logger.info(`[${requestId}] Added app tool: ${toolName}`);
        });
        return result;
      },
      "load app default tools",
      requestId,
    );

    if (appToolsResult.error) {
      logger.error(
        `[${requestId}] Failed to load app default tools:`,
        appToolsResult.error,
      );
    }

    // Load MCP Tools -
    const mcpToolsResult = await safeExecute(
      async () => {
        const tools = await mcpClientsManager.tools();
        objectFlow(tools).forEach((mcp) => {
          toolNames.add(mcp._originToolName);
          mcpTools.push(mcp._originToolName);
          logger.info(`[${requestId}] Added MCP tool: ${mcp._originToolName}`);
        });
        return tools;
      },
      "load MCP tools",
      requestId,
    );

    if (mcpToolsResult.error) {
      logger.error(
        `[${requestId}] Failed to load MCP tools:`,
        mcpToolsResult.error,
      );
    }

    // Load Workflow Tools - MENGGUNAKAN SAFE EXECUTE YANG KOMPATIBEL
    const workflowToolsResult = await safeExecute(
      async () => {
        const tools = await workflowRepository.selectExecuteAbility(
          session.user.id,
        );
        tools.forEach((tool) => {
          toolNames.add(tool.name);
          workflowTools.push(tool.name);
          logger.info(`[${requestId}] Added workflow tool: ${tool.name}`);
        });
        return tools;
      },
      "load workflow tools",
      requestId,
    );

    if (workflowToolsResult.error) {
      logger.error(
        `[${requestId}] Failed to load workflow tools:`,
        workflowToolsResult.error,
      );
    }

    // Update tools info di log
    logData.tools = {
      available: Array.from(toolNames),
      appTools,
      mcpTools,
      workflowTools,
    };

    // Log semua tools yang tersedia
    logger.info(`[${requestId}] Total tools available: ${toolNames.size}`);
    logger.info(
      `[${requestId}] Tools list: ${Array.from(toolNames).join(", ")}`,
    );

    // Buat dynamic schema dengan tools yang tersedia
    const availableTools = Array.from(toolNames);
    const toolEnum =
      availableTools.length > 0
        ? z.enum([availableTools[0], ...availableTools.slice(1)] as [
            string,
            ...string[],
          ])
        : z.enum([""] as [string]);

    const dynamicAgentSchema = AgentGenerateSchema.extend({
      tools: z
        .array(toolEnum)
        .describe(
          `Agent allowed tools name. Available: ${availableTools.join(", ")}`,
        )
        .nullable()
        .default([]),
    });

    const system = buildAgentGenerationPrompt(availableTools);

    // Update response info di log
    logData.response = {
      schema: dynamicAgentSchema.shape,
      systemPrompt: system,
    };

    // Simpan log sebelum mengembalikan response
    await agentLogger.saveLog(logData);

    const result = streamObject({
      model: customModelProvider.getModel(chatModel),
      system,
      prompt: message,
      schema: dynamicAgentSchema,
    });

    const endTime = Date.now();
    logger.success(
      `[${requestId}] Request completed in ${endTime - startTime}ms`,
    );

    return result.toTextStreamResponse();
  } catch (error) {
    // Update log dengan error info
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logData.metadata.endpoint += " - ERROR";
    logData.response = {
      schema: {},
      systemPrompt: "",
      error: {
        message: errorMessage,
        stack: errorStack,
      },
    };

    // Simpan error log
    await agentLogger.saveLog(logData);

    logger.error(`[${requestId}] Error in agent AI route:`, error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Tambahkan juga GET method untuk debugging info
export async function GET(request: Request) {
  const requestId = uuidv4();

  const logData: AgentRequestLog = {
    id: requestId,
    timestamp: new Date().toISOString(),
    session: {
      userId: "GET_REQUEST",
      email: "get@request.com",
    },
    request: {
      message: "GET diagnostic request",
    },
    tools: {
      available: [],
      appTools: [],
      mcpTools: [],
      workflowTools: [],
    },
    metadata: {
      userAgent: request.headers.get("user-agent") || "unknown",
      ip: agentLogger.getClientIP(request),
      endpoint: "/api/agent/ai - GET",
    },
    response: {
      schema: {},
      systemPrompt: "GET request diagnostic",
    },
  };

  await agentLogger.saveLog(logData);

  return new Response(
    JSON.stringify({
      message: "Agent AI API is running",
      requestId,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

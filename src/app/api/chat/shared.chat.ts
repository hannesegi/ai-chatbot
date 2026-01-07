import "server-only";
import {
  LoadAPIKeyError,
  UIMessage,
  Tool,
  jsonSchema,
  tool as createTool,
  isToolUIPart,
  UIMessagePart,
  ToolUIPart,
  getToolName,
  UIMessageStreamWriter,
} from "ai";
import {
  ChatMention,
  ChatMetadata,
  ManualToolConfirmTag,
} from "app-types/chat";
import { errorToString, exclude, objectFlow } from "lib/utils";
import logger from "logger";
import {
  AllowedMCPServer,
  McpServerCustomizationsPrompt,
  VercelAIMcpTool,
  VercelAIMcpToolTag,
} from "app-types/mcp";
import { MANUAL_REJECT_RESPONSE_PROMPT } from "lib/ai/prompts";

import { ObjectJsonSchema7 } from "app-types/util";
import { safe } from "ts-safe";
import { workflowRepository } from "lib/db/repository";

import {
  VercelAIWorkflowTool,
  VercelAIWorkflowToolStreaming,
  VercelAIWorkflowToolStreamingResultTag,
  VercelAIWorkflowToolTag,
} from "app-types/workflow";
import { createWorkflowExecutor } from "lib/ai/workflow/executor/workflow-executor";
import { NodeKind } from "lib/ai/workflow/workflow.interface";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { APP_DEFAULT_TOOL_KIT } from "lib/ai/tools/tool-kit";
import { AppDefaultToolkit } from "lib/ai/tools";

export function filterMCPToolsByMentions(
  tools: Record<string, VercelAIMcpTool>,
  mentions: ChatMention[],
) {
  if (mentions.length === 0) {
    return tools;
  }
  const toolMentions = mentions.filter(
    (mention) => mention.type == "mcpTool" || mention.type == "mcpServer",
  );

  const metionsByServer = toolMentions.reduce(
    (acc, mention) => {
      if (mention.type == "mcpServer") {
        return {
          ...acc,
          [mention.serverId]: Object.values(tools).map(
            (tool) => tool._originToolName,
          ),
        };
      }
      return {
        ...acc,
        [mention.serverId]: [...(acc[mention.serverId] ?? []), mention.name],
      };
    },
    {} as Record<string, string[]>,
  );

  return objectFlow(tools).filter((_tool) => {
    if (!metionsByServer[_tool._mcpServerId]) return false;
    return metionsByServer[_tool._mcpServerId].includes(_tool._originToolName);
  });
}

export function filterMCPToolsByAllowedMCPServers(
  tools: Record<string, VercelAIMcpTool>,
  allowedMcpServers?: Record<string, AllowedMCPServer>,
): Record<string, VercelAIMcpTool> {
  if (!allowedMcpServers || Object.keys(allowedMcpServers).length === 0) {
    return {};
  }
  return objectFlow(tools).filter((_tool) => {
    if (!allowedMcpServers[_tool._mcpServerId]?.tools) return false;
    return allowedMcpServers[_tool._mcpServerId].tools.includes(
      _tool._originToolName,
    );
  });
}

export function excludeToolExecution(
  tool: Record<string, Tool>,
): Record<string, Tool> {
  return objectFlow(tool).map((value) => {
    return createTool({
      inputSchema: value.inputSchema,
      description: value.description,
    });
  });
}

export function mergeSystemPrompt(
  ...prompts: (string | undefined | false)[]
): string {
  const filteredPrompts = prompts
    .map((prompt) => (prompt ? prompt.trim() : ""))
    .filter(Boolean);
  return filteredPrompts.join("\n\n");
}

export function manualToolExecuteByLastMessage(
  part: ToolUIPart,
  tools: Record<string, VercelAIMcpTool | VercelAIWorkflowTool | Tool>,
  abortSignal?: AbortSignal,
) {
  const { input } = part;

  const toolName = getToolName(part);

  const tool = tools[toolName];
  return safe(() => {
    if (!tool) throw new Error(`tool not found: ${toolName}`);
    if (!ManualToolConfirmTag.isMaybe(part.output))
      throw new Error("manual tool confirm not found");
    return part.output;
  })
    .map(({ confirm }) => {
      if (!confirm) return MANUAL_REJECT_RESPONSE_PROMPT;
      if (VercelAIWorkflowToolTag.isMaybe(tool)) {
        return tool.execute!(input, {
          toolCallId: part.toolCallId,
          abortSignal: abortSignal ?? new AbortController().signal,
          messages: [],
        });
      } else if (VercelAIMcpToolTag.isMaybe(tool)) {
        return mcpClientsManager.toolCall(
          tool._mcpServerId,
          tool._originToolName,
          input,
        );
      }
      return tool.execute!(input, {
        toolCallId: part.toolCallId,
        abortSignal: abortSignal ?? new AbortController().signal,
        messages: [],
      });
    })
    .ifFail((error) => ({
      isError: true,
      statusMessage: `tool call fail: ${toolName}`,
      error: errorToString(error),
    }))
    .unwrap();
}

export function handleError(error: any) {
  if (LoadAPIKeyError.isInstance(error)) {
    return error.message;
  }
  logger.error(error);
  logger.error(`Route Error: ${error.name}`);
  return errorToString(error.message);
}

export function extractInProgressToolPart(message: UIMessage): ToolUIPart[] {
  if (message.role != "assistant") return [];
  if ((message.metadata as ChatMetadata)?.toolChoice != "manual") return [];
  return message.parts.filter(
    (part) =>
      isToolUIPart(part) &&
      part.state == "output-available" &&
      ManualToolConfirmTag.isMaybe(part.output),
  ) as ToolUIPart[];
}

export function filterMcpServerCustomizations(
  tools: Record<string, VercelAIMcpTool>,
  mcpServerCustomization: Record<string, McpServerCustomizationsPrompt>,
): Record<string, McpServerCustomizationsPrompt> {
  const toolNamesByServerId = Object.values(tools).reduce(
    (acc, tool) => {
      if (!acc[tool._mcpServerId]) acc[tool._mcpServerId] = [];
      acc[tool._mcpServerId].push(tool._originToolName);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return Object.entries(mcpServerCustomization).reduce(
    (acc, [serverId, mcpServerCustomization]) => {
      if (!(serverId in toolNamesByServerId)) return acc;

      if (
        !mcpServerCustomization.prompt &&
        !Object.keys(mcpServerCustomization.tools ?? {}).length
      )
        return acc;

      const prompts: McpServerCustomizationsPrompt = {
        id: serverId,
        name: mcpServerCustomization.name,
        prompt: mcpServerCustomization.prompt,
        tools: mcpServerCustomization.tools
          ? objectFlow(mcpServerCustomization.tools).filter((_, key) => {
              return toolNamesByServerId[serverId].includes(key as string);
            })
          : {},
      };

      acc[serverId] = prompts;

      return acc;
    },
    {} as Record<string, McpServerCustomizationsPrompt>,
  );
}

export const workflowToVercelAITool = ({
  id,
  description,
  schema,
  dataStream,
  name,
}: {
  id: string;
  name: string;
  description?: string;
  schema: ObjectJsonSchema7;
  dataStream: UIMessageStreamWriter;
}): VercelAIWorkflowTool => {
  const toolName = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase();

  const tool = createTool({
    description: `${name} ${description?.trim().slice(0, 50)}`,
    inputSchema: jsonSchema(schema),
    execute(query, { toolCallId, abortSignal }) {
      const history: VercelAIWorkflowToolStreaming[] = [];
      const toolResult = VercelAIWorkflowToolStreamingResultTag.create({
        toolCallId,
        workflowName: name,

        startedAt: Date.now(),
        endedAt: Date.now(),
        history,
        result: undefined,
        status: "running",
      });
      return safe(id)
        .map((id) =>
          workflowRepository.selectStructureById(id, {
            ignoreNote: true,
          }),
        )
        .map((workflow) => {
          if (!workflow) throw new Error("Not Found Workflow");
          const executor = createWorkflowExecutor({
            nodes: workflow.nodes,
            edges: workflow.edges,
          });
          toolResult.workflowIcon = workflow.icon;

          abortSignal?.addEventListener("abort", () => executor.exit());
          executor.subscribe((e) => {
            if (
              e.eventType == "WORKFLOW_START" ||
              e.eventType == "WORKFLOW_END"
            )
              return;
            if (e.node.name == "SKIP") return;
            if (e.eventType == "NODE_START") {
              const node = workflow.nodes.find(
                (node) => node.id == e.node.name,
              )!;
              if (!node) return;
              history.push({
                id: e.nodeExecutionId,
                name: node.name,
                status: "running",
                startedAt: e.startedAt,
                kind: node.kind as NodeKind,
              });
            } else if (e.eventType == "NODE_END") {
              const result = history.find((r) => r.id == e.nodeExecutionId);
              if (result) {
                if (e.isOk) {
                  result.status = "success";
                  result.result = {
                    input: e.node.output.getInput(e.node.name),
                    output: e.node.output.getOutput({
                      nodeId: e.node.name,
                      path: [],
                    }),
                  };
                } else {
                  result.status = "fail";
                  result.error = {
                    name: e.error?.name || "ERROR",
                    message: errorToString(e.error),
                  };
                }
                result.endedAt = e.endedAt;
              }
            }

            dataStream.write({
              type: "tool-output-available",
              toolCallId,
              output: toolResult,
            });
          });
          return executor.run(
            {
              query: query ?? ({} as any),
            },
            {
              disableHistory: true,
            },
          );
        })
        .map((result) => {
          toolResult.endedAt = Date.now();
          toolResult.status = result.isOk ? "success" : "fail";
          toolResult.error = result.error
            ? {
                name: result.error.name || "ERROR",
                message: errorToString(result.error) || "Unknown Error",
              }
            : undefined;
          const outputNodeResults = history
            .filter((h) => h.kind == NodeKind.Output)
            .map((v) => v.result?.output)
            .filter(Boolean);
          toolResult.history = history.map((h) => ({
            ...h,
            result: undefined, // save tokens.
          }));
          toolResult.result =
            outputNodeResults.length == 1
              ? outputNodeResults[0]
              : outputNodeResults;
          return toolResult;
        })
        .ifFail((err) => {
          return {
            error: {
              name: err?.name || "ERROR",
              message: errorToString(err),
              history,
            },
          };
        })
        .unwrap();
    },
  }) as VercelAIWorkflowTool;

  tool._workflowId = id;
  tool._originToolName = name;
  tool._toolName = toolName;

  return VercelAIWorkflowToolTag.create(tool);
};

export const workflowToVercelAITools = (
  workflows: {
    id: string;
    name: string;
    description?: string;
    schema: ObjectJsonSchema7;
  }[],
  dataStream: UIMessageStreamWriter,
) => {
  return workflows
    .map((v) =>
      workflowToVercelAITool({
        ...v,
        dataStream,
      }),
    )
    .reduce(
      (prev, cur) => {
        prev[cur._toolName] = cur;
        return prev;
      },
      {} as Record<string, VercelAIWorkflowTool>,
    );
};

export const loadMcpTools = (opt?: {
  mentions?: ChatMention[];
  allowedMcpServers?: Record<string, AllowedMCPServer>;
}) =>
  safe(() => mcpClientsManager.tools())
    .map((tools) => {
      if (opt?.mentions?.length) {
        return filterMCPToolsByMentions(tools, opt.mentions);
      }
      return filterMCPToolsByAllowedMCPServers(tools, opt?.allowedMcpServers);
    })
    .orElse({} as Record<string, VercelAIMcpTool>);

export const loadWorkFlowTools = (opt: {
  mentions?: ChatMention[];
  dataStream: UIMessageStreamWriter;
}) =>
  safe(() =>
    opt?.mentions?.length
      ? workflowRepository.selectToolByIds(
          opt?.mentions
            ?.filter((m) => m.type == "workflow")
            .map((v) => v.workflowId),
        )
      : [],
  )
    .map((tools) => workflowToVercelAITools(tools, opt.dataStream))
    .orElse({} as Record<string, VercelAIWorkflowTool>);

export const loadAppDefaultTools = (opt?: {
  mentions?: ChatMention[];
  allowedAppDefaultToolkit?: string[];
}) =>
  safe(APP_DEFAULT_TOOL_KIT)
    .map((tools) => {
      if (opt?.mentions?.length) {
        const defaultToolMentions = opt.mentions.filter(
          (m) => m.type == "defaultTool",
        );
        return Array.from(Object.values(tools)).reduce((acc, t) => {
          const allowed = objectFlow(t).filter((_, k) => {
            return defaultToolMentions.some((m) => m.name == k);
          });
          return { ...acc, ...allowed };
        }, {});
      }
      const allowedAppDefaultToolkit =
        opt?.allowedAppDefaultToolkit ?? Object.values(AppDefaultToolkit);

      return (
        allowedAppDefaultToolkit.reduce(
          (acc, key) => {
            return { ...acc, ...tools[key] };
          },
          {} as Record<string, Tool>,
        ) || {}
      );
    })
    .ifFail((e) => {
      console.error(e);
      throw e;
    })
    .orElse({} as Record<string, Tool>);

export const convertToSavePart = <T extends UIMessagePart<any, any>>(
  part: T,
) => {
  return safe(
    exclude(part as any, ["providerMetadata", "callProviderMetadata"]) as T,
  )
    .map((v) => {
      if (isToolUIPart(v) && v.state.startsWith("output")) {
        if (VercelAIWorkflowToolStreamingResultTag.isMaybe(v.output)) {
          return {
            ...v,
            output: {
              ...v.output,
              history: v.output.history.map((h: any) => {
                return {
                  ...h,
                  result: undefined,
                };
              }),
            },
          };
        }
      }
      return v;
    })
    .unwrap();
};

//rev 2

// import "server-only";
// import {
//   LoadAPIKeyError,
//   UIMessage,
//   Tool,
//   jsonSchema,
//   tool as createTool,
//   isToolUIPart,
//   UIMessagePart,
//   ToolUIPart,
//   getToolName,
//   UIMessageStreamWriter,
// } from "ai";
// import {
//   ChatMention,
//   ChatMetadata,
//   ManualToolConfirmTag,
// } from "app-types/chat";
// import { errorToString, exclude, objectFlow } from "lib/utils";
// import logger from "logger";
// import {
//   AllowedMCPServer,
//   McpServerCustomizationsPrompt,
//   VercelAIMcpTool,
//   VercelAIMcpToolTag,
// } from "app-types/mcp";
// import { MANUAL_REJECT_RESPONSE_PROMPT } from "lib/ai/prompts";

// import fs from "fs";
// import path from "path";

// import { ObjectJsonSchema7 } from "app-types/util";
// import { safe } from "ts-safe";
// import { workflowRepository } from "lib/db/repository";

// import {
//   VercelAIWorkflowTool,
//   VercelAIWorkflowToolStreaming,
//   VercelAIWorkflowToolStreamingResultTag,
//   VercelAIWorkflowToolTag,
// } from "app-types/workflow";
// import { createWorkflowExecutor } from "lib/ai/workflow/executor/workflow-executor";
// import { NodeKind } from "lib/ai/workflow/workflow.interface";
// import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
// import { APP_DEFAULT_TOOL_KIT } from "lib/ai/tools/tool-kit";
// import { AppDefaultToolkit } from "lib/ai/tools";

// // =============== HELPER: TOOL CALL LOGGING ===============
// // =============== HELPER: TOOL CALL LOGGING ===============
// function logToolCall({
//   toolName,
//   input,
//   output,
//   error,
//   durationMs,
// }: {
//   toolName: string;
//   input: any;
//   output?: any;
//   error?: any;
//   durationMs?: number;
// }) {
//   // Deep clone & sanitize untuk logging (hindari circular ref)
//   const safeInput =
//     safe(() => JSON.parse(JSON.stringify(input))).unwrap() || input;
//   const safeOutput = output
//     ? safe(() => JSON.parse(JSON.stringify(output))).unwrap()
//     : undefined;
//   const safeError = error ? errorToString(error) : undefined;

//   const logEntry = {
//     type: "tool_call",
//     toolName,
//     input: safeInput,
//     output: safeOutput,
//     error: safeError,
//     durationMs,
//     timestamp: new Date().toISOString(),
//   };

//   // 1. Log ke logger (console / sistem logging) - DIPERBAIKI
//   logger.info("Tool call executed", logEntry);

//   // 2. Simpan ke file JSON (append satu baris per call)
//   try {
//     const logDir = path.join(process.cwd(), "logs");
//     const logFile = path.join(logDir, "tool-calls.ndjson");

//     // Pastikan folder logs ada
//     if (!fs.existsSync(logDir)) {
//       fs.mkdirSync(logDir, { recursive: true });
//     }

//     // Tulis sebagai satu baris JSON (format NDJSON)
//     const logLine = JSON.stringify(logEntry) + "\n";
//     fs.appendFileSync(logFile, logLine, "utf8");

//     // TAMBAHAN: Log ke console untuk debug
//     console.log("=== TOOL CALL LOG ===");
//     console.log(`Tool: ${toolName}`);
//     console.log(`Duration: ${durationMs}ms`);
//     console.log(`Input:`, safeInput);
//     if (safeOutput) console.log(`Output:`, safeOutput);
//     if (safeError) console.log(`Error:`, safeError);
//     console.log(`Saved to: ${logFile}`);
//     console.log("=====================\n");
//   } catch (fileError) {
//     // Jika gagal menulis ke file, tetap log error-nya
//     console.error("Failed to write tool call log to file:", fileError);
//     logger.error("Failed to write tool call log", { error: fileError });
//   }
// }

// // =============== FUNGSI UTAMA ===============

// export function filterMCPToolsByMentions(
//   tools: Record<string, VercelAIMcpTool>,
//   mentions: ChatMention[],
// ) {
//   if (mentions.length === 0) {
//     return tools;
//   }
//   const toolMentions = mentions.filter(
//     (mention) => mention.type == "mcpTool" || mention.type == "mcpServer",
//   );

//   const metionsByServer = toolMentions.reduce(
//     (acc, mention) => {
//       if (mention.type == "mcpServer") {
//         return {
//           ...acc,
//           [mention.serverId]: Object.values(tools).map(
//             (tool) => tool._originToolName,
//           ),
//         };
//       }
//       return {
//         ...acc,
//         [mention.serverId]: [...(acc[mention.serverId] ?? []), mention.name],
//       };
//     },
//     {} as Record<string, string[]>,
//   );

//   return objectFlow(tools).filter((_tool) => {
//     if (!metionsByServer[_tool._mcpServerId]) return false;
//     return metionsByServer[_tool._mcpServerId].includes(_tool._originToolName);
//   });
// }

// export function filterMCPToolsByAllowedMCPServers(
//   tools: Record<string, VercelAIMcpTool>,
//   allowedMcpServers?: Record<string, AllowedMCPServer>,
// ): Record<string, VercelAIMcpTool> {
//   if (!allowedMcpServers || Object.keys(allowedMcpServers).length === 0) {
//     return {};
//   }
//   return objectFlow(tools).filter((_tool) => {
//     if (!allowedMcpServers[_tool._mcpServerId]?.tools) return false;
//     return allowedMcpServers[_tool._mcpServerId].tools.includes(
//       _tool._originToolName,
//     );
//   });
// }

// export function excludeToolExecution(
//   tool: Record<string, Tool>,
// ): Record<string, Tool> {
//   return objectFlow(tool).map((value) => {
//     return createTool({
//       inputSchema: value.inputSchema,
//       description: value.description,
//     });
//   });
// }

// export function mergeSystemPrompt(
//   ...prompts: (string | undefined | false)[]
// ): string {
//   const filteredPrompts = prompts
//     .map((prompt) => (prompt ? prompt.trim() : ""))
//     .filter(Boolean);
//   return filteredPrompts.join("\n\n");
// }

// export function manualToolExecuteByLastMessage(
//   part: ToolUIPart,
//   tools: Record<string, VercelAIMcpTool | VercelAIWorkflowTool | Tool>,
//   abortSignal?: AbortSignal,
// ) {
//   const { input } = part;
//   const toolName = getToolName(part);
//   const tool = tools[toolName];
//   const startTime = Date.now();

//   return safe(() => {
//     if (!tool) throw new Error(`tool not found: ${toolName}`);
//     if (!ManualToolConfirmTag.isMaybe(part.output))
//       throw new Error("manual tool confirm not found");
//     return part.output;
//   })
//     .map(({ confirm }) => {
//       if (!confirm) {
//         const result = MANUAL_REJECT_RESPONSE_PROMPT;
//         logToolCall({
//           toolName,
//           input,
//           output: result,
//           durationMs: Date.now() - startTime,
//         });
//         return result;
//       }

//       if (VercelAIWorkflowToolTag.isMaybe(tool)) {
//         const promise = tool.execute!(input, {
//           toolCallId: part.toolCallId,
//           abortSignal: abortSignal ?? new AbortController().signal,
//           messages: [],
//         });

//         return promise
//           .then((result) => {
//             logToolCall({
//               toolName,
//               input,
//               output: result,
//               durationMs: Date.now() - startTime,
//             });
//             return result;
//           })
//           .catch((error) => {
//             logToolCall({
//               toolName,
//               input,
//               error,
//               durationMs: Date.now() - startTime,
//             });
//             throw error;
//           });
//       } else if (VercelAIMcpToolTag.isMaybe(tool)) {
//         const promise = mcpClientsManager.toolCall(
//           tool._mcpServerId,
//           tool._originToolName,
//           input,
//         );

//         return promise
//           .then((result) => {
//             logToolCall({
//               toolName,
//               input,
//               output: result,
//               durationMs: Date.now() - startTime,
//             });
//             return result;
//           })
//           .catch((error) => {
//             logToolCall({
//               toolName,
//               input,
//               error,
//               durationMs: Date.now() - startTime,
//             });
//             throw error;
//           });
//       } else {
//         // Default Tool (non-MCP, non-Workflow)
//         const promise = tool.execute!(input, {
//           toolCallId: part.toolCallId,
//           abortSignal: abortSignal ?? new AbortController().signal,
//           messages: [],
//         });

//         return promise
//           .then((result) => {
//             logToolCall({
//               toolName,
//               input,
//               output: result,
//               durationMs: Date.now() - startTime,
//             });
//             return result;
//           })
//           .catch((error) => {
//             logToolCall({
//               toolName,
//               input,
//               error,
//               durationMs: Date.now() - startTime,
//             });
//             throw error;
//           });
//       }
//     })
//     .ifFail((error) => {
//       logToolCall({
//         toolName,
//         input,
//         error,
//         durationMs: Date.now() - startTime,
//       });
//       return {
//         isError: true,
//         statusMessage: `tool call fail: ${toolName}`,
//         error: errorToString(error),
//       };
//     })
//     .unwrap();
// }

// export function handleError(error: any) {
//   if (LoadAPIKeyError.isInstance(error)) {
//     return error.message;
//   }
//   logger.error(error);
//   logger.error(`Route Error: ${error.name}`);
//   return errorToString(error.message);
// }

// export function extractInProgressToolPart(message: UIMessage): ToolUIPart[] {
//   if (message.role != "assistant") return [];
//   if ((message.metadata as ChatMetadata)?.toolChoice != "manual") return [];
//   return message.parts.filter(
//     (part) =>
//       isToolUIPart(part) &&
//       part.state == "output-available" &&
//       ManualToolConfirmTag.isMaybe(part.output),
//   ) as ToolUIPart[];
// }

// export function filterMcpServerCustomizations(
//   tools: Record<string, VercelAIMcpTool>,
//   mcpServerCustomization: Record<string, McpServerCustomizationsPrompt>,
// ): Record<string, McpServerCustomizationsPrompt> {
//   const toolNamesByServerId = Object.values(tools).reduce(
//     (acc, tool) => {
//       if (!acc[tool._mcpServerId]) acc[tool._mcpServerId] = [];
//       acc[tool._mcpServerId].push(tool._originToolName);
//       return acc;
//     },
//     {} as Record<string, string[]>,
//   );

//   return Object.entries(mcpServerCustomization).reduce(
//     (acc, [serverId, mcpServerCustomization]) => {
//       if (!(serverId in toolNamesByServerId)) return acc;

//       if (
//         !mcpServerCustomization.prompt &&
//         !Object.keys(mcpServerCustomization.tools ?? {}).length
//       )
//         return acc;

//       const prompts: McpServerCustomizationsPrompt = {
//         id: serverId,
//         name: mcpServerCustomization.name,
//         prompt: mcpServerCustomization.prompt,
//         tools: mcpServerCustomization.tools
//           ? objectFlow(mcpServerCustomization.tools).filter((_, key) => {
//               return toolNamesByServerId[serverId].includes(key as string);
//             })
//           : {},
//       };

//       acc[serverId] = prompts;

//       return acc;
//     },
//     {} as Record<string, McpServerCustomizationsPrompt>,
//   );
// }

// export const workflowToVercelAITool = ({
//   id,
//   description,
//   schema,
//   dataStream,
//   name,
// }: {
//   id: string;
//   name: string;
//   description?: string;
//   schema: ObjectJsonSchema7;
//   dataStream: UIMessageStreamWriter;
// }): VercelAIWorkflowTool => {
//   const toolName = name
//     .replace(/[^a-zA-Z0-9\s]/g, "")
//     .trim()
//     .replace(/\s+/g, "-")
//     .toUpperCase();

//   const tool = createTool({
//     description: `${name} ${description?.trim().slice(0, 50)}`,
//     inputSchema: jsonSchema(schema),
//     execute(query, { toolCallId, abortSignal }) {
//       const startTime = Date.now();
//       const history: VercelAIWorkflowToolStreaming[] = [];
//       const toolResult = VercelAIWorkflowToolStreamingResultTag.create({
//         toolCallId,
//         workflowName: name,
//         startedAt: Date.now(),
//         endedAt: Date.now(),
//         history,
//         result: undefined,
//         status: "running",
//       });

//       return safe(id)
//         .map((id) =>
//           workflowRepository.selectStructureById(id, {
//             ignoreNote: true,
//           }),
//         )
//         .map((workflow) => {
//           if (!workflow) throw new Error("Not Found Workflow");
//           const executor = createWorkflowExecutor({
//             nodes: workflow.nodes,
//             edges: workflow.edges,
//           });
//           toolResult.workflowIcon = workflow.icon;

//           abortSignal?.addEventListener("abort", () => executor.exit());
//           executor.subscribe((e) => {
//             if (
//               e.eventType == "WORKFLOW_START" ||
//               e.eventType == "WORKFLOW_END"
//             )
//               return;
//             if (e.node.name == "SKIP") return;
//             if (e.eventType == "NODE_START") {
//               const node = workflow.nodes.find(
//                 (node) => node.id == e.node.name,
//               )!;
//               if (!node) return;
//               history.push({
//                 id: e.nodeExecutionId,
//                 name: node.name,
//                 status: "running",
//                 startedAt: e.startedAt,
//                 kind: node.kind as NodeKind,
//               });
//             } else if (e.eventType == "NODE_END") {
//               const result = history.find((r) => r.id == e.nodeExecutionId);
//               if (result) {
//                 if (e.isOk) {
//                   result.status = "success";
//                   result.result = {
//                     input: e.node.output.getInput(e.node.name),
//                     output: e.node.output.getOutput({
//                       nodeId: e.node.name,
//                       path: [],
//                     }),
//                   };
//                 } else {
//                   result.status = "fail";
//                   result.error = {
//                     name: e.error?.name || "ERROR",
//                     message: errorToString(e.error),
//                   };
//                 }
//                 result.endedAt = e.endedAt;
//               }
//             }

//             dataStream.write({
//               type: "tool-output-available",
//               toolCallId,
//               output: toolResult,
//             });
//           });

//           return executor.run(
//             {
//               query: query ?? ({} as any),
//             },
//             {
//               disableHistory: true,
//             },
//           );
//         })
//         .map((result) => {
//           const durationMs = Date.now() - startTime;
//           toolResult.endedAt = Date.now();
//           toolResult.status = result.isOk ? "success" : "fail";
//           toolResult.error = result.error
//             ? {
//                 name: result.error.name || "ERROR",
//                 message: errorToString(result.error) || "Unknown Error",
//               }
//             : undefined;
//           const outputNodeResults = history
//             .filter((h) => h.kind == NodeKind.Output)
//             .map((v) => v.result?.output)
//             .filter(Boolean);
//           toolResult.history = history.map((h) => ({
//             ...h,
//             result: undefined, // save tokens.
//           }));
//           toolResult.result =
//             outputNodeResults.length == 1
//               ? outputNodeResults[0]
//               : outputNodeResults;

//           // Log hasil eksekusi workflow sebagai tool
//           logToolCall({
//             toolName,
//             input: query,
//             output: toolResult,
//             durationMs,
//           });

//           return toolResult;
//         })
//         .ifFail((err) => {
//           const durationMs = Date.now() - startTime;
//           logToolCall({
//             toolName,
//             input: query,
//             error: err,
//             durationMs,
//           });
//           return {
//             error: {
//               name: err?.name || "ERROR",
//               message: errorToString(err),
//               history,
//             },
//           };
//         })
//         .unwrap();
//     },
//   }) as VercelAIWorkflowTool;

//   tool._workflowId = id;
//   tool._originToolName = name;
//   tool._toolName = toolName;

//   return VercelAIWorkflowToolTag.create(tool);
// };

// export const workflowToVercelAITools = (
//   workflows: {
//     id: string;
//     name: string;
//     description?: string;
//     schema: ObjectJsonSchema7;
//   }[],
//   dataStream: UIMessageStreamWriter,
// ) => {
//   return workflows
//     .map((v) =>
//       workflowToVercelAITool({
//         ...v,
//         dataStream,
//       }),
//     )
//     .reduce(
//       (prev, cur) => {
//         prev[cur._toolName] = cur;
//         return prev;
//       },
//       {} as Record<string, VercelAIWorkflowTool>,
//     );
// };

// export const loadMcpTools = (opt?: {
//   mentions?: ChatMention[];
//   allowedMcpServers?: Record<string, AllowedMCPServer>;
// }) =>
//   safe(() => mcpClientsManager.tools())
//     .map((tools) => {
//       if (opt?.mentions?.length) {
//         return filterMCPToolsByMentions(tools, opt.mentions);
//       }
//       return filterMCPToolsByAllowedMCPServers(tools, opt?.allowedMcpServers);
//     })
//     .orElse({} as Record<string, VercelAIMcpTool>);

// export const loadWorkFlowTools = (opt: {
//   mentions?: ChatMention[];
//   dataStream: UIMessageStreamWriter;
// }) =>
//   safe(() =>
//     opt?.mentions?.length
//       ? workflowRepository.selectToolByIds(
//           opt?.mentions
//             ?.filter((m) => m.type == "workflow")
//             .map((v) => v.workflowId),
//         )
//       : [],
//   )
//     .map((tools) => workflowToVercelAITools(tools, opt.dataStream))
//     .orElse({} as Record<string, VercelAIWorkflowTool>);

// export const loadAppDefaultTools = (opt?: {
//   mentions?: ChatMention[];
//   allowedAppDefaultToolkit?: string[];
// }) =>
//   safe(APP_DEFAULT_TOOL_KIT)
//     .map((tools) => {
//       if (opt?.mentions?.length) {
//         const defaultToolMentions = opt.mentions.filter(
//           (m) => m.type == "defaultTool",
//         );
//         return Array.from(Object.values(tools)).reduce((acc, t) => {
//           const allowed = objectFlow(t).filter((_, k) => {
//             return defaultToolMentions.some((m) => m.name == k);
//           });
//           return { ...acc, ...allowed };
//         }, {});
//       }
//       const allowedAppDefaultToolkit =
//         opt?.allowedAppDefaultToolkit ?? Object.values(AppDefaultToolkit);

//       return (
//         allowedAppDefaultToolkit.reduce(
//           (acc, key) => {
//             return { ...acc, ...tools[key] };
//           },
//           {} as Record<string, Tool>,
//         ) || {}
//       );
//     })
//     .ifFail((e) => {
//       console.error(e);
//       throw e;
//     })
//     .orElse({} as Record<string, Tool>);

// export const convertToSavePart = <T extends UIMessagePart<any, any>>(
//   part: T,
// ) => {
//   return safe(
//     exclude(part as any, ["providerMetadata", "callProviderMetadata"]) as T,
//   )
//     .map((v) => {
//       if (isToolUIPart(v) && v.state.startsWith("output")) {
//         if (VercelAIWorkflowToolStreamingResultTag.isMaybe(v.output)) {
//           return {
//             ...v,
//             output: {
//               ...v.output,
//               history: v.output.history.map((h: any) => {
//                 return {
//                   ...h,
//                   result: undefined,
//                 };
//               }),
//             },
//           };
//         }
//       }
//       return v;
//     })
//     .unwrap();
// };

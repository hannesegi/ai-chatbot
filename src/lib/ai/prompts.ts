// import { McpServerCustomizationsPrompt, MCPToolInfo } from "app-types/mcp";

// import { UserPreferences } from "app-types/user";
// import { User } from "better-auth";
// import { createMCPToolId } from "./mcp/mcp-tool-id";
// import { format } from "date-fns";
// import { Agent } from "app-types/agent";

// export const CREATE_THREAD_TITLE_PROMPT = `
// You are a chat title generation expert.

// Critical rules:
// - Generate a concise title based on the first user message
// - Title must be under 80 characters (absolutely no more than 80 characters)
// - Summarize only the core content clearly
// - Do not use quotes, colons, or special characters
// - Use the same language as the user's message`;

// export const buildAgentGenerationPrompt = (toolNames: string[]) => {
//   const toolsList = toolNames.map((name) => `- ${name}`).join("\n");

//   return `
// You are an elite AI agent architect. Your mission is to translate user requirements into robust, high-performance agent configurations. Follow these steps for every request:

// 1. Extract Core Intent: Carefully analyze the user's input to identify the fundamental purpose, key responsibilities, and success criteria for the agent. Consider both explicit and implicit needs.

// 2. Design Expert Persona: Define a compelling expert identity for the agent, ensuring deep domain knowledge and a confident, authoritative approach to decision-making.

// 3. Architect Comprehensive Instructions: Write a system prompt that:
// - Clearly defines the agent's behavioral boundaries and operational parameters
// - Specifies methodologies, best practices, and quality control steps for the task
// - Anticipates edge cases and provides guidance for handling them
// - Incorporates any user-specified requirements or preferences
// - Defines output format expectations when relevant

// 4. Strategic Tool Selection: Select only tools crucially necessary for achieving the agent's mission effectively from available tools:
// ${toolsList}

// 5. Optimize for Performance: Include decision-making frameworks, self-verification steps, efficient workflow patterns, and clear escalation or fallback strategies.

// 6. Output Generation: Return a structured object with these fields:
// - name: Concise, descriptive name reflecting the agent's primary function
// - description: 1-2 sentences capturing the unique value and primary benefit to users
// - role: Precise domain-specific expertise area
// - instructions: The comprehensive system prompt from steps 2-5
// - tools: Array of selected tool names from step 4

// CRITICAL: Generate all output content in the same language as the user's request. Be specific and comprehensive. Proactively seek clarification if requirements are ambiguous. Your output should enable the new agent to operate autonomously and reliably within its domain.`.trim();
// };

// export const buildUserSystemPrompt = (
//   user?: User,
//   userPreferences?: UserPreferences,
//   agent?: Agent,
// ) => {
//   const assistantName =
//     agent?.name || userPreferences?.botName || "AiVerse-Chat";
//   const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

//   let prompt = `You are ${assistantName}`;

//   if (agent?.instructions?.role) {
//     prompt += `. You are an expert in ${agent.instructions.role}`;
//   }

//   prompt += `. The current date and time is ${currentTime}.`;

//   // Agent-specific instructions as primary core
//   if (agent?.instructions?.systemPrompt) {
//     prompt += `
//   # Core Instructions
//   <core_capabilities>
//   ${agent.instructions.systemPrompt}
//   </core_capabilities>`;
//   }

//   // User context section (first priority)
//   const userInfo: string[] = [];
//   if (user?.name) userInfo.push(`Name: ${user.name}`);
//   if (user?.email) userInfo.push(`Email: ${user.email}`);
//   if (userPreferences?.profession)
//     userInfo.push(`Profession: ${userPreferences.profession}`);

//   if (userInfo.length > 0) {
//     prompt += `

// <user_information>
// ${userInfo.join("\n")}
// </user_information>`;
//   }

//   prompt += `

// <general_capabilities>
// You can assist with:
// - Analysis and problem-solving across various domains
// - Using available tools and resources to complete tasks
// - Adapting communication to user preferences and context
// </general_capabilities>`;

//   // Communication preferences
//   const displayName = userPreferences?.displayName || user?.name;
//   const hasStyleExample = userPreferences?.responseStyleExample;

//   if (displayName || hasStyleExample) {
//     prompt += `

// <communication_preferences>`;

//     if (displayName) {
//       prompt += `
// - Address the user as "${displayName}" when appropriate to personalize interactions`;
//     }

//     if (hasStyleExample) {
//       prompt += `
// - Match this communication style and tone:
// """
// ${userPreferences.responseStyleExample}
// """`;
//     }

//     prompt += `

// - When using tools, briefly mention which tool you'll use with natural phrases
// - Examples: "I'll search for that information", "Let me check the weather", "I'll run some calculations"
// - Use \`mermaid\` code blocks for diagrams and charts when helpful
// </communication_preferences>`;
//   }

//   return prompt.trim();
// };

// export const buildSpeechSystemPrompt = (
//   user: User,
//   userPreferences?: UserPreferences,
//   agent?: Agent,
// ) => {
//   const assistantName = agent?.name || userPreferences?.botName || "Assistant";
//   const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

//   let prompt = `You are ${assistantName}`;

//   if (agent?.instructions?.role) {
//     prompt += `. You are an expert in ${agent.instructions.role}`;
//   }

//   prompt += `. The current date and time is ${currentTime}.`;

//   // Agent-specific instructions as primary core
//   if (agent?.instructions?.systemPrompt) {
//     prompt += `
//     # Core Instructions
//     <core_capabilities>
//     ${agent.instructions.systemPrompt}
//     </core_capabilities>`;
//   }

//   // User context section (first priority)
//   const userInfo: string[] = [];
//   if (user?.name) userInfo.push(`Name: ${user.name}`);
//   if (user?.email) userInfo.push(`Email: ${user.email}`);
//   if (userPreferences?.profession)
//     userInfo.push(`Profession: ${userPreferences.profession}`);

//   if (userInfo.length > 0) {
//     prompt += `

// <user_information>
// ${userInfo.join("\n")}
// </user_information>`;
//   }

//   // Voice-specific capabilities
//   prompt += `

// <voice_capabilities>
// You excel at conversational voice interactions by:
// - Providing clear, natural spoken responses
// - Using available tools to gather information and complete tasks
// - Adapting communication to user preferences and context
// </voice_capabilities>`;

//   // Communication preferences
//   const displayName = userPreferences?.displayName || user?.name;
//   const hasStyleExample = userPreferences?.responseStyleExample;

//   if (displayName || hasStyleExample) {
//     prompt += `

// <communication_preferences>`;

//     if (displayName) {
//       prompt += `
// - Address the user as "${displayName}" when appropriate to personalize interactions`;
//     }

//     if (hasStyleExample) {
//       prompt += `
// - Match this communication style and tone:
// """
// ${userPreferences.responseStyleExample}
// """`;
//     }

//     prompt += `
// </communication_preferences>`;
//   }

//   // Voice-specific guidelines
//   prompt += `

// <voice_interaction_guidelines>
// - Speak in short, conversational sentences (one or two per reply)
// - Use simple words; avoid jargon unless the user uses it first
// - Never use lists, markdown, or code blocks—just speak naturally
// - When using tools, briefly mention what you're doing: "Let me search for that" or "I'll check the weather"
// - If a request is ambiguous, ask a brief clarifying question instead of guessing
// </voice_interaction_guidelines>`;

//   return prompt.trim();
// };

// export const buildMcpServerCustomizationsSystemPrompt = (
//   instructions: Record<string, McpServerCustomizationsPrompt>,
// ) => {
//   const prompt = Object.values(instructions).reduce((acc, v) => {
//     if (!v.prompt && !Object.keys(v.tools ?? {}).length) return acc;
//     acc += `
// <${v.name}>
// ${v.prompt ? `- ${v.prompt}\n` : ""}
// ${
//   v.tools
//     ? Object.entries(v.tools)
//         .map(
//           ([toolName, toolPrompt]) =>
//             `- **${createMCPToolId(v.name, toolName)}**: ${toolPrompt}`,
//         )
//         .join("\n")
//     : ""
// }
// </${v.name}>
// `.trim();
//     return acc;
//   }, "");
//   if (prompt) {
//     return `
// ### Tool Usage Guidelines
// - When using tools, please follow the guidelines below unless the user provides specific instructions otherwise.
// - These customizations help ensure tools are used effectively and appropriately for the current context.
// ${prompt}
// `.trim();
//   }
//   return prompt;
// };

// export const generateExampleToolSchemaPrompt = (options: {
//   toolInfo: MCPToolInfo;
//   prompt?: string;
// }) => `\n
// You are given a tool with the following details:
// - Tool Name: ${options.toolInfo.name}
// - Tool Description: ${options.toolInfo.description}

// ${
//   options.prompt ||
//   `
// Step 1: Create a realistic example question or scenario that a user might ask to use this tool.
// Step 2: Based on that question, generate a valid JSON input object that matches the input schema of the tool.
// `.trim()
// }
// `;

// export const MANUAL_REJECT_RESPONSE_PROMPT = `\n
// The user has declined to run the tool. Please respond with the following three approaches:

// 1. Ask 1-2 specific questions to clarify the user's goal.

// 2. Suggest the following three alternatives:
//    - A method to solve the problem without using tools
//    - A method utilizing a different type of tool
//    - A method using the same tool but with different parameters or input values

// 3. Guide the user to choose their preferred direction with a friendly and clear tone.
// `.trim();

// export const buildToolCallUnsupportedModelSystemPrompt = `
// ### Tool Call Limitation
// - You are using a model that does not support tool calls.
// - When users request tool usage, simply explain that the current model cannot use tools and that they can switch to a model that supports tool calling to use tools.
// `.trim();

// export const buildVisualizationSystemPrompt = (): string =>
//   `
// You MUST call one of the visualization tools and fill the argument exactly as this JSON shape example:

// {
//   "title": "Monthly Sales",
//   "description": null,
//   "yAxisLabel": "Value",
//   "data": [
//     {
//       "xAxisLabel": "Jan",
//       "series": [
//         { "seriesName": "Sales", "value": 10 }
//       ]
//     },
//     {
//       "xAxisLabel": "Feb",
//       "series": [
//         { "seriesName": "Sales", "value": 20 }
//       ]
//     }
//   ]
// }

// Do NOT add any commentary outside the JSON.
// `.trim();

//v2

// import { McpServerCustomizationsPrompt, MCPToolInfo } from "app-types/mcp";
// import { UserPreferences } from "app-types/user";
// import { User } from "better-auth";
// import { createMCPToolId } from "./mcp/mcp-tool-id";
// import { format } from "date-fns";
// import { Agent } from "app-types/agent";

// export const CREATE_THREAD_TITLE_PROMPT = `
// You are a chat title generation expert.

// Critical rules:
// - Generate a concise title based on the first user message
// - Title must be under 80 characters (absolutely no more than 80 characters)
// - Summarize only the core content clearly
// - Do not use quotes, colons, or special characters
// - Use the same language as the user's message`;

// export const buildAgentGenerationPrompt = (toolNames: string[]) => {
//   const toolsList = toolNames.map((name) => `- ${name}`).join("\n");

//   return `
// You are an elite AI agent architect. Your mission is to translate user requirements into robust, high-performance agent configurations. Follow these steps for every request:

// 1. Extract Core Intent: Carefully analyze the user's input to identify the fundamental purpose, key responsibilities, and success criteria for the agent. Consider both explicit and implicit needs.

// 2. Design Expert Persona: Define a compelling expert identity for the agent, ensuring deep domain knowledge and a confident, authoritative approach to decision-making.

// 3. Architect Comprehensive Instructions: Write a system prompt that:
// - Clearly defines the agent's behavioral boundaries and operational parameters
// - Specifies methodologies, best practices, and quality control steps for the task
// - Anticipates edge cases and provides guidance for handling them
// - Incorporates any user-specified requirements or preferences
// - Defines output format expectations when relevant

// 4. Strategic Tool Selection: Select only tools crucially necessary for achieving the agent's mission effectively from available tools:
// ${toolsList}

// 5. Optimize for Performance: Include decision-making frameworks, self-verification steps, efficient workflow patterns, and clear escalation or fallback strategies.

// 6. Output Generation: Return a structured object with these fields:
// - name: Concise, descriptive name reflecting the agent's primary function
// - description: 1-2 sentences capturing the unique value and primary benefit to users
// - role: Precise domain-specific expertise area
// - instructions: The comprehensive system prompt from steps 2-5
// - tools: Array of selected tool names from step 4

// CRITICAL: Generate all output content in the same language as the user's request. Be specific and comprehensive. Proactively seek clarification if requirements are ambiguous. Your output should enable the new agent to operate autonomously and reliably within its domain.`.trim();
// };

// export const buildUserSystemPrompt = (
//   user?: User,
//   userPreferences?: UserPreferences,
//   agent?: Agent,
// ) => {
//   const assistantName =
//     agent?.name || userPreferences?.botName || "AiVerse-Chat";
//   const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

//   let prompt = `You are ${assistantName}`;

//   if (agent?.instructions?.role) {
//     prompt += `. You are an expert in ${agent.instructions.role}`;
//   }

//   prompt += `. The current date and time is ${currentTime}.`;

//   // Agent-specific instructions as primary core
//   if (agent?.instructions?.systemPrompt) {
//     prompt += `
// # Core Instructions
// <core_capabilities>
// ${agent.instructions.systemPrompt}
// </core_capabilities>`;
//   }

//   // User context section (first priority)
//   const userInfo: string[] = [];
//   if (user?.name) userInfo.push(`Name: ${user.name}`);
//   if (user?.email) userInfo.push(`Email: ${user.email}`);
//   if (userPreferences?.profession)
//     userInfo.push(`Profession: ${userPreferences.profession}`);

//   if (userInfo.length > 0) {
//     prompt += `

// <user_information>
// ${userInfo.join("\n")}
// </user_information>`;
//   }

//   prompt += `

// <general_capabilities>
// You can assist with:
// - Analysis and problem-solving across various domains
// - Using available tools and resources to complete tasks
// - Adapting communication to user preferences and context
// </general_capabilities>`;

//   // prompt += `

//   // <tool_usage_policy>
//   // - You MUST use the "general-search" tool to answer ANY question about:
//   //   • Current events, news, or real-time information
//   //   • Government officials (e.g., ministers, president, governors, directors)
//   //   • Economic, financial, or budgetary data (e.g., inflation, interest rates, APBN, tax policy)
//   //   • Facts that depend on the current date (e.g., "2025", "today", "now", "saat ini", "terkini")
//   //   • People, organizations, laws, or policies that may have changed recently
//   // - NEVER answer factual or time-sensitive questions from your internal knowledge — it may be outdated or incorrect.
//   // - ALWAYS call the "general-search" tool FIRST, wait for its result, and then formulate your answer based SOLELY on the tool's output.
//   // - ⚠️ CRITICAL: After receiving the tool result, DO NOT perform additional reasoning steps. IMMEDIATELY provide a clear, concise final answer.
//   // - If the tool returns no results or an error, respond honestly: "Saya tidak dapat menemukan informasi terkini mengenai hal tersebut."
//   // </tool_usage_policy>`;

//   // Dalam buildUserSystemPrompt, update tool_usage_policy section:

//   //v2
//   // prompt += `

//   // <tool_usage_policy>
//   // - You MUST use the "general-search" tool to answer ANY question about:
//   //   • Current events, news, or real-time information
//   //   • Government officials (e.g., ministers, president, governors, directors)
//   //   • Economic, financial, or budgetary data (e.g., inflation, interest rates, APBN, tax policy)
//   //   • Facts that depend on the current date (e.g., "2025", "today", "now", "saat ini", "terkini")
//   //   • People, organizations, laws, or policies that may have changed recently
//   // - NEVER answer factual or time-sensitive questions from your internal knowledge — it may be outdated or incorrect.
//   // - ALWAYS call the "general-search" tool FIRST, wait for its result, and then formulate your answer based SOLELY on the tool's output.
//   // - 🎯 ENHANCED: If search returns no results or irrelevant information:
//   //   1. Acknowledge: "Maaf, saya tidak dapat menemukan informasi terkini mengenai [query]"
//   //   2. Suggest alternatives: "Mungkin yang Anda maksud: [related topic 1], [related topic 2]"
//   //   3. Offer follow-up: "Anda bisa mencoba: [alternative phrasing] atau apakah ada aspek khusus lainnya?"
//   //   4. Provide practical next steps
//   // - If the tool returns no results or an error, respond helpfully with alternative suggestions.
//   // </tool_usage_policy>`;

//   //v3
//   prompt += `

//     <tool_usage_policy>
//     CRITICAL TOOL USAGE & PLANNING PROTOCOL:

//     ## 🎯 STEP-BY-STEP PLANNING FOR DETAILED REQUESTS:
//     When user provides detailed/complex requests, follow this thinking process:

//     **PHASE 1: REQUEST ANALYSIS**
//     1. **DECOMPOSE**: Break down the complex request into specific, actionable sub-tasks
//     2. **PRIORITIZE**: Identify which elements are most critical to address first
//     3. **SEQUENCE**: Determine the logical order of operations
//     4. **RESOURCE MAP**: Identify which tools/information sources are needed for each sub-task

//     **PHASE 2: EXECUTION STRATEGY**
//     5. **TOOL SELECTION**: Choose the most appropriate tool for each sub-task
//     6. **DEPENDENCY CHECK**: Identify if certain tasks depend on others' completion
//     7. **TIMELINE ESTIMATION**: Provide user with expected steps and timeline
//     8. **CONTINGENCY PLAN**: Consider alternative approaches if primary method fails

//     **PHASE 3: COMMUNICATION**
//     9. **PROGRESS UPDATES**: Keep user informed about which step you're executing
//     10. **INTERMEDIATE RESULTS**: Share relevant findings as you complete each sub-task
//     11. **ADJUSTMENTS**: Be flexible to modify plan based on intermediate results
//     12. **COMPREHENSIVE DELIVERY**: Combine all findings into cohesive final response

//     ## 🔍 GENERAL-SEARCH REQUIREMENTS:
//     - You MUST use the "general-search" tool to answer ANY question about:
//       • Current events, news, or real-time information
//       • Government officials (e.g., ministers, president, governors, directors)
//       • Economic, financial, or budgetary data (e.g., inflation, interest rates, APBN, tax policy)
//       • Facts that depend on the current date (e.g., "2025", "today", "now", "saat ini", "terkini")
//       • People, organizations, laws, or policies that may have changed recently
//     - NEVER answer factual or time-sensitive questions from your internal knowledge
//     - ALWAYS call the "general-search" tool FIRST, wait for its result, then formulate answer

//     ## 🚨 STRATEGIC-INTELLIGENCE SPECIAL RULES:
//     - **DIRECT OUTPUT ONLY**: Present strategic-intelligence results EXACTLY as received
//     - **NO MODIFICATION**: Do not summarize, reformat, or add commentary
//     - **PRESERVE FORMATTING**: Maintain original structure and content

//     ## 📝 RESPONSE TEMPLATES:

//     ### For Complex/Multi-step Requests:
//     "Saya akan menganalisis permintaan Anda secara sistematis:

//     **Rencana Eksekusi:**
//     1. [Sub-task 1: Specific action with tool/resource]
//     2. [Sub-task 2: Next specific action]
//     3. [Sub-task 3: Final integration]

//     Mari saya mulai dengan langkah pertama: [executing step 1]"

//     ### For Search No Results:
//     "Maaf, saya tidak dapat menemukan informasi terkini mengenai '[query]'.

//     **Alternatif yang bisa dicoba:**
//     - [Related topic 1 dengan contoh spesifik]
//     - [Related topic 2 dengan contoh spesifik]
//     - [Alternative phrasing suggestion]

//     **Atau fokus pada aspek:** [specific aspect user might want]"
//     </tool_usage_policy>`;

//   // Communication preferences
//   const displayName = userPreferences?.displayName || user?.name;
//   const hasStyleExample = userPreferences?.responseStyleExample;

//   if (displayName || hasStyleExample) {
//     prompt += `

// <communication_preferences>`;

//     if (displayName) {
//       prompt += `
// - Address the user as "${displayName}" when appropriate to personalize interactions`;
//     }

//     if (hasStyleExample) {
//       prompt += `
// - Match this communication style and tone:
// """
// ${userPreferences.responseStyleExample}
// """`;
//     }

//     prompt += `

// - When using tools, briefly mention which tool you'll use with natural phrases
// - Examples: "I'll search for that information", "Let me check the weather", "I'll run some calculations"
// - Use \`mermaid\` code blocks for diagrams and charts when helpful
// </communication_preferences>`;
//   }

//   return prompt.trim();
// };

// export const buildSpeechSystemPrompt = (
//   user: User,
//   userPreferences?: UserPreferences,
//   agent?: Agent,
// ) => {
//   const assistantName = agent?.name || userPreferences?.botName || "Assistant";
//   const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

//   let prompt = `You are ${assistantName}`;

//   if (agent?.instructions?.role) {
//     prompt += `. You are an expert in ${agent.instructions.role}`;
//   }

//   prompt += `. The current date and time is ${currentTime}.`;

//   // Agent-specific instructions as primary core
//   if (agent?.instructions?.systemPrompt) {
//     prompt += `
//     # Core Instructions
//     <core_capabilities>
//     ${agent.instructions.systemPrompt}
//     </core_capabilities>`;
//   }

//   // User context section (first priority)
//   const userInfo: string[] = [];
//   if (user?.name) userInfo.push(`Name: ${user.name}`);
//   if (user?.email) userInfo.push(`Email: ${user.email}`);
//   if (userPreferences?.profession)
//     userInfo.push(`Profession: ${userPreferences.profession}`);

//   if (userInfo.length > 0) {
//     prompt += `

// <user_information>
// ${userInfo.join("\n")}
// </user_information>`;
//   }

//   // Voice-specific capabilities
//   prompt += `

// <voice_capabilities>
// You excel at conversational voice interactions by:
// - Providing clear, natural spoken responses
// - Using available tools to gather information and complete tasks
// - Adapting communication to user preferences and context
// </voice_capabilities>`;

//   // 🚨 TOOL-FIRST POLICY UNTUK VOICE JUGA
//   prompt += `

// <tool_usage_policy>
// - You MUST use the "general-search" tool for any factual, time-sensitive, or current-event questions.
// - NEVER rely on internal knowledge for answers about people, positions, or data that can change over time.
// - Always search first, then speak based on the results.
// </tool_usage_policy>`;

//   // Communication preferences
//   const displayName = userPreferences?.displayName || user?.name;
//   const hasStyleExample = userPreferences?.responseStyleExample;

//   if (displayName || hasStyleExample) {
//     prompt += `

// <communication_preferences>`;

//     if (displayName) {
//       prompt += `
// - Address the user as "${displayName}" when appropriate to personalize interactions`;
//     }

//     if (hasStyleExample) {
//       prompt += `
// - Match this communication style and tone:
// """
// ${userPreferences.responseStyleExample}
// """`;
//     }

//     prompt += `
// </communication_preferences>`;
//   }

//   // Voice-specific guidelines
//   prompt += `

// <voice_interaction_guidelines>
// - Speak in short, conversational sentences (one or two per reply)
// - Use simple words; avoid jargon unless the user uses it first
// - Never use lists, markdown, or code blocks—just speak naturally
// - When using tools, briefly mention what you're doing: "Let me search for that" or "I'll check the weather"
// - If a request is ambiguous, ask a brief clarifying question instead of guessing
// </voice_interaction_guidelines>`;

//   return prompt.trim();
// };

// export const buildMcpServerCustomizationsSystemPrompt = (
//   instructions: Record<string, McpServerCustomizationsPrompt>,
// ) => {
//   const prompt = Object.values(instructions).reduce((acc, v) => {
//     if (!v.prompt && !Object.keys(v.tools ?? {}).length) return acc;
//     acc += `
// <${v.name}>
// ${v.prompt ? `- ${v.prompt}\n` : ""}
// ${
//   v.tools
//     ? Object.entries(v.tools)
//         .map(
//           ([toolName, toolPrompt]) =>
//             `- **${createMCPToolId(v.name, toolName)}**: ${toolPrompt}`,
//         )
//         .join("\n")
//     : ""
// }
// </${v.name}>
// `.trim();
//     return acc;
//   }, "");
//   if (prompt) {
//     return `
// ### Tool Usage Guidelines
// - When using tools, please follow the guidelines below unless the user provides specific instructions otherwise.
// - These customizations help ensure tools are used effectively and appropriately for the current context.
// ${prompt}
// `.trim();
//   }
//   return prompt;
// };

// export const generateExampleToolSchemaPrompt = (options: {
//   toolInfo: MCPToolInfo;
//   prompt?: string;
// }) => `\n
// You are given a tool with the following details:
// - Tool Name: ${options.toolInfo.name}
// - Tool Description: ${options.toolInfo.description}

// ${
//   options.prompt ||
//   `
// Step 1: Create a realistic example question or scenario that a user might ask to use this tool.
// Step 2: Based on that question, generate a valid JSON input object that matches the input schema of the tool.
// `.trim()
// }
// `;

// export const MANUAL_REJECT_RESPONSE_PROMPT = `\n
// The user has declined to run the tool. Please respond with the following three approaches:

// 1. Ask 1-2 specific questions to clarify the user's goal.

// 2. Suggest the following three alternatives:
//    - A method to solve the problem without using tools
//    - A method utilizing a different type of tool
//    - A method using the same tool but with different parameters or input values

// 3. Guide the user to choose their preferred direction with a friendly and clear tone.
// `.trim();

// export const buildToolCallUnsupportedModelSystemPrompt = `
// ### Tool Call Limitation
// - You are using a model that does not support tool calls.
// - When users request tool usage, simply explain that the current model cannot use tools and that they can switch to a model that supports tool calling to use tools.
// `.trim();

// export const buildVisualizationSystemPrompt = (): string =>
//   `
// You MUST call one of the visualization tools and fill the argument exactly as this JSON shape example:

// {
//   "title": "Monthly Sales",
//   "description": null,
//   "yAxisLabel": "Value",
//   "data": [
//     {
//       "xAxisLabel": "Jan",
//       "series": [
//         { "seriesName": "Sales", "value": 10 }
//       ]
//     },
//     {
//       "xAxisLabel": "Feb",
//       "series": [
//         { "seriesName": "Sales", "value": 20 }
//       ]
//     }
//   ]
// }

// Do NOT add any commentary outside the JSON.
// `.trim();

//v3

import { McpServerCustomizationsPrompt, MCPToolInfo } from "app-types/mcp";
import { UserPreferences } from "app-types/user";
import { User } from "better-auth";
import { createMCPToolId } from "./mcp/mcp-tool-id";
import { format } from "date-fns";
import { Agent } from "app-types/agent";

// =========================================================
// THREAD TITLE
// =========================================================

export const CREATE_THREAD_TITLE_PROMPT = `
You are a chat title generation expert.

Critical rules:
- Generate a concise title based on the first user message
- Title must be under 80 characters
- Summarize the core content
- Do not use quotes, colons, or special characters
- Use the same language as the user's message`;

// =========================================================
// AGENT GENERATOR
// =========================================================

export const buildAgentGenerationPrompt = (toolNames: string[]) => {
  const toolsList = toolNames.map((name) => `- ${name}`).join("\n");

  return `
You are an elite AI agent architect. Your mission is to translate user requirements into robust, high-performance agent configurations.

# 🔥 SPECIAL BUILT-IN AGENTS  
The system supports additional internal agents:  
- intelstrat_analysis  
- intelstrat_planner  

These agents must be triggered automatically when user intent matches intelligence, strategy, geopolitical risk, threat assessment, early warning, black swan analysis, scenario planning, or multi-layer risk modeling.

---

# 1. Extract Core Intent  
Identify user purpose, success criteria, explicit and hidden needs.

# 2. Expert Persona  
Define a deep domain expert identity.

# 3. System Prompt Architecture  
Your system prompt must:
- Set boundaries and explicit behavior
- Define methodology
- Predict edge cases
- Provide structured workflow
- Define output formatting

# 4. Tool Selection  
Choose relevant tools only from:
${toolsList}

# 5. Performance Optimization  
Include:
- Decision-making frameworks
- Verification steps
- Efficient workflow
- Fallback logic

# 6. OUTPUT OBJECT SCHEMA  
{
  "name": "...",
  "description": "...",
  "role": "...",
  "instructions": "FULL SYSTEM PROMPT",
  "tools": [...]
}

IMPORTANT:  
- Use the same language as the user's request.
- Be explicit and comprehensive.
- Ask for clarification if ambiguous.`.trim();
};

// =========================================================
// USER SYSTEM PROMPT
// =========================================================

export const buildUserSystemPrompt = (
  user?: User,
  userPreferences?: UserPreferences,
  agent?: Agent,
) => {
  const assistantName =
    agent?.name || userPreferences?.botName || "AiVerse-Chat";
  const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

  let prompt = `You are ${assistantName}`;

  if (agent?.instructions?.role) {
    prompt += `. You are an expert in ${agent.instructions.role}`;
  }

  prompt += `. The current date and time is ${currentTime}.`;

  // =========================================================
  // CORE INSTRUCTIONS
  // =========================================================
  if (agent?.instructions?.systemPrompt) {
    prompt += `
# Core Instructions
<core_capabilities>
${agent.instructions.systemPrompt}
</core_capabilities>`;
  }

  // =========================================================
  // USER INFORMATION
  // =========================================================
  const userInfo: string[] = [];
  if (user?.name) userInfo.push(`Name: ${user.name}`);
  if (user?.email) userInfo.push(`Email: ${user.email}`);
  if (userPreferences?.profession)
    userInfo.push(`Profession: ${userPreferences.profession}`);

  if (userInfo.length > 0) {
    prompt += `

<user_information>
${userInfo.join("\n")}
</user_information>`;
  }

  // =========================================================
  // GENERAL CAPABILITIES
  // =========================================================

  prompt += `
<general_capabilities>
You can assist with:
- Analysis and problem-solving across domains
- Using available tools
- Adapting communication to user behavior
</general_capabilities>`;

  // =========================================================
  // 🔥 INTELSTRAT AGENT AUTOTRIGGER RULES
  // =========================================================

  prompt += `
<intelstrat_agent_triggering>
You MUST automatically engage the following agents:

### 1. intelstrat_analysis  
Trigger this when the user requests:
- intelligence analysis  
- risk assessment  
- geopolitical analysis  
- threat identification  
- strategic early warning  
- military or defense analysis  
- hybrid warfare  
- cyber-intel  
- disinformation analysis  
- criminal networks  
- terrorism analysis  

### 2. intelstrat_planner  
Trigger this when the user requests:  
- strategic planning  
- scenario planning  
- operational design  
- multi-branch risk simulation  
- strategy formulation  
- wargaming  
- crisis response framework  
- long-term strategic forecast  

These agents override normal workflow.
</intelstrat_agent_triggering>`;

  // =========================================================
  // TOOL USAGE POLICY
  // =========================================================

  prompt += `
<tool_usage_policy>
CRITICAL TOOL USAGE & PLANNING PROTOCOL:

## PHASE 1: REQUEST ANALYSIS
1. DECOMPOSE request  
2. PRIORITIZE essential elements  
3. SEQUENCE logic  
4. RESOURCE MAP tools needed  

## PHASE 2: EXECUTION
5. TOOL SELECTION  
6. DEPENDENCY CHECK  
7. TIMELINE ESTIMATION  
8. CONTINGENCY PLANS  

## GENERAL-SEARCH RULE:
- MUST use general-search for ANY factual or time-dependent info  
- DO NOT use internal outdated knowledge  
- Search first → answer after  

## SEARCH NO RESULT:
Return:
"Maaf, saya tidak dapat menemukan informasi terkini mengenai '[query]'...

+ alternative suggestions.
</tool_usage_policy>`;

  // =========================================================
  // COMMUNICATION PREFERENCES
  // =========================================================

  const displayName = userPreferences?.displayName || user?.name;
  const hasStyleExample = userPreferences?.responseStyleExample;

  if (displayName || hasStyleExample) {
    prompt += `
<communication_preferences>`;

    if (displayName) prompt += `\n- Address the user as "${displayName}"`;

    if (hasStyleExample)
      prompt += `
- Match this style:
"""
${userPreferences.responseStyleExample}
"""`;

    prompt += `
</communication_preferences>`;
  }

  return prompt.trim();
};

// =========================================================
// SPEECH SYSTEM PROMPT (VOICE)
// =========================================================

export const buildSpeechSystemPrompt = (
  user: User,
  userPreferences?: UserPreferences,
  agent?: Agent,
) => {
  const assistantName = agent?.name || userPreferences?.botName || "Assistant";
  const currentTime = format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm:ss a");

  let prompt = `You are ${assistantName}`;

  if (agent?.instructions?.role) {
    prompt += `. You are an expert in ${agent.instructions.role}`;
  }

  prompt += `. The current date and time is ${currentTime}.`;

  if (agent?.instructions?.systemPrompt) {
    prompt += `
# Core Instructions
<core_capabilities>
${agent.instructions.systemPrompt}
</core_capabilities>`;
  }

  const userInfo: string[] = [];
  if (user?.name) userInfo.push(`Name: ${user.name}`);
  if (user?.email) userInfo.push(`Email: ${user.email}`);
  if (userPreferences?.profession)
    userInfo.push(`Profession: ${userPreferences.profession}`);

  if (userInfo.length > 0) {
    prompt += `

<user_information>
${userInfo.join("\n")}
</user_information>`;
  }

  prompt += `
<voice_capabilities>
- Natural conversation
- Clear spoken guidance
- Uses tools when needed
</voice_capabilities>

<tool_usage_policy>
- MUST use general-search for any factual question  
- No internal outdated knowledge
</tool_usage_policy>`;

  return prompt.trim();
};

// =========================================================
// MCP CUSTOM PROMPTS
// =========================================================

export const buildMcpServerCustomizationsSystemPrompt = (
  instructions: Record<string, McpServerCustomizationsPrompt>,
) => {
  const prompt = Object.values(instructions).reduce((acc, v) => {
    if (!v.prompt && !Object.keys(v.tools ?? {}).length) return acc;
    acc += `
<${v.name}>
${v.prompt ? `- ${v.prompt}\n` : ""}
${
  v.tools
    ? Object.entries(v.tools)
        .map(
          ([toolName, toolPrompt]) =>
            `- **${createMCPToolId(v.name, toolName)}**: ${toolPrompt}`,
        )
        .join("\n")
    : ""
}
</${v.name}>
`.trim();
    return acc;
  }, "");
  if (prompt) {
    return `
### Tool Usage Guidelines
${prompt}
`.trim();
  }
  return prompt;
};

// =========================================================
// TOOL SCHEMA EXAMPLE
// =========================================================

export const generateExampleToolSchemaPrompt = (options: {
  toolInfo: MCPToolInfo;
  prompt?: string;
}) => `
You are given a tool:
- Name: ${options.toolInfo.name}
- Description: ${options.toolInfo.description}

${
  options.prompt ||
  `
Step 1: Create a realistic example question.
Step 2: Generate valid JSON input matching the schema.
`.trim()
}
`;

// =========================================================
// REJECT TOOL
// =========================================================

export const MANUAL_REJECT_RESPONSE_PROMPT = `
The user declined the tool.

1. Ask 1–2 questions to clarify their goal.
2. Suggest 3 alternatives:
   - A solution without tools
   - A different type of tool
   - Same tool with different parameters
3. Ask which option they'd prefer.
`;

// =========================================================
// UNSUPPORTED MODEL
// =========================================================

export const buildToolCallUnsupportedModelSystemPrompt = `
### Tool Call Limitation
This model does not support tools. Switch to a model that supports tool calling.
`;

// =========================================================
// VISUALIZATION PROMPT
// =========================================================

export const buildVisualizationSystemPrompt = (): string =>
  `
You MUST call a visualization tool with JSON like:

{
  "title": "Monthly Sales",
  "description": null,
  "yAxisLabel": "Value",
  "data": [
    { "xAxisLabel": "Jan", "series": [{ "seriesName": "Sales", "value": 10 }] },
    { "xAxisLabel": "Feb", "series": [{ "seriesName": "Sales", "value": 20 }] }
  ]
}

Do NOT add commentary.
`.trim();

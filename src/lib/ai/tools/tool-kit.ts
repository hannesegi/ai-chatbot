import { createPieChartTool } from "./visualization/create-pie-chart";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createTableTool } from "./visualization/create-table";
import { exaSearchTool, exaContentsTool } from "./web/web-search";
import { ragDocumentTool } from "./documents/qdrant-searcher"; // Import RAG tools
import { AppDefaultToolkit, DefaultToolName } from ".";
import { generalSearchTool } from "./web/general-search";
import { Tool } from "ai";
import { strategicIntelligenceTool } from "./agent/agent_stratin";
import { httpFetchTool } from "./http/fetch";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";

export const APP_DEFAULT_TOOL_KIT: Record<
  AppDefaultToolkit,
  Record<string, Tool>
> = {
  [AppDefaultToolkit.Visualization]: {
    [DefaultToolName.CreatePieChart]: createPieChartTool,
    [DefaultToolName.CreateBarChart]: createBarChartTool,
    [DefaultToolName.CreateLineChart]: createLineChartTool,
    [DefaultToolName.CreateTable]: createTableTool,
  },
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.WebSearch]: exaSearchTool,
    [DefaultToolName.WebContent]: exaContentsTool,
  },
  [AppDefaultToolkit.Http]: {
    [DefaultToolName.Http]: httpFetchTool,
  },
  [AppDefaultToolkit.Code]: {
    [DefaultToolName.JavascriptExecution]: jsExecutionTool,
    [DefaultToolName.PythonExecution]: pythonExecutionTool,
  },
  [AppDefaultToolkit.Doct]: {
    [DefaultToolName.DocumentSearch]: ragDocumentTool,
    // [DefaultToolName.DocumentSearch]: ragDocumentToolForWorkflow,
  },
  [AppDefaultToolkit.GenSearch]: {
    [DefaultToolName.GeneralSearch]: generalSearchTool,
  },
  [AppDefaultToolkit.Agent]: {
    [DefaultToolName.AgentStratin]: strategicIntelligenceTool,
  },
};

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPlugin } from "../http-client.js";

export function registerProjectTools(server: McpServer): void {
  server.tool(
    "project_intel",
    `Get project context, dependencies, and file structure from IntelliJ via Project Intelligence Bridge plugin (port 9885).

Actions:
  status       — Check if Project Intelligence is running
  context      — Full project snapshot (SDK, frameworks, deps, VCS state)
  dependencies — Project dependency tree
  file_tree    — Source/test/resource file classification
  frameworks   — Detected frameworks and versions
  summary      — LLM-optimized text summary
  refresh      — Force refresh cached data`,
    {
      action: z.enum(["status", "context", "dependencies", "file_tree", "frameworks", "summary", "refresh"]).describe("Action to perform"),
    },
    async ({ action }) => {
      let result;

      switch (action) {
        case "status":
          result = await callPlugin("project-intelligence", "/api/status");
          break;
        case "context":
          result = await callPlugin("project-intelligence", "/api/v1/context");
          break;
        case "dependencies":
          result = await callPlugin("project-intelligence", "/api/v1/dependencies");
          break;
        case "file_tree":
          result = await callPlugin("project-intelligence", "/api/v1/file-tree");
          break;
        case "frameworks":
          result = await callPlugin("project-intelligence", "/api/v1/framework-hints");
          break;
        case "summary":
          result = await callPlugin("project-intelligence", "/api/v1/summary");
          break;
        case "refresh":
          result = await callPlugin("project-intelligence", "/api/v1/context/refresh", { method: "POST" });
          break;
        default:
          result = { error: `Unknown action: ${action}` };
      }

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}

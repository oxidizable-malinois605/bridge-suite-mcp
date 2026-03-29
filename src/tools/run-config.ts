import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPlugin, jsonBody } from "../http-client.js";

export function registerRunConfigTools(server: McpServer): void {
  server.tool(
    "run_config",
    `Manage IntelliJ run configurations via Run Configuration Bridge plugin (port 9877).

Actions:
  status       — Server health and info
  list         — List all run configurations (optional type/query filters)
  types        — List available configuration types
  details      — Get details for a configuration (id required)
  run          — Start a run configuration (id required)
  debug        — Start with debugger (id required, Pro)
  stop         — Stop a running process (id required)
  restart      — Restart a process (id required, Pro)
  processes    — List all running/tracked processes
  process_info — Get process details (id required)
  output       — Read process output (id required, Pro)
  wait         — Wait for process to terminate (id required, Pro)
  env          — Get environment variables (id required, Pro)
  refresh      — Force cache refresh`,
    {
      action: z.enum([
        "status", "list", "types", "details", "run", "debug", "stop", "restart",
        "processes", "process_info", "output", "wait", "env", "refresh"
      ]).describe("Action to perform"),
      id: z.string().optional().describe("Configuration ID or Process ID"),
      type: z.string().optional().describe("Filter by config type (for list)"),
      query: z.string().optional().describe("Search by name (for list)"),
      running: z.boolean().optional().describe("Only running configs (for list)"),
      max_lines: z.number().optional().describe("Max output lines (for output, default: 200)"),
      timeout: z.number().optional().describe("Wait timeout ms (for wait, default: 30000)"),
      force: z.boolean().optional().describe("Force stop (for stop)"),
    },
    async ({ action, id, type, query, running, max_lines, timeout, force }) => {
      let result;

      switch (action) {
        case "status":
          result = await callPlugin("run-config-bridge", "/api/status");
          break;
        case "list": {
          const params = new URLSearchParams();
          if (type) params.set("type", type);
          if (query) params.set("q", query);
          if (running) params.set("running", "true");
          const qs = params.toString();
          result = await callPlugin("run-config-bridge", `/api/v1/configurations${qs ? `?${qs}` : ""}`);
          break;
        }
        case "types":
          result = await callPlugin("run-config-bridge", "/api/v1/configurations/types");
          break;
        case "details":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/configurations/${enc(id)}`);
          break;
        case "run":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/configurations/${enc(id)}/run`, jsonBody({}));
          break;
        case "debug":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/configurations/${enc(id)}/debug`, jsonBody({}));
          break;
        case "stop":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/processes/${enc(id)}/stop${force ? "?force=true" : ""}`, { method: "POST" });
          break;
        case "restart":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/processes/${enc(id)}/restart`, { method: "POST" });
          break;
        case "processes":
          result = await callPlugin("run-config-bridge", "/api/v1/processes");
          break;
        case "process_info":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/processes/${enc(id)}`);
          break;
        case "output":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/processes/${enc(id)}/output?maxLines=${max_lines || 200}`);
          break;
        case "wait":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/processes/${enc(id)}/wait?timeout=${timeout || 30000}`);
          break;
        case "env":
          if (!id) return err("id required");
          result = await callPlugin("run-config-bridge", `/api/v1/configurations/${enc(id)}/env?reveal=true`);
          break;
        case "refresh":
          result = await callPlugin("run-config-bridge", "/api/v1/refresh", { method: "POST" });
          break;
        default:
          result = { error: `Unknown action: ${action}` };
      }

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}

const enc = encodeURIComponent;
const err = (msg: string) => ({ content: [{ type: "text" as const, text: JSON.stringify({ error: msg }) }] });

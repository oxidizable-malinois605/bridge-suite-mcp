import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPlugin, jsonBody } from "../http-client.js";

export function registerTerminalTools(server: McpServer): void {
  server.tool(
    "terminal",
    `Manage IntelliJ terminal tabs via Terminal Bridge plugin (port 9876).

Actions:
  status  — Server health and info
  list    — List all terminal tabs
  read    — Read recent output from a terminal (id required)
  send    — Send command to a terminal (id, command required)
  create  — Create new terminal tab (Pro)
  close   — Close a terminal tab (id required, Pro)
  focus   — Focus a terminal tab in IDE (id required, Pro)
  rename  — Rename a terminal tab (id, name required, Pro)`,
    {
      action: z.enum(["status", "list", "read", "send", "create", "close", "focus", "rename"]).describe("Action to perform"),
      id: z.string().optional().describe("Terminal ID"),
      command: z.string().optional().describe("Command to send (for send action)"),
      execute: z.boolean().optional().describe("Press Enter after command (default: true)"),
      name: z.string().optional().describe("Terminal name (for create/rename)"),
      working_directory: z.string().optional().describe("Working directory (for create)"),
      max_lines: z.number().optional().describe("Max output lines (for read, default: 100)"),
    },
    async ({ action, id, command, execute, name, working_directory, max_lines }) => {
      let result;

      switch (action) {
        case "status":
          result = await callPlugin("terminal-bridge", "/api/status");
          break;
        case "list":
          result = await callPlugin("terminal-bridge", "/api/terminals");
          break;
        case "read":
          if (!id) return err("id required for read");
          result = await callPlugin("terminal-bridge", `/api/terminals/${enc(id)}/output?maxLines=${max_lines || 100}`);
          break;
        case "send":
          if (!id) return err("id required for send");
          if (!command) return err("command required for send");
          result = await callPlugin("terminal-bridge", `/api/terminals/${enc(id)}/send`, jsonBody({
            command, execute: execute ?? true
          }));
          break;
        case "create":
          result = await callPlugin("terminal-bridge", "/api/terminals", jsonBody({
            name: name || undefined, workingDirectory: working_directory || undefined
          }));
          break;
        case "close":
          if (!id) return err("id required for close");
          result = await callPlugin("terminal-bridge", `/api/terminals/${enc(id)}`, { method: "DELETE" });
          break;
        case "focus":
          if (!id) return err("id required for focus");
          result = await callPlugin("terminal-bridge", `/api/terminals/${enc(id)}/focus`, { method: "POST" });
          break;
        case "rename":
          if (!id) return err("id required for rename");
          if (!name) return err("name required for rename");
          result = await callPlugin("terminal-bridge", `/api/terminals/${enc(id)}/rename`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
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

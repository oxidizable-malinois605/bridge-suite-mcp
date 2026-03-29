import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBridgeStatusTool } from "./bridge-status.js";
import { registerTerminalTools } from "./terminal.js";
import { registerRunConfigTools } from "./run-config.js";
import { registerNotifyTools } from "./notify.js";
import { registerProjectTools } from "./project.js";

export function registerAllTools(server: McpServer): void {
  registerBridgeStatusTool(server);
  registerTerminalTools(server);
  registerRunConfigTools(server);
  registerNotifyTools(server);
  registerProjectTools(server);
}

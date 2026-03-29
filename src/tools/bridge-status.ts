import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discoverPlugins } from "../discovery.js";

export function registerBridgeStatusTool(server: McpServer): void {
  server.tool(
    "bridge_status",
    `Check which LLITD Bridge Suite plugins are running in IntelliJ IDEA.
Returns status, version, license info, and install URLs for each plugin.
Call this first to see what's available before using other tools.`,
    {},
    async () => {
      const statuses = await discoverPlugins();
      const result: Record<string, unknown> = {};

      for (const [id, status] of statuses) {
        result[id] = {
          name: status.name,
          running: status.running,
          port: status.port,
          version: status.version || null,
          licensed: status.licensed ?? null,
          marketplaceUrl: status.marketplaceUrl,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}

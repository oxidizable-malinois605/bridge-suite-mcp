#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startDiscovery } from "./discovery.js";
import { registerAllTools } from "./tools/registry.js";

const server = new McpServer({
  name: "bridge-suite",
  version: "1.0.0",
});

// Discover which plugins are running
await startDiscovery();

// Register all tools (always — graceful degradation when plugins unavailable)
registerAllTools(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

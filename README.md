# Bridge Suite MCP Server

**Give AI agents full access to your IntelliJ IDE.**

Bridge Suite is a free, open-source [MCP](https://modelcontextprotocol.io) server that connects AI coding assistants to IntelliJ IDEA through four specialized plugins. Run commands in terminals, trigger builds, push notifications into the IDE, and query project context — all through a single MCP server.

Works with **Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, **Cline**, **Continue**, and any MCP-compatible client.

---

## Why Bridge Suite?

JetBrains' built-in MCP server handles file operations and basic code inspection, but it doesn't expose what makes IntelliJ powerful for AI workflows:

| Capability | JetBrains Built-in | Bridge Suite |
|---|:---:|:---:|
| Read/write files | Yes | - |
| Run terminal commands with live output | - | **Yes** |
| Trigger specific run configurations | - | **Yes** |
| Push notifications into the IDE | - | **Yes** |
| Show progress bars for long tasks | - | **Yes** |
| Get full project context (SDK, frameworks, deps) | - | **Yes** |
| Stream real-time output via WebSocket | - | **Yes** |
| Multi-terminal management | - | **Yes** |

Bridge Suite and the built-in MCP are **complementary** — install both for complete IDE control.

---

## Quick Start

### 1. Install the MCP server

Add to your MCP client configuration:

**Claude Code** (`.mcp.json`):
```json
{
  "mcpServers": {
    "bridge-suite": {
      "command": "npx",
      "args": ["-y", "@llitd/bridge-suite-mcp"]
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "bridge-suite": {
      "command": "npx",
      "args": ["-y", "@llitd/bridge-suite-mcp"]
    }
  }
}
```

**Cursor** (Settings > MCP Servers):
```
Name: bridge-suite
Command: npx -y @llitd/bridge-suite-mcp
```

### 2. Install at least one plugin

The MCP server connects to plugins running inside IntelliJ. Install them from the [JetBrains Marketplace](https://plugins.jetbrains.com/organization/llitd):

| Plugin | What It Does | Free Tier | Marketplace |
|---|---|---|---|
| [**Terminal Bridge**](https://plugins.jetbrains.com/plugin/30660-terminal-bridge) | List, create, send commands to IDE terminals | List, read, send | [Install](https://plugins.jetbrains.com/plugin/30660-terminal-bridge) |
| **Run Configuration Bridge** | Execute run/debug configs, track processes | List, run | Install |
| **Notification Bridge** | Push notifications, progress bars, status widgets | Send notifications, history | Install |
| **Project Intelligence** | Project context, dependencies, frameworks | Full context snapshot | Install |

Each plugin runs a lightweight HTTP server on localhost. The MCP server auto-discovers which plugins are running.

### 3. Verify

Ask your AI assistant:

> "Check which Bridge Suite plugins are available"

It will call `bridge_status` and show you what's running.

---

## Tools

### `bridge_status`

Check which plugins are installed, running, and licensed. **Call this first** to see what's available.

```
bridge_status()
```

Returns:
```json
{
  "terminal-bridge": {
    "name": "Terminal Bridge",
    "running": true,
    "version": "2.4.2",
    "licensed": true
  },
  "notification-bridge": {
    "name": "Notification Bridge",
    "running": true,
    "version": "1.0.0",
    "licensed": false
  },
  ...
}
```

---

### `terminal` — Terminal Bridge

Manage IntelliJ terminal tabs. Create terminals, send commands, read output.

| Action | Description | Tier |
|---|---|---|
| `status` | Plugin health | Free |
| `list` | List all terminal tabs | Free |
| `read` | Read recent output (`id` required) | Free |
| `send` | Send command to terminal (`id`, `command` required) | Free |
| `create` | Create new terminal tab | Pro |
| `close` | Close terminal tab (`id` required) | Pro |
| `focus` | Focus terminal in IDE (`id` required) | Pro |
| `rename` | Rename terminal tab (`id`, `name` required) | Pro |

**Examples:**

```
// List terminals
terminal({ action: "list" })

// Run a command
terminal({ action: "send", id: "terminal-1", command: "npm test" })

// Read output
terminal({ action: "read", id: "terminal-1", max_lines: 50 })
```

---

### `run_config` — Run Configuration Bridge

Execute IntelliJ run/debug configurations. Start builds, run tests, launch servers — any run config defined in your project.

| Action | Description | Tier |
|---|---|---|
| `status` | Plugin health | Free |
| `list` | List all run configurations | Free |
| `types` | List configuration types | Free |
| `details` | Get config details (`id` required) | Free |
| `run` | Start a configuration (`id` required) | Free |
| `processes` | List running processes | Free |
| `debug` | Start with debugger (`id` required) | Pro |
| `stop` | Stop process (`id` required) | Pro |
| `restart` | Restart process (`id` required) | Pro |
| `output` | Read process output (`id` required) | Pro |
| `wait` | Wait for process to finish (`id` required) | Pro |
| `env` | Get environment variables (`id` required) | Pro |
| `refresh` | Force cache refresh | Pro |

**Examples:**

```
// List all run configurations
run_config({ action: "list" })

// Run "Backend Server" configuration
run_config({ action: "run", id: "backend-server" })

// Check process output
run_config({ action: "output", id: "process-1", max_lines: 100 })
```

---

### `notify` — Notification Bridge

Push notifications, progress bars, and status bar widgets directly into the IDE. Perfect for long-running AI tasks, CI/CD results, or monitoring alerts.

| Action | Description | Tier |
|---|---|---|
| `status` | Plugin health | Free |
| `channels` | List notification channels | Free |
| `send` | Send balloon notification (`title`, `content` required) | Free |
| `history` | Read notification history | Free |
| `sticky` | Sticky notification (stays until dismissed) | Pro |
| `action` | Notification with clickable buttons | Pro |
| `channel_create` | Register notification channel | Pro |
| `channel_delete` | Remove channel (`id` required) | Pro |
| `progress_create` | Create IDE progress bar (`title` required) | Pro |
| `progress_update` | Update progress (`id`, `fraction` required) | Pro |
| `progress_complete` | Complete/cancel progress bar (`id` required) | Pro |
| `statusbar_create` | Create status bar widget (`id`, `text` required) | Pro |
| `statusbar_update` | Update widget text (`id` required) | Pro |
| `statusbar_remove` | Remove widget (`id` required) | Pro |

**Examples:**

```
// Send a notification
notify({ action: "send", title: "Build Complete", content: "All 42 tests pass", type: "INFORMATION" })

// Warning notification
notify({ action: "send", title: "Memory High", content: "Heap usage at 89%", type: "WARNING" })

// Create a progress bar (Pro)
notify({ action: "progress_create", title: "Deploying to Production", fraction: 0.0 })

// Update progress
notify({ action: "progress_update", id: "abc123", text: "Stage 2/3", fraction: 0.66 })

// Complete it
notify({ action: "progress_complete", id: "abc123" })

// Notification with action buttons (Pro)
notify({
  action: "action",
  title: "PR #42 Ready",
  content: "All checks pass. Merge?",
  type: "INFORMATION",
  actions: [
    { label: "Open PR", id: "open", url: "https://github.com/org/repo/pull/42" },
    { label: "Merge", id: "merge" }
  ]
})

// Status bar widget (Pro)
notify({ action: "statusbar_create", id: "api-health", text: "API: 200ms", tooltip: "Average response time" })
```

---

### `project_intel` — Project Intelligence Bridge

Get rich project context — SDK version, detected frameworks, dependency tree, file structure. Useful for AI agents that need to understand the project before making changes.

| Action | Description | Tier |
|---|---|---|
| `status` | Plugin health | Free |
| `context` | Full project snapshot (SDK, frameworks, VCS, deps) | Free |
| `dependencies` | Dependency tree with conflicts | Free |
| `file_tree` | Source/test/resource file classification | Free |
| `frameworks` | Detected frameworks and versions | Free |
| `summary` | LLM-optimized text summary | Free |
| `refresh` | Force refresh cached data | Free |

**Examples:**

```
// Get full project context
project_intel({ action: "context" })

// Quick summary for LLM context windows
project_intel({ action: "summary" })

// Check frameworks
project_intel({ action: "frameworks" })
```

---

## Architecture

```
┌──────────────────────────────────┐
│   AI Assistant (Claude, Cursor)  │
│   Uses MCP tools to control IDE  │
└──────────────┬───────────────────┘
               │ MCP Protocol (stdio)
┌──────────────▼───────────────────┐
│   Bridge Suite MCP Server        │
│   Free, open-source (this repo)  │
│   Auto-discovers running plugins │
└──────────────┬───────────────────┘
               │ HTTP (localhost)
   ┌───────────┼───────────┬───────────────┐
   ▼           ▼           ▼               ▼
┌──────┐  ┌──────┐   ┌──────────┐   ┌──────────┐
│:9876 │  │:9877 │   │  :9878   │   │  :9885   │
│Term  │  │ Run  │   │  Notif   │   │  Project │
│Bridge│  │Config│   │  Bridge  │   │  Intel   │
└──┬───┘  └──┬───┘   └────┬─────┘   └────┬─────┘
   │         │            │              │
   └─────────┴────────────┴──────────────┘
                    │
          IntelliJ IDEA (IDE APIs)
```

Each plugin runs an embedded HTTP server on localhost. The MCP server probes ports to discover which plugins are available. If a plugin isn't installed, its tools return a helpful message with an install link.

**Security:** Everything runs on localhost. No data leaves your machine. No authentication needed for local-only access.

---

## Plugin Availability

When a tool targets a plugin that isn't running, you get a clear message:

```json
{
  "success": false,
  "error": "Notification Bridge is not running. Install it from JetBrains Marketplace: https://plugins.jetbrains.com/plugin/XXXXX-notification-bridge — then restart IntelliJ IDEA.",
  "code": "PLUGIN_NOT_AVAILABLE"
}
```

When a tool requires a paid feature on the free tier:

```json
{
  "success": false,
  "error": "This feature requires a paid Notification Bridge license. Upgrade at: https://plugins.jetbrains.com/plugin/XXXXX-notification-bridge",
  "code": "LICENSE_REQUIRED"
}
```

---

## Configuration

### Custom Ports

If your plugins run on non-standard ports, set environment variables:

```bash
TERMINAL_BRIDGE_PORT=9876       # default
RUN_CONFIG_BRIDGE_PORT=9877     # default
NOTIFICATION_BRIDGE_PORT=9878   # default
PROJECT_INTELLIGENCE_PORT=9885  # default
```

### Plugin Settings

Each plugin has its own settings in IntelliJ: **Settings > Tools > [Plugin Name]**

Common settings across all plugins:
- **Port** — HTTP server port
- **Auto-start** — Start server when IDE opens
- **CORS Origins** — Allowed origins for cross-origin requests

---

## Use Cases

### AI-Driven Development Workflow

```
1. project_intel({ action: "context" })     → Understand the project
2. terminal({ action: "send", ... })        → Run commands
3. run_config({ action: "run", ... })       → Build/test
4. run_config({ action: "output", ... })    → Check results
5. notify({ action: "send", ... })          → Report completion
```

### CI/CD Notification Pipeline

```
1. notify({ action: "channel_create", id: "ci", name: "CI Pipeline" })
2. notify({ action: "progress_create", title: "Deploying v2.1" })
3. notify({ action: "progress_update", id: "...", fraction: 0.5 })
4. notify({ action: "progress_complete", id: "..." })
5. notify({ action: "action", title: "Deploy Complete", actions: [...] })
```

### Multi-Terminal Orchestration

```
1. terminal({ action: "create", name: "backend" })
2. terminal({ action: "create", name: "frontend" })
3. terminal({ action: "send", id: "backend", command: "mvn spring-boot:run" })
4. terminal({ action: "send", id: "frontend", command: "npm run dev" })
5. terminal({ action: "read", id: "backend" })  → Check startup
```

---

## Requirements

- **IntelliJ IDEA** 2025.3+ (Ultimate or Community)
- **Node.js** 18+ (for the MCP server)
- At least one Bridge Suite plugin installed

---

## Pricing

The MCP server is **free and open-source** (MIT license).

Each plugin uses a **freemium model** on the JetBrains Marketplace:

| | Personal | Commercial |
|---|---|---|
| Monthly | $1.90/mo | $4.90/mo |
| Annual | $19/yr | $49/yr |

Free tiers include essential read/execute operations. Pro tiers unlock creation, streaming, and advanced features. See the tool tables above for tier details.

JetBrains community programs (students, open-source, startups) provide free licenses.

---

## Development

```bash
git clone https://github.com/llitd/bridge-suite-mcp.git
cd bridge-suite-mcp
npm install
npm run build
```

Run locally:
```bash
node dist/index.js
```

### Project Structure

```
src/
  index.ts              Entry point (stdio transport)
  discovery.ts          Plugin auto-discovery (port probing)
  http-client.ts        Shared HTTP client with error handling
  tools/
    bridge-status.ts    Meta tool: plugin discovery
    terminal.ts         Terminal Bridge proxy
    run-config.ts       Run Configuration Bridge proxy
    notify.ts           Notification Bridge proxy
    project.ts          Project Intelligence Bridge proxy
    registry.ts         Tool registration
```

---

## Links

- [LLITD on JetBrains Marketplace](https://plugins.jetbrains.com/organization/llitd)
- [Terminal Bridge Plugin](https://plugins.jetbrains.com/plugin/30660-terminal-bridge)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Report Issues](https://github.com/llitd/bridge-suite-mcp/issues)

---

## License

MIT — see [LICENSE](LICENSE)

export interface PluginConfig {
  id: string;
  name: string;
  port: number;
  statusPath: string;
  marketplaceUrl: string;
}

export interface PluginStatus extends PluginConfig {
  running: boolean;
  version?: string;
  licensed?: boolean;
  lastChecked: number;
}

export const PLUGINS: PluginConfig[] = [
  {
    id: "terminal-bridge",
    name: "Terminal Bridge",
    port: parseInt(process.env.TERMINAL_BRIDGE_PORT || "9876"),
    statusPath: "/api/status",
    marketplaceUrl: "https://plugins.jetbrains.com/plugin/30660-terminal-bridge",
  },
  {
    id: "run-config-bridge",
    name: "Run Configuration Bridge",
    port: parseInt(process.env.RUN_CONFIG_BRIDGE_PORT || "9877"),
    statusPath: "/api/status",
    marketplaceUrl: "https://plugins.jetbrains.com/plugin/30842-run-configuration-bridge",
  },
  {
    id: "notification-bridge",
    name: "Notification Bridge",
    port: parseInt(process.env.NOTIFICATION_BRIDGE_PORT || "9878"),
    statusPath: "/api/status",
    marketplaceUrl: "https://plugins.jetbrains.com/plugin/30984-notification-bridge",
  },
  {
    id: "project-intelligence",
    name: "Project Intelligence Bridge",
    port: parseInt(process.env.PROJECT_INTELLIGENCE_PORT || "9885"),
    statusPath: "/api/status",
    marketplaceUrl: "https://plugins.jetbrains.com/plugin/30895-project-intelligence-bridge",
  },
];

const pluginStatuses = new Map<string, PluginStatus>();
let lastFullProbe = 0;
const PROBE_INTERVAL = 30_000;

async function probePlugin(config: PluginConfig): Promise<PluginStatus> {
  try {
    const resp = await fetch(`http://localhost:${config.port}${config.statusPath}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!resp.ok) {
      return { ...config, running: false, lastChecked: Date.now() };
    }
    const data = await resp.json();
    const statusData = data.data ?? data;
    return {
      ...config,
      running: true,
      version: statusData.version,
      licensed: statusData.licensed,
      lastChecked: Date.now(),
    };
  } catch {
    return { ...config, running: false, lastChecked: Date.now() };
  }
}

export async function discoverPlugins(): Promise<Map<string, PluginStatus>> {
  const now = Date.now();
  if (now - lastFullProbe < PROBE_INTERVAL && pluginStatuses.size > 0) {
    return pluginStatuses;
  }

  const results = await Promise.all(PLUGINS.map(probePlugin));
  for (const status of results) {
    pluginStatuses.set(status.id, status);
  }
  lastFullProbe = now;
  return pluginStatuses;
}

export function getPluginStatus(id: string): PluginStatus | undefined {
  return pluginStatuses.get(id);
}

export function getPluginConfig(id: string): PluginConfig | undefined {
  return PLUGINS.find((p) => p.id === id);
}

export async function startDiscovery(): Promise<void> {
  await discoverPlugins();
}

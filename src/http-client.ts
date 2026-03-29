import { getPluginStatus, getPluginConfig, type PluginConfig } from "./discovery.js";

export interface PluginResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export async function callPlugin<T = unknown>(
  pluginId: string,
  path: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<PluginResponse<T>> {
  const status = getPluginStatus(pluginId);
  const config = getPluginConfig(pluginId);

  if (!status || !status.running) {
    return {
      success: false,
      error: pluginNotAvailableMessage(pluginId, config),
      code: "PLUGIN_NOT_AVAILABLE",
    };
  }

  const url = `http://localhost:${status.port}${path}`;

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      ...options,
    });

    if (resp.status === 402) {
      return {
        success: false,
        error: `This feature requires a paid ${config?.name || pluginId} license. Upgrade at: ${config?.marketplaceUrl || "JetBrains Marketplace"}`,
        code: "LICENSE_REQUIRED",
      };
    }

    if (!resp.ok) {
      const text = await resp.text();
      return {
        success: false,
        error: `HTTP ${resp.status}: ${text || resp.statusText}`,
        code: "HTTP_ERROR",
      };
    }

    return await resp.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Connection failed: ${message}. Is IntelliJ running with ${config?.name || pluginId}?`,
      code: "CONNECTION_ERROR",
    };
  }
}

function pluginNotAvailableMessage(pluginId: string, config?: PluginConfig): string {
  if (config) {
    return `${config.name} is not running. Install it from JetBrains Marketplace: ${config.marketplaceUrl} — then restart IntelliJ IDEA.`;
  }
  return `Plugin '${pluginId}' is not available. Ensure IntelliJ IDEA is running with the plugin installed.`;
}

export function jsonBody(data: Record<string, unknown>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

export function jsonPut(data: Record<string, unknown>): RequestInit {
  return {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

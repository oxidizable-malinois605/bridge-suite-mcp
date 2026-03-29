import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callPlugin, jsonBody, jsonPut } from "../http-client.js";

export function registerNotifyTools(server: McpServer): void {
  server.tool(
    "notify",
    `Push notifications, progress bars, and status bar widgets into IntelliJ IDE via Notification Bridge plugin (port 9878).

Actions:
  status           — Check if Notification Bridge is running
  channels         — List notification channels
  send             — Send balloon notification (title, content required)
  sticky           — Send sticky notification (Pro, stays until dismissed)
  action           — Send notification with action buttons (Pro, actions required)
  history          — Read notification history
  channel_create   — Register a notification channel (Pro)
  channel_delete   — Remove a channel (Pro, id required)
  progress_create  — Create a progress bar (Pro, title required)
  progress_update  — Update progress bar (Pro, id required)
  progress_complete — Complete/cancel progress bar (Pro, id required)
  statusbar_create — Create status bar widget (Pro, id + text required)
  statusbar_update — Update status bar widget (Pro, id required)
  statusbar_remove — Remove status bar widget (Pro, id required)`,
    {
      action: z.enum([
        "status", "channels", "send", "sticky", "action", "history",
        "channel_create", "channel_delete",
        "progress_create", "progress_update", "progress_complete",
        "statusbar_create", "statusbar_update", "statusbar_remove"
      ]).describe("Action to perform"),
      title: z.string().optional().describe("Notification/progress title"),
      content: z.string().optional().describe("Notification body text"),
      type: z.enum(["INFORMATION", "WARNING", "ERROR"]).optional().describe("Notification type"),
      channel: z.string().optional().describe("Channel ID"),
      id: z.string().optional().describe("ID for update/delete operations"),
      name: z.string().optional().describe("Channel name (for channel_create)"),
      text: z.string().optional().describe("Progress/widget text"),
      fraction: z.number().optional().describe("Progress fraction 0.0-1.0"),
      tooltip: z.string().optional().describe("Widget tooltip"),
      limit: z.number().optional().describe("History limit (default: 50)"),
      navigate_to: z.string().optional().describe("File path to open on click"),
      actions: z.array(z.object({
        label: z.string(),
        id: z.string(),
        url: z.string().optional(),
      })).optional().describe("Action buttons for notification"),
    },
    async (params) => {
      const { action, title, content: body, type, channel, id, name, text, fraction, tooltip, limit, navigate_to, actions } = params;
      let result;

      switch (action) {
        case "status":
          result = await callPlugin("notification-bridge", "/api/status");
          break;
        case "channels":
          result = await callPlugin("notification-bridge", "/api/channels");
          break;
        case "send":
          if (!title || !body) return err("title and content required");
          result = await callPlugin("notification-bridge", "/api/notifications", jsonBody({
            title, content: body, type: type || "INFORMATION", channel, navigateTo: navigate_to,
          }));
          break;
        case "sticky":
          if (!title || !body) return err("title and content required");
          result = await callPlugin("notification-bridge", "/api/notifications/sticky", jsonBody({
            title, content: body, type: type || "INFORMATION", channel, navigateTo: navigate_to,
          }));
          break;
        case "action":
          if (!title || !body) return err("title and content required");
          if (!actions || actions.length === 0) return err("actions array required");
          result = await callPlugin("notification-bridge", "/api/notifications/action", jsonBody({
            title, content: body, type: type || "INFORMATION", channel, actions, navigateTo: navigate_to,
          }));
          break;
        case "history":
          result = await callPlugin("notification-bridge", `/api/notifications/history?limit=${limit || 50}`);
          break;
        case "channel_create":
          if (!id || !name) return err("id and name required");
          result = await callPlugin("notification-bridge", "/api/channels", jsonBody({
            id, name, icon: undefined, priority: "normal", rateLimit: 10,
          }));
          break;
        case "channel_delete":
          if (!id) return err("id required");
          result = await callPlugin("notification-bridge", `/api/channels/${enc(id)}`, { method: "DELETE" });
          break;
        case "progress_create":
          if (!title) return err("title required");
          result = await callPlugin("notification-bridge", "/api/progress", jsonBody({
            title, text, fraction, cancellable: false, channel,
          }));
          break;
        case "progress_update":
          if (!id) return err("id required");
          result = await callPlugin("notification-bridge", `/api/progress/${enc(id)}`, jsonPut({
            text, fraction,
          }));
          break;
        case "progress_complete":
          if (!id) return err("id required");
          result = await callPlugin("notification-bridge", `/api/progress/${enc(id)}`, { method: "DELETE" });
          break;
        case "statusbar_create":
          if (!id || !text) return err("id and text required");
          result = await callPlugin("notification-bridge", "/api/statusbar", jsonBody({
            id, text, tooltip, alignment: "right",
          }));
          break;
        case "statusbar_update":
          if (!id) return err("id required");
          result = await callPlugin("notification-bridge", `/api/statusbar/${enc(id)}`, jsonPut({
            text, tooltip,
          }));
          break;
        case "statusbar_remove":
          if (!id) return err("id required");
          result = await callPlugin("notification-bridge", `/api/statusbar/${enc(id)}`, { method: "DELETE" });
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

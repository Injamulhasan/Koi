import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

export function initWsServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws) => {
    logger.info("WebSocket client connected");

    ws.on("close", () => {
      logger.info("WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket client error");
    });
  });

  logger.info("WebSocket server initialized at /api/ws");
  return wss;
}

export type WsEventType =
  | "message:new"
  | "message:reaction"
  | "vote:cast"
  | "schedule:updated"
  | "contribution:updated"
  | "lending:new"
  | "lending:updated";

export function broadcast(type: WsEventType, data?: unknown): void {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

import { WebSocketServer, WebSocket } from "ws";
import { logger } from "./logger.js";

let wss = null;

export function initWsServer(server) {
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

export function broadcast(type, data) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, ts: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

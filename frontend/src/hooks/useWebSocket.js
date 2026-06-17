import { useEffect, useRef, useCallback } from "react";

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function useWebSocket(onEvent, enabled = true) {
  const wsRef = useRef(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer = useRef(null);
  const onEventRef = useRef(onEvent);
  const mountedRef = useRef(true);

  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    let wsHost = window.location.host;
    let wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const parsed = new URL(apiUrl);
        wsHost = parsed.host;
        wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      } catch (err) {
        // ignore invalid URL
      }
    }

    const url = `${wsProtocol}//${wsHost}/api/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelay.current = RECONNECT_DELAY_MS;
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEventRef.current(parsed);
      } catch (e) {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(
          reconnectDelay.current * 1.5,
          MAX_RECONNECT_DELAY_MS
        );
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled]);
}
export default useWebSocket;

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types/chat';
import { ChatWebSocket } from '../services/websocket';

export function useWebSocket(scanId: string, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const pendingContentRef = useRef('');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // connectRef lets the onClose closure always call the latest connect()
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (wsRef.current) return;
    if (!scanId || !token) return;

    const ws = new ChatWebSocket();
    wsRef.current = ws;

    ws.connect(scanId, token, {
      onOpen: () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        setIsConnected(true);
      },
      onMessage: (msg) => {
        if (msg.type === 'token') {
          pendingContentRef.current += msg.content;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && last.id === 'streaming') {
              return [...prev.slice(0, -1), { ...last, content: pendingContentRef.current }];
            }
            return [...prev, {
              id: 'streaming',
              role: 'assistant',
              content: pendingContentRef.current,
              created_at: new Date().toISOString(),
            }];
          });
        } else if (msg.type === 'done') {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === 'streaming') {
              return [...prev.slice(0, -1), { ...last, id: crypto.randomUUID() }];
            }
            return prev;
          });
          pendingContentRef.current = '';
          setIsStreaming(false);
        } else if (msg.type === 'error') {
          setIsStreaming(false);
          pendingContentRef.current = '';
          // Show error as a visible message so the user knows what went wrong
          setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${msg.content ?? 'Something went wrong. Please try again.'}`,
            created_at: new Date().toISOString(),
          }]);
        }
      },
      onClose: () => {
        // Only clear ref if this is still the active connection.
        // Prevents a stale onclose (from a previous connection killed by
        // React strict-mode cleanup) from nulling out a newer connection.
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        setIsConnected(false);
        setIsStreaming(false);
        // Auto-reconnect after 2s
        reconnectTimerRef.current = setTimeout(() => {
          connectRef.current();
        }, 2000);
      },
    });
  }, [scanId, token]);

  // Keep connectRef current so the onClose closure always calls the latest version
  connectRef.current = connect;

  const sendMessage = useCallback((content: string) => {
    // Always add user message to UI immediately so it never disappears
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }]);

    console.log('[WS] sendMessage called, wsRef.current:', !!wsRef.current);
    if (!wsRef.current) return;
    setIsStreaming(true);
    pendingContentRef.current = '';
    wsRef.current.sendMessage(content);
    console.log('[WS] Message sent to WebSocket');
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, []);

  return { messages, isConnected, isStreaming, connect, sendMessage, disconnect };
}

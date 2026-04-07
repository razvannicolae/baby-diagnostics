import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types/chat';
import { ChatWebSocket } from '../services/websocket';

export function useWebSocket(scanId: string, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const pendingContentRef = useRef('');

  const connect = useCallback(() => {
    if (wsRef.current) return;

    const ws = new ChatWebSocket();
    wsRef.current = ws;

    ws.connect(scanId, token, {
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
        }
      },
      onClose: () => {
        setIsConnected(false);
      },
    });

    setIsConnected(true);
  }, [scanId, token]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current) return;

    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }]);

    setIsStreaming(true);
    pendingContentRef.current = '';
    wsRef.current.sendMessage(content);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  return { messages, isConnected, isStreaming, connect, sendMessage, disconnect };
}

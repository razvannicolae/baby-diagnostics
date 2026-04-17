import type { WebSocketMessage } from '../types/chat';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: ((msg: WebSocketMessage) => void) | null = null;
  private onError: ((error: Event) => void) | null = null;
  private onClose: (() => void) | null = null;

  connect(scanId: string, token: string, handlers: {
    onOpen?: () => void;
    onMessage: (msg: WebSocketMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  }): void {
    const wsUrl = import.meta.env.VITE_WS_URL;
    const url = `${wsUrl}/ws/chat/${scanId}?token=${token}`;
    console.log('[WS] Connecting to:', url);
    this.ws = new WebSocket(url);
    this.onMessage = handlers.onMessage;
    this.onError = handlers.onError ?? null;
    this.onClose = handlers.onClose ?? null;

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      handlers.onOpen?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as WebSocketMessage;
      console.log('[WS] Message:', data.type, data.content?.slice(0, 50));
      this.onMessage?.(data);
    };

    this.ws.onerror = (event: Event) => {
      console.error('[WS] Error:', event);
      this.onError?.(event);
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('[WS] Closed:', event.code, event.reason);
      this.onClose?.();
    };
  }

  sendMessage(content: string): void {
    console.log('[WS] sendMessage readyState:', this.ws?.readyState, '(OPEN=1)');
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
      console.log('[WS] Sent:', content.slice(0, 50));
    } else {
      console.warn('[WS] Cannot send — WebSocket not open');
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

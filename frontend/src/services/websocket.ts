import type { WebSocketMessage } from '../types/chat';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: ((msg: WebSocketMessage) => void) | null = null;
  private onError: ((error: Event) => void) | null = null;
  private onClose: (() => void) | null = null;

  connect(scanId: string, token: string, handlers: {
    onMessage: (msg: WebSocketMessage) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
  }): void {
    const wsUrl = import.meta.env.VITE_WS_URL;
    this.ws = new WebSocket(`${wsUrl}/ws/chat/${scanId}?token=${token}`);
    this.onMessage = handlers.onMessage;
    this.onError = handlers.onError ?? null;
    this.onClose = handlers.onClose ?? null;

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as WebSocketMessage;
      this.onMessage?.(data);
    };

    this.ws.onerror = (event: Event) => {
      this.onError?.(event);
    };

    this.ws.onclose = () => {
      this.onClose?.();
    };
  }

  sendMessage(content: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', content }));
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

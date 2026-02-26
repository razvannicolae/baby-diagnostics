export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface WebSocketMessage {
  type: 'message' | 'token' | 'done' | 'error';
  content: string;
}

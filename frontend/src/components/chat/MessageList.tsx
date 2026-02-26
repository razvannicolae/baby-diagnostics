import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageType[];
}

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px', padding: '0 32px', textAlign: 'center' }}>
        Ask a question about your scan results and the AI will help explain them.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

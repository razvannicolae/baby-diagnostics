import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageType[];
  isStreaming?: boolean;
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #00897B, #00695C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
          <path d="M16 14H8a5 5 0 0 0-5 5v2h18v-2a5 5 0 0 0-5-5z" />
        </svg>
      </div>
      <div style={{
        padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
        background: '#fff', border: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8',
              display: 'inline-block',
              animation: 'thinking-dot 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes thinking-dot {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
      </div>
    </div>
  );
}

export function MessageList({ messages, isStreaming = false }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const hasAssistantReply = messages.some((m) => m.role === 'assistant');
  const showThinking = isStreaming && !hasAssistantReply;

  if (messages.length === 0 && !isStreaming) {
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
      {showThinking && <ThinkingBubble />}
      <div ref={bottomRef} />
    </div>
  );
}

import type { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '12px 16px', fontSize: '13px', lineHeight: 1.5,
        background: isUser ? '#1565C0' : '#fff',
        color: isUser ? '#fff' : '#1A202C',
        border: isUser ? 'none' : '1px solid #E2E8F0',
        borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
        alignSelf: isUser ? 'flex-end' : 'flex-start'
      }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px',
          color: isUser ? 'rgba(255,255,255,0.7)' : '#00897B'
        }}>
          {isUser ? 'You' : 'BabyBio AI'}
        </div>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>
      </div>
    </div>
  );
}

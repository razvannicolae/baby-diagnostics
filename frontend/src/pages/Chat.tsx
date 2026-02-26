import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';

export function Chat() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { messages, isConnected, isStreaming, connect, sendMessage } = useWebSocket(scanId ?? '', token ?? '');

  useEffect(() => {
    if (scanId && token) {
      connect();
    }
  }, [scanId, token, connect]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#F5F7FA', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: '14px 20px',
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button
          onClick={() => navigate(scanId ? `/results/${scanId}` : '/')}
          style={{ color: '#1565C0', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{
          width: '38px', height: '38px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #00897B, #00695C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M16 14H8a5 5 0 0 0-5 5v2h18v-2a5 5 0 0 0-5-5z" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A202C', lineHeight: 1.2 }}>BabyBio AI</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#00897B', display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.2, marginTop: '2px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block',
              background: isConnected ? '#00897B' : '#94A3B8'
            }} />
            {isConnected ? (scanId ? `Reviewing Scan` : 'Online') : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <MessageInput onSend={sendMessage} disabled={!isConnected || isStreaming} />
      </div>
    </div>
  );
}

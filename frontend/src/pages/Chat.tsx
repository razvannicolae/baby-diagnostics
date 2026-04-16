import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { getScan } from '../services/api';
import type { Scan } from '../types/scan';

export function Chat() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { messages, isConnected, isStreaming, connect, sendMessage } = useWebSocket(scanId ?? '', token ?? '');
  const [scan, setScan] = useState<Scan | null>(null);

  useEffect(() => {
    if (scanId && token) {
      connect();
      getScan(scanId).then(setScan).catch(() => {});
    }
  }, [scanId, token, connect]);

  if (!scanId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', color: '#64748B', padding: '40px 20px', textAlign: 'center' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', opacity: 0.4 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>No scan selected</p>
        <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>Open a scan result and tap "Ask AI" to start a conversation.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '8px', padding: '10px 20px', borderRadius: '12px', background: '#1565C0', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
          Go to Home
        </button>
      </div>
    );
  }

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

      {/* Scan results strip */}
      {scan && scan.biomarkers.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '8px 12px',
          background: '#fff', borderBottom: '1px solid #E2E8F0',
          overflowX: 'auto', display: 'flex', gap: '8px', alignItems: 'center',
        }}>
          {scan.biomarkers.map((b) => (
            <div key={b.marker_name} style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 12px', borderRadius: '10px',
              background: b.is_flagged ? '#FFF3E0' : '#F0FAF7',
              border: `1px solid ${b.is_flagged ? '#FFB74D' : '#A7D7C5'}`,
              minWidth: '68px',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {b.marker_name}
              </span>
              <span style={{
                fontSize: '14px', fontWeight: 700, marginTop: '2px',
                color: b.is_flagged ? '#E65100' : '#00695C',
              }}>
                {b.value}
              </span>
              {b.reference_range && (
                <span style={{ fontSize: '9px', color: '#94A3B8', marginTop: '1px' }}>{b.reference_range}</span>
              )}
            </div>
          ))}
        </div>
      )}

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

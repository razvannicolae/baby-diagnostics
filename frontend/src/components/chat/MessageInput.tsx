import { useState, type FormEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '12px 16px 32px', background: '#fff', borderTop: '1px solid #E2E8F0',
        display: 'flex', gap: '10px', alignItems: 'center'
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about your results..."
        disabled={disabled}
        style={{
          flex: 1, height: '42px', borderRadius: '21px',
          background: '#F5F7FA', border: '1px solid #E2E8F0',
          padding: '0 16px', fontSize: '13px', color: '#1A202C',
          outline: 'none', opacity: disabled ? 0.5 : 1
        }}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: disabled || !input.trim() ? 0.5 : 1,
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          border: 'none', flexShrink: 0
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}

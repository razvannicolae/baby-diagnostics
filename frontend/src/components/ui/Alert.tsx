import type { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'info' | 'success' | 'warning';
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  error: { background: '#FEE2E2', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' },
  info: { background: '#E3F2FD', color: '#1565C0', border: '1px solid rgba(21,101,192,0.2)' },
  success: { background: '#DCFCE7', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' },
  warning: { background: '#FEF3C7', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' },
};

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
        ...variantStyles[variant]
      }}
    >
      {children}
    </div>
  );
}

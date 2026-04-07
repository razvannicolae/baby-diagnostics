interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: '16px', height: '16px', borderWidth: '2px' },
  md: { width: '32px', height: '32px', borderWidth: '3px' },
  lg: { width: '48px', height: '48px', borderWidth: '4px' },
};

export function Spinner({ size = 'md' }: SpinnerProps) {
  const s = sizes[size];
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        role="status"
        style={{
          ...s,
          borderStyle: 'solid',
          borderColor: '#1565C0',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </>
  );
}

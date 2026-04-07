import type { RefObject } from 'react';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  onCapture: () => void;
}

export function CameraView({ videoRef, isStreaming, onCapture }: CameraViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Viewfinder area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #2a2a3a 0%, #111 100%)' }} />

        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
        />

        {/* Scan frame overlay */}
        <div style={{ position: 'relative', zIndex: 10, width: '240px', height: '180px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '18px' }}>
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '36px', height: '36px', borderLeft: '3px solid #60A5FA', borderTop: '3px solid #60A5FA', borderTopLeftRadius: '18px' }} />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '36px', height: '36px', borderRight: '3px solid #60A5FA', borderTop: '3px solid #60A5FA', borderTopRightRadius: '18px' }} />
          <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '36px', height: '36px', borderLeft: '3px solid #60A5FA', borderBottom: '3px solid #60A5FA', borderBottomLeftRadius: '18px' }} />
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '36px', height: '36px', borderRight: '3px solid #60A5FA', borderBottom: '3px solid #60A5FA', borderBottomRightRadius: '18px' }} />
        </div>

        {/* Label below frame */}
        <div style={{ position: 'absolute', zIndex: 10, bottom: 'calc(50% - 120px)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Align assay strip within frame</span>
        </div>
      </div>

      {/* Tip bar */}
      <div style={{
        position: 'absolute', bottom: '140px', left: '16px', right: '16px',
        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
        borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)', zIndex: 20
      }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, margin: 0 }}>
          Ensure good lighting and hold steady. The entire test strip should be visible inside the frame.
        </p>
      </div>

      {/* Controls */}
      <div style={{ flexShrink: 0, padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', position: 'relative', zIndex: 20, background: '#111' }}>
        {isStreaming ? (
          <>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <button onClick={onCapture} style={{ width: '68px', height: '68px', borderRadius: '50%', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', padding: 0 }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#fff' }} />
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Camera loading...</span>
        )}
      </div>
    </div>
  );
}

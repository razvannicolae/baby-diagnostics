import type { RefObject } from 'react';

// Size of the capture square guide. MUST match CAPTURE_SQUARE_VW in useCamera.ts.
const SQ = '42vw';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  onCapture: () => void;
}

export function CameraView({ videoRef, isStreaming, onCapture }: CameraViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #2a2a3a 0%, #111 100%)' }} />
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
        />

        {isStreaming && (
          /* Full-viewfinder flex layer — centers the square guide */
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {/*
              Square guide — position: relative so that absolutely-positioned
              children resolve % values against THIS element's padding box.
              width/height both = SQ so it is a square.
            */}
            <div style={{ position: 'relative', width: SQ, height: SQ, flexShrink: 0 }}>

              {/* Outer border */}
              <div style={{
                position: 'absolute', inset: 0,
                border: '2px solid rgba(96,165,250,0.75)',
                borderRadius: '6px',
              }} />
              {/* Corner accents */}
              <div style={{ position: 'absolute', top: 0, left: 0,   width: 20, height: 20, borderTop: '3px solid #60A5FA', borderLeft: '3px solid #60A5FA',   borderTopLeftRadius: 6 }} />
              <div style={{ position: 'absolute', top: 0, right: 0,  width: 20, height: 20, borderTop: '3px solid #60A5FA', borderRight: '3px solid #60A5FA',  borderTopRightRadius: 6 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0,  width: 20, height: 20, borderBottom: '3px solid #60A5FA', borderLeft: '3px solid #60A5FA',  borderBottomLeftRadius: 6 }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '3px solid #60A5FA', borderRight: '3px solid #60A5FA', borderBottomRightRadius: 6 }} />

              {/* ── pH strip  [0.07, 0.03, 0.22, 0.87] ── */}
              <div style={{ position: 'absolute', left: '7%', top: '3%', width: '22%', height: '87%', border: '1px dashed rgba(96,165,250,0.5)', borderRadius: 3 }} />
              <div style={{ position: 'absolute', left: '7.5%', top: '3.5%', fontSize: 9, fontWeight: 700, color: '#60A5FA', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3 }}>pH</div>
              {/* dots at x=18%, y = 13.9 / 35.6 / 57.4 / 79.1% */}
              {([13.9, 35.6, 57.4, 79.1] as const).map((yPct, i) => (
                <div key={i} style={{ position: 'absolute', left: '18%', top: `${yPct}%`, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60A5FA', border: '1.5px solid #fff', boxShadow: '0 0 4px rgba(0,0,0,0.7)', flexShrink: 0 }} />
                  <span style={{ fontSize: 8, color: '#93C5FD', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '0 3px', borderRadius: 2, whiteSpace: 'nowrap' }}>{i + 1}</span>
                </div>
              ))}

              {/* ── Creatinine  [0.54, 0.03, 0.34, 0.41] ── */}
              <div style={{ position: 'absolute', left: '54%', top: '3%', width: '34%', height: '41%', border: '1px dashed rgba(251,191,36,0.5)', borderRadius: 3 }} />
              <div style={{ position: 'absolute', left: '54.5%', top: '3.5%', fontSize: 9, fontWeight: 700, color: '#FBBF24', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3 }}>Creat</div>
              {/* dot at x=71%, y=23.5% */}
              <div style={{ position: 'absolute', left: '71%', top: '23.5%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', border: '1.5px solid #fff', boxShadow: '0 0 4px rgba(0,0,0,0.7)' }} />

              {/* ── Albumin  [0.54, 0.47, 0.34, 0.39] ── */}
              <div style={{ position: 'absolute', left: '54%', top: '47%', width: '34%', height: '39%', border: '1px dashed rgba(52,211,153,0.5)', borderRadius: 3 }} />
              <div style={{ position: 'absolute', left: '54.5%', top: '47.5%', fontSize: 9, fontWeight: 700, color: '#34D399', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3 }}>Alb</div>
              {/* dot at x=71%, y=66.5% */}
              <div style={{ position: 'absolute', left: '71%', top: '66.5%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: '#34D399', border: '1.5px solid #fff', boxShadow: '0 0 4px rgba(0,0,0,0.7)' }} />

              {/* Label below square */}
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Align insert within square</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tip bar */}
      <div style={{
        position: 'absolute', bottom: 140, left: 16, right: 16,
        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
        borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)', zIndex: 20,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" style={{ width: 14, height: 14 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, margin: 0 }}>
          Hold the insert inside the square. Dots mark where colors are sampled.
        </p>
      </div>

      {/* Controls */}
      <div style={{ flexShrink: 0, padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, position: 'relative', zIndex: 20, background: '#111' }}>
        {isStreaming ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <button onClick={onCapture} style={{ width: 68, height: 68, borderRadius: '50%', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', padding: 0 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#fff' }} />
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </div>
          </>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Camera loading...</span>
        )}
      </div>
    </div>
  );
}

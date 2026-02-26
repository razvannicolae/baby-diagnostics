import { useMemo } from 'react';

interface ImagePreviewProps {
  image: Blob;
  onRetake: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function ImagePreview({ image, onRetake, onAnalyze, isAnalyzing }: ImagePreviewProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(image), [image]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#111' }}>
      {/* Image area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 24px', overflow: 'hidden',
      }}>
        <div style={{
          width: '100%', maxHeight: '100%', borderRadius: '16px', overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
        }}>
          <img
            src={imageUrl}
            alt="Captured test strip"
            style={{ width: '100%', display: 'block', maxHeight: 'calc(100dvh - 300px)', objectFit: 'contain', background: '#000' }}
          />
        </div>
      </div>

      {/* Status label */}
      <div style={{
        textAlign: 'center', padding: '0 24px 16px',
      }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          {isAnalyzing ? 'Processing image...' : 'Review your capture'}
        </span>
      </div>

      {/* Controls — matches CameraView bottom area */}
      <div style={{
        flexShrink: 0, padding: '24px 24px 40px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
        background: '#111',
      }}>
        <button
          onClick={onRetake}
          disabled={isAnalyzing}
          style={{
            flex: 1, height: '50px', borderRadius: '14px', fontWeight: 700, fontSize: '15px',
            border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
            color: '#fff', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing ? 0.4 : 1, letterSpacing: '0.3px',
          }}
        >
          Retake
        </button>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          style={{
            flex: 1, height: '50px', borderRadius: '14px', fontWeight: 700, fontSize: '15px',
            border: 'none', color: '#fff', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
            boxShadow: '0 4px 14px rgba(21,101,192,.35)',
            opacity: isAnalyzing ? 0.6 : 1, letterSpacing: '0.3px',
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>
  );
}

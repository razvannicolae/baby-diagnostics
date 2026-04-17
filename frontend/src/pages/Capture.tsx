import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { useAnalysis } from '../hooks/useAnalysis';
import { CameraView } from '../components/camera/CameraView';
import { ImagePreview } from '../components/camera/ImagePreview';
import { Alert } from '../components/ui/Alert';
import { getBabies } from '../services/api';
import type { Baby } from '../types/scan';

export function Capture() {
  const navigate = useNavigate();
  const { videoRef, overlayRef, isStreaming, capturedImage, startCamera, captureAsync, stopCamera, resetCapture } = useCamera();
  const { isAnalyzing, error: analysisError, analyze } = useAnalysis();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [babiesLoading, setBabiesLoading] = useState(true);

  useEffect(() => {
    startCamera();
    getBabies()
      .then((data) => {
        setBabies(data);
        if (data.length > 0) {
          setSelectedBabyId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setBabiesLoading(false));
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    await captureAsync();
    stopCamera();
  };

  const handleRetake = () => {
    resetCapture();
    startCamera();
  };

  const handleAnalyze = async () => {
    if (!capturedImage || !selectedBabyId) return;
    const result = await analyze(capturedImage, selectedBabyId);
    if (result) {
      navigate(`/results/${result.scan_id}`);
    }
  };

  const noBabies = !babiesLoading && babies.length === 0;
  const singleBaby = babies.length === 1;
  const showSelector = babies.length > 1;
  const alertTop = showSelector ? '110px' : '64px';

  return (
    <div style={{ background: '#111', minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Scan Assay</div>
          {singleBaby && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: '2px' }}>
              {babies[0].name}
            </div>
          )}
        </div>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#fff'
        }}>?</div>
      </div>

      {/* Baby selector — only when multiple babies */}
      {showSelector && (
        <div style={{ position: 'absolute', top: '64px', left: '16px', right: '16px', zIndex: 30 }}>
          <select
            value={selectedBabyId}
            onChange={(e) => setSelectedBabyId(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '14px', fontWeight: 500, appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {babies.map((baby) => (
              <option key={baby.id} value={baby.id} style={{ color: '#111' }}>
                {baby.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {noBabies && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30, textAlign: 'center' }}>
          <p style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>
            Add a baby profile first to start scanning.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px', borderRadius: '12px',
              background: '#1565C0', color: '#fff', border: 'none',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {analysisError && (
        <div style={{ position: 'absolute', top: alertTop, left: '16px', right: '16px', zIndex: 30 }}>
          <Alert variant="error">{analysisError}</Alert>
        </div>
      )}

      {!noBabies && (
        capturedImage ? (
          <ImagePreview
            image={capturedImage}
            onRetake={handleRetake}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        ) : (
          <CameraView videoRef={videoRef} overlayRef={overlayRef} isStreaming={isStreaming} onCapture={handleCapture} />
        )
      )}
    </div>
  );
}

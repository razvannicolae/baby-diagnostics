import { useMemo, useEffect, useState } from 'react';

// Pad geometry matches backend/app/cv/calibration/default.yaml exactly.
// region: [x_start, y_start, width, height] as fractions of full image.
// Sampling logic mirrors _sample_pad / _sample_pad_multi (center 60% of each region).
const PAD_DEFS = [
  { name: 'pH 1', region: [0.07, 0.03, 0.22, 0.87], subPad: 0, of: 4 },
  { name: 'pH 2', region: [0.07, 0.03, 0.22, 0.87], subPad: 1, of: 4 },
  { name: 'pH 3', region: [0.07, 0.03, 0.22, 0.87], subPad: 2, of: 4 },
  { name: 'pH 4', region: [0.07, 0.03, 0.22, 0.87], subPad: 3, of: 4 },
  { name: 'Creat', region: [0.54, 0.03, 0.34, 0.41], subPad: null, of: 1 },
  { name: 'Alb',   region: [0.54, 0.47, 0.34, 0.39], subPad: null, of: 1 },
] as const;

function medianChannel(values: number[]): number {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function sampleROI(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): string {
  if (w <= 0 || h <= 0) return '#888';
  const d = ctx.getImageData(x, y, w, h).data;
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  for (let i = 0; i < d.length; i += 4) {
    rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
  }
  return `rgb(${medianChannel(rs)},${medianChannel(gs)},${medianChannel(bs)})`;
}

async function samplePadColors(blob: Blob): Promise<string[]> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); return PAD_DEFS.map(() => '#888'); }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const W = canvas.width, H = canvas.height;

  return PAD_DEFS.map(({ region, subPad, of: n }) => {
    const xS = Math.floor(region[0] * W);
    const yS = Math.floor(region[1] * H);
    const pW = Math.floor(region[2] * W);
    const pH = Math.floor(region[3] * H);
    const mX = Math.floor(pW * 0.2);

    if (subPad !== null) {
      // Multi-pad: divide region into n equal horizontal strips
      const subH = Math.floor(pH / n);
      const mY = Math.floor(subH * 0.2);
      const sy = yS + subPad * subH;
      return sampleROI(ctx, xS + mX, sy + mY, pW - 2 * mX, subH - 2 * mY);
    } else {
      // Single pad
      const mY = Math.floor(pH * 0.2);
      return sampleROI(ctx, xS + mX, yS + mY, pW - 2 * mX, pH - 2 * mY);
    }
  });
}

interface ImagePreviewProps {
  image: Blob;
  onRetake: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function ImagePreview({ image, onRetake, onAnalyze, isAnalyzing }: ImagePreviewProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(image), [image]);
  const [padColors, setPadColors] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    samplePadColors(image).then((colors) => {
      if (!cancelled) setPadColors(colors);
    });
    return () => { cancelled = true; };
  }, [image]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#111' }}>
      {/* Image area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 12px', overflow: 'hidden',
      }}>
        <div style={{
          width: '100%', maxHeight: '100%', borderRadius: '16px', overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
        }}>
          <img
            src={imageUrl}
            alt="Captured test strip"
            style={{ width: '100%', display: 'block', maxHeight: 'calc(100dvh - 340px)', objectFit: 'contain', background: '#000' }}
          />
        </div>
      </div>

      {/* Sampled color swatches */}
      <div style={{ padding: '10px 24px 4px', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Sampled colors
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {PAD_DEFS.map(({ name }, i) => {
            const color = padColors?.[i];
            const isPhGroup = name.startsWith('pH');
            return (
              <div key={name} style={{ flex: isPhGroup ? 1 : 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%', height: '32px', borderRadius: '6px',
                  background: color ?? 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.3s',
                }}>
                  {!color && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'rgba(255,255,255,0.7)', animation: 'spin 0.8s linear infinite' }} />
                  )}
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status label */}
      <div style={{ textAlign: 'center', padding: '6px 24px 12px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          {isAnalyzing ? 'Processing image...' : 'Review capture and colors'}
        </span>
      </div>

      {/* Controls */}
      <div style={{
        flexShrink: 0, padding: '0 24px 40px', display: 'flex',
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

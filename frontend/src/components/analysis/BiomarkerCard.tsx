import type { Biomarker } from '../../types/scan';

interface BiomarkerCardProps {
  biomarker: Biomarker;
}

// Ordinal biomarker scale metadata. Category order runs lowest → highest,
// matching the calibration gradient in backend/app/cv/calibration/default.yaml.
// The `normal` field is the category that is NOT flagged.
const ORDINAL_SCALES: Record<string, { categories: string[]; normal: string }> = {
  creatinine: { categories: ['1+', '2+', '3+'], normal: '3+' },
  albumin:    { categories: ['normal', '1+', '2+', '3+'], normal: 'normal' },
};

// Full physical scale for numeric biomarkers. The bar spans this range so
// the value's absolute position is visible (e.g. pH 6 sits at 6/14 ≈ 43%).
// Without an entry here the bar falls back to a reference-range-relative position.
const NUMERIC_FULL_SCALE: Record<string, [number, number]> = {
  pH: [0, 14],
};

function getStatus(biomarker: Biomarker): 'normal' | 'warning' | 'alert' {
  if (biomarker.is_flagged) {
    return biomarker.category === 'critical' ? 'alert' : 'warning';
  }
  return 'normal';
}

const statusColor = { normal: '#16A34A', warning: '#D97706', alert: '#DC2626' };

export function BiomarkerCard({ biomarker }: BiomarkerCardProps) {
  const status = getStatus(biomarker);
  const color = statusColor[status];
  const ordinal = ORDINAL_SCALES[biomarker.marker_name];

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
      {/* Name + value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A202C' }}>{biomarker.marker_name}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{biomarker.value}</span>
      </div>

      {ordinal ? (
        /* ORDINAL: pill segments for each category, current one highlighted. */
        <>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {ordinal.categories.map((cat) => {
              const isCurrent = cat === biomarker.value;
              const isNormalCat = cat === ordinal.normal;
              const bg = isCurrent ? color : '#F1F5F9';
              const fg = isCurrent ? '#fff' : (isNormalCat ? '#334155' : '#94A3B8');
              const border = !isCurrent && isNormalCat ? '1px dashed #CBD5E1' : '1px solid transparent';
              return (
                <div
                  key={cat}
                  style={{
                    flex: 1, textAlign: 'center', fontSize: 11,
                    fontWeight: isCurrent ? 700 : 500,
                    padding: '5px 0', borderRadius: 6,
                    background: bg, color: fg, border,
                  }}
                >
                  {cat}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: '#94A3B8' }}>
            Normal: <span style={{ color: '#334155', fontWeight: 600 }}>{ordinal.normal}</span>
          </div>
        </>
      ) : (
        /* NUMERIC: bar positioned within the reference range so the midpoint of
           the normal range = center of the bar. pH 7 in range 6–8 shows at 50%.
           Values outside the range lean toward the relevant edge. */
        (() => {
          const parts = biomarker.reference_range?.match(/^([\d.]+)-([\d.]+)/);
          const refMin = parts ? parseFloat(parts[1]) : null;
          const refMax = parts ? parseFloat(parts[2]) : null;
          const fullScale = NUMERIC_FULL_SCALE[biomarker.marker_name];
          const scaleMin = fullScale ? fullScale[0] : (refMin ?? 0);
          const scaleMax = fullScale ? fullScale[1] : (refMax ?? 10);
          const pct =
            biomarker.numeric_value != null && scaleMax > scaleMin
              ? Math.min(Math.max(((biomarker.numeric_value - scaleMin) / (scaleMax - scaleMin)) * 100, 2), 98)
              : 50;
          return (
            <>
              <div style={{ height: 6, borderRadius: 3, background: '#F1F5F9', marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.3s ease' }} />
              </div>
              {biomarker.reference_range && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#94A3B8' }}>
                  <span>Low</span>
                  <span>{biomarker.reference_range}</span>
                  <span>High</span>
                </div>
              )}
            </>
          );
        })()
      )}

      {biomarker.is_flagged && (
        <div
          style={{
            fontSize: 11, color: '#64748B', marginTop: 10, lineHeight: 1.4,
            padding: '6px 8px', background: '#F8FAFC', borderRadius: 8,
          }}
        >
          &#9888; This marker has been flagged. Monitor and consult your pediatrician if persistent.
        </div>
      )}
    </div>
  );
}

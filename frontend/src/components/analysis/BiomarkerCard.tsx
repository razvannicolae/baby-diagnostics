import type { Biomarker } from '../../types/scan';

interface BiomarkerCardProps {
  biomarker: Biomarker;
}

function getStatus(biomarker: Biomarker): 'normal' | 'warning' | 'alert' {
  if (biomarker.is_flagged) {
    return biomarker.category === 'critical' ? 'alert' : 'warning';
  }
  return 'normal';
}

const valueColors = { normal: '#16A34A', warning: '#D97706', alert: '#DC2626' };
const barColors = { normal: '#16A34A', warning: '#D97706', alert: '#DC2626' };

export function BiomarkerCard({ biomarker }: BiomarkerCardProps) {
  const status = getStatus(biomarker);
  const barWidth = biomarker.numeric_value != null
    ? Math.min(Math.max(biomarker.numeric_value * 10, 5), 95)
    : 25;

  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', border: '1px solid #E2E8F0' }}>
      {/* Name + value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>{biomarker.marker_name}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: valueColors[status], flexShrink: 0 }}>{biomarker.value}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', borderRadius: '3px', background: '#F1F5F9', marginTop: '8px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', borderRadius: '3px', background: barColors[status], width: `${barWidth}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Range labels */}
      {biomarker.reference_range && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#94A3B8' }}>
          <span>Low</span>
          <span>{biomarker.reference_range}</span>
          <span>High</span>
        </div>
      )}

      {/* Flagged note */}
      {biomarker.is_flagged && (
        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, padding: '6px 8px', background: '#F8FAFC', borderRadius: '8px' }}>
          &#9888; This marker has been flagged. Monitor and consult your pediatrician if persistent.
        </div>
      )}
    </div>
  );
}

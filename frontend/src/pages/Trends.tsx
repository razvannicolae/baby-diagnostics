import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBabies, getScans } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import type { Baby, Scan, Biomarker } from '../types/scan';

// min/max define the reference (normal) range band on the sparkline.
// normalLabel overrides the "Normal: X–Y" text for ordinal biomarkers.
const MARKERS = [
  { key: 'pH',         label: 'pH',         unit: '', min: 6.0, max: 8.0,  normalLabel: '6–8'     },
  { key: 'creatinine', label: 'Creatinine', unit: '', min: 2.5, max: 3.0,  normalLabel: '3+'      },
  { key: 'albumin',    label: 'Albumin',    unit: '', min: 0.0, max: 0.5,  normalLabel: 'normal'  },
] as const;

interface DataPoint {
  value: number;
  date: string;
  flagged: boolean;
}

interface ChartCardProps {
  label: string;
  unit: string;
  refMin: number;
  refMax: number;
  normalLabel: string;
  dataPoints: DataPoint[];
}

function ChartCard({ label, unit, refMin, refMax, normalLabel, dataPoints }: ChartCardProps) {
  const latest = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : null;
  const isFlagged = latest?.flagged ?? false;
  const accentColor = isFlagged ? '#D97706' : '#16A34A';
  const accentBg = isFlagged ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.08)';

  if (dataPoints.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0',
        padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>{label}</span>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#CBD5E1',
            background: '#F8FAFC', padding: '3px 10px', borderRadius: '8px',
          }}>No data</span>
        </div>
        <div style={{
          height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: '12px', borderRadius: '10px', background: '#F8FAFC',
        }}>
          <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Scan to start tracking</span>
        </div>
      </div>
    );
  }

  // SVG sparkline dimensions
  const W = 280;
  const H = 64;
  const PAD_X = 8;
  const PAD_Y = 8;

  const values = dataPoints.map((d) => d.value);
  const allValues = [...values, refMin, refMax];
  const yMin = Math.min(...allValues) - (Math.max(...allValues) - Math.min(...allValues)) * 0.1;
  const yMax = Math.max(...allValues) + (Math.max(...allValues) - Math.min(...allValues)) * 0.1;
  const yRange = yMax - yMin || 1;

  const toX = (i: number) => PAD_X + ((W - 2 * PAD_X) / Math.max(dataPoints.length - 1, 1)) * i;
  const toY = (v: number) => H - PAD_Y - ((v - yMin) / yRange) * (H - 2 * PAD_Y);

  const points = dataPoints.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

  // Smooth path for area fill
  const areaPath = `M ${toX(0)},${toY(dataPoints[0].value)} ${dataPoints.slice(1).map((d, i) => `L ${toX(i + 1)},${toY(d.value)}`).join(' ')} L ${toX(dataPoints.length - 1)},${H} L ${toX(0)},${H} Z`;

  const refY1 = Math.max(toY(refMax), 0);
  const refY2 = Math.min(toY(refMin), H);

  // Trend indicator
  let trendArrow = '';
  if (dataPoints.length >= 2) {
    const prev = dataPoints[dataPoints.length - 2].value;
    const curr = dataPoints[dataPoints.length - 1].value;
    if (curr > prev) trendArrow = '\u2191';
    else if (curr < prev) trendArrow = '\u2193';
    else trendArrow = '\u2192';
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0',
      padding: '16px 18px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>{label}</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            Normal: {normalLabel}{unit ? ` ${unit}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: accentColor, lineHeight: 1 }}>
            {latest?.value.toFixed(1)}
            {trendArrow && <span style={{ fontSize: '13px', marginLeft: '3px' }}>{trendArrow}</span>}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{unit || '\u00A0'}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#FAFBFC' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '64px', display: 'block' }} preserveAspectRatio="none">
          {/* Reference range band */}
          <rect x={0} y={refY1} width={W} height={Math.max(refY2 - refY1, 1)} fill={accentBg} />
          <line x1={0} y1={refY1} x2={W} y2={refY1} stroke={accentColor} strokeWidth="0.5" strokeDasharray="4 3" opacity={0.3} />
          <line x1={0} y1={refY2} x2={W} y2={refY2} stroke={accentColor} strokeWidth="0.5" strokeDasharray="4 3" opacity={0.3} />
          {/* Area fill */}
          <path d={areaPath} fill={accentColor} opacity={0.06} />
          {/* Line */}
          <polyline points={points} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {dataPoints.map((d, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(d.value)} r="4" fill="#fff" stroke={d.flagged ? '#D97706' : '#16A34A'} strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
          {dataPoints.length} reading{dataPoints.length !== 1 ? 's' : ''}
        </span>
        {dataPoints.length > 0 && (
          <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
            Latest: {new Date(dataPoints[dataPoints.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

export function Trends() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBabies(), getScans()])
      .then(([babiesData, scansData]) => {
        setBabies(babiesData);
        setScans(scansData);
        if (babiesData.length > 0) {
          setSelectedBabyId(babiesData[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filteredScans = useMemo(
    () => scans
      .filter((s) => s.baby_id === selectedBabyId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [scans, selectedBabyId],
  );

  const markerData = useMemo(() => {
    const result: Record<string, DataPoint[]> = {};
    for (const m of MARKERS) {
      result[m.key] = [];
    }
    for (const scan of filteredScans) {
      for (const bio of scan.biomarkers) {
        if (bio.numeric_value !== null && bio.marker_name in result) {
          result[bio.marker_name].push({
            value: bio.numeric_value,
            date: scan.created_at,
            flagged: bio.is_flagged,
          });
        }
      }
    }
    return result;
  }, [filteredScans]);

  // Reverse chronological for history list
  const historyScans = useMemo(
    () => [...filteredScans].reverse(),
    [filteredScans],
  );

  // Summary stats
  const totalScans = historyScans.length;
  const flaggedScans = historyScans.filter((s) => s.biomarkers.some((b: Biomarker) => b.is_flagged)).length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ background: '#F5F7FA', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 24px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C' }}>Trends</div>
          {babies.length === 1 && (
            <span style={{
              fontSize: '12px', fontWeight: 600, color: '#1565C0',
              background: '#EFF6FF', padding: '4px 12px', borderRadius: '8px',
            }}>{babies[0].name}</span>
          )}
        </div>
        {babies.length > 1 && (
          <select
            value={selectedBabyId}
            onChange={(e) => setSelectedBabyId(e.target.value)}
            style={{
              marginTop: '12px', width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px',
              fontWeight: 500, color: '#1A202C', appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            {babies.map((baby) => (
              <option key={baby.id} value={baby.id}>{baby.name}</option>
            ))}
          </select>
        )}

        {/* Quick stats */}
        {babies.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <div style={{ flex: 1, background: '#F5F7FA', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C', lineHeight: 1.1 }}>{totalScans}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Total Scans</div>
            </div>
            <div style={{ flex: 1, background: '#F5F7FA', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A', lineHeight: 1.1 }}>{totalScans - flaggedScans}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Normal</div>
            </div>
            <div style={{ flex: 1, background: '#F5F7FA', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: flaggedScans > 0 ? '#D97706' : '#1A202C', lineHeight: 1.1 }}>{flaggedScans}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Flagged</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {babies.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>Add a baby profile to start tracking trends.</p>
          </div>
        ) : (
          <>
            {/* Biomarker charts — full width stacked */}
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A202C', marginBottom: '12px' }}>Biomarkers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {MARKERS.map((m) => (
                <ChartCard
                  key={m.key}
                  label={m.label}
                  unit={m.unit}
                  refMin={m.min}
                  refMax={m.max}
                  normalLabel={m.normalLabel}
                  dataPoints={markerData[m.key]}
                />
              ))}
            </div>

            {/* Scan history */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A202C' }}>Scan History</span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                {historyScans.length} scan{historyScans.length !== 1 ? 's' : ''}
              </span>
            </div>

            {historyScans.length === 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No scans yet for this baby.</p>
              </div>
            )}

            {historyScans.map((scan) => {
              const hasFlagged = scan.biomarkers.some((b: Biomarker) => b.is_flagged);
              const normalCount = scan.biomarkers.filter((b: Biomarker) => !b.is_flagged).length;
              return (
                <Link key={scan.id} to={`/results/${scan.id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '10px' }}>
                  <div style={{
                    background: '#fff', borderRadius: '14px', padding: '14px 16px',
                    border: '1px solid #E2E8F0',
                  }}>
                    {/* Top row: date + status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A202C' }}>
                        {new Date(scan.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: hasFlagged ? '#FEF3C7' : '#DCFCE7',
                        color: hasFlagged ? '#D97706' : '#16A34A',
                      }}>
                        {hasFlagged ? 'Review' : 'Normal'}
                      </span>
                    </div>

                    {/* Time + summary */}
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(scan.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      {' \u00B7 '}
                      {normalCount}/{scan.biomarkers.length} markers normal
                    </div>

                    {/* All biomarker chips */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {scan.biomarkers.map((b: Biomarker) => {
                        const markerMeta = MARKERS.find((m) => m.key === b.marker_name);
                        return (
                          <span key={b.marker_name} style={{
                            fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '8px',
                            background: b.is_flagged ? '#FEF3C7' : '#F0FDF4',
                            color: b.is_flagged ? '#92400E' : '#166534',
                          }}>
                            {markerMeta?.label ?? b.marker_name}
                            {b.numeric_value !== null ? ` ${b.numeric_value.toFixed(1)}` : ` ${b.value}`}
                            {b.is_flagged ? ' \u26A0' : ' \u2713'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

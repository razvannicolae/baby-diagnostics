import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScans } from '../hooks/useScans';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { getBabies } from '../services/api';
import type { Baby } from '../types/scan';

export function Home() {
  const { user } = useAuth();
  const { scans, isLoading, error } = useScans();
  const [babies, setBabies] = useState<Baby[]>([]);

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  useEffect(() => {
    getBabies().then(setBabies).catch(() => {});
  }, []);

  const normalCount = scans.filter((s) => !s.biomarkers.some((b) => b.is_flagged)).length;
  const flaggedCount = scans.length - normalCount;

  return (
    <div style={{ background: '#F5F7FA' }}>
      {/* Header with stats — one white block like mockup */}
      <div style={{ padding: '12px 24px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{greeting}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C' }}>{user?.display_name ?? 'User'}</div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1565C0, #00897B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '15px', fontWeight: 700
          }}>
            {initials}
          </div>
        </div>

        {/* Stats row inside header */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {[
            { val: scans.length, label: 'Total Scans', color: '#1A202C' },
            { val: normalCount, label: 'Normal', color: '#16A34A' },
            { val: flaggedCount, label: 'Flagged', color: '#D97706' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: '#F5F7FA', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        {/* Baby profiles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A202C' }}>Baby Profiles</span>
          <Link to="/profile" style={{ fontSize: '12px', fontWeight: 600, color: '#1565C0', textDecoration: 'none' }}>
            Manage
          </Link>
        </div>

        {babies.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
            {babies.map((baby) => (
              <div key={baby.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '10px 16px', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>{baby.name}</div>
                {baby.date_of_birth && (
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    Born {new Date(baby.date_of_birth).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {babies.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No babies added yet. <Link to="/profile" style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 600 }}>Add one</Link></p>
          </div>
        )}

        {/* Recent scans */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A202C' }}>Recent Scans</span>
          {scans.length > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1565C0' }}>View All</span>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner />
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {!isLoading && !error && scans.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No scans yet. Tap the camera button to take your first scan.</p>
          </div>
        )}

        {scans.map((scan) => {
          const hasFlagged = scan.biomarkers.some((b) => b.is_flagged);
          const baby = babies.find((b) => b.id === scan.baby_id);

          return (
            <Link key={scan.id} to={`/results/${scan.id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: '14px', alignItems: 'center' }}>
                {/* Icon */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: hasFlagged ? '#FEF3C7' : '#DCFCE7', color: hasFlagged ? '#D97706' : '#16A34A',
                }}>
                  {hasFlagged ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                      {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {baby && (
                      <>
                        <span style={{ fontSize: '11px', color: '#CBD5E1' }}>·</span>
                        <span style={{ fontSize: '12px', color: '#1565C0', fontWeight: 600 }}>{baby.name}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A202C' }}>Sample Analysis</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
                      background: hasFlagged ? '#FEF3C7' : '#DCFCE7', color: hasFlagged ? '#D97706' : '#16A34A',
                    }}>
                      {hasFlagged ? 'Review' : 'Normal'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {scan.biomarkers.slice(0, 3).map((b) => (
                      <span key={b.marker_name} style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', background: '#F5F7FA', padding: '2px 8px', borderRadius: '6px' }}>
                        {b.marker_name} {b.is_flagged ? '\u26A0' : '\u2713'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

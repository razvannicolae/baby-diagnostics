import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScan } from '../services/api';
import type { Scan } from '../types/scan';
import { ResultsGrid } from '../components/analysis/ResultsGrid';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

export function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getScan(id)
      .then(setScan)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load scan');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <Alert variant="error">{error ?? 'Scan not found.'}</Alert>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#1565C0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  const normalCount = scan.biomarkers.filter((b) => !b.is_flagged).length;
  const flaggedCount = scan.biomarkers.length - normalCount;

  return (
    <div style={{ background: '#F5F7FA', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 24px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        {/* Nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: '#1565C0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: '#DCFCE7', color: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
              {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A202C', marginTop: '2px' }}>
              {normalCount} of {scan.biomarkers.length} Normal
            </div>
            {flaggedCount > 0 && (
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                {flaggedCount} marker{flaggedCount > 1 ? 's' : ''} flagged for review
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biomarkers list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', WebkitOverflowScrolling: 'touch' }}>
        <ResultsGrid biomarkers={scan.biomarkers} />
      </div>

      {/* AI CTA */}
      <div style={{ padding: '16px 24px 20px', flexShrink: 0 }}>
        <button
          onClick={() => navigate(`/chat/${scan.id}`)}
          style={{
            width: '100%', height: '50px', borderRadius: '14px',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #00897B, #00695C)',
            boxShadow: '0 4px 14px rgba(0,137,123,.3)'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask AI About These Results
        </button>
      </div>
    </div>
  );
}

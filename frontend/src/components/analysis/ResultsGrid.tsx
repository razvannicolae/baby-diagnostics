import type { Biomarker } from '../../types/scan';
import { BiomarkerCard } from './BiomarkerCard';

interface ResultsGridProps {
  biomarkers: Biomarker[];
}

export function ResultsGrid({ biomarkers }: ResultsGridProps) {
  if (biomarkers.length === 0) {
    return <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No biomarker results available.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {biomarkers.map((biomarker) => (
        <BiomarkerCard key={biomarker.marker_name} biomarker={biomarker} />
      ))}
    </div>
  );
}

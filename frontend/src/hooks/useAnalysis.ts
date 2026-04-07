import { useState, useCallback } from 'react';
import type { AnalysisResponse } from '../types/scan';
import { analyzeImage } from '../services/api';

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (image: Blob, babyId: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await analyzeImage(image, babyId);
      setResult(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isAnalyzing, error, analyze, reset };
}

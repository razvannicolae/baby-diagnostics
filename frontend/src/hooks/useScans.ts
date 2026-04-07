import { useState, useEffect, useCallback } from 'react';
import type { Scan } from '../types/scan';
import { getScans } from '../services/api';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getScans();
      setScans(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scans';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  return { scans, isLoading, error, refetch: fetchScans };
}

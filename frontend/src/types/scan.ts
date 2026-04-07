export interface Biomarker {
  marker_name: string;
  value: string;
  numeric_value: number | null;
  category: string;
  is_flagged: boolean;
  reference_range: string | null;
}

export interface Scan {
  id: string;
  baby_id: string;
  status: string;
  confidence: number;
  biomarkers: Biomarker[];
  created_at: string;
  notes: string | null;
}

export interface AnalysisResponse {
  scan_id: string;
  status: string;
  confidence: number;
  biomarkers: Biomarker[];
  created_at: string;
}

export interface Baby {
  id: string;
  name: string;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
}

import axios from 'axios';
import type { HealthResponse } from '../types/api';
import type { User } from '../types/auth';
import type { Baby, AnalysisResponse, Scan } from '../types/scan';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let token: string | null = null;

export function setToken(newToken: string | null): void {
  token = newToken;
}

api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Health
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/api/health');
  return data;
}

// Auth
export async function loginWithGoogle(credential: string): Promise<{ access_token: string; user: User }> {
  const { data } = await api.post('/api/auth/google', { token: credential });
  return data;
}

export async function devLogin(): Promise<{ access_token: string; user: User }> {
  const { data } = await api.post('/api/auth/dev-login');
  return data;
}

// Users
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/users/me');
  return data;
}

// Babies
export async function getBabies(): Promise<Baby[]> {
  const { data } = await api.get<Baby[]>('/api/babies');
  return data;
}

export async function createBaby(baby: { name: string; date_of_birth?: string; notes?: string }): Promise<Baby> {
  const { data } = await api.post<Baby>('/api/babies', baby);
  return data;
}

export async function updateBaby(id: string, baby: { name?: string; date_of_birth?: string; notes?: string }): Promise<Baby> {
  const { data } = await api.put<Baby>(`/api/babies/${id}`, baby);
  return data;
}

export async function deleteBaby(id: string): Promise<void> {
  await api.delete(`/api/babies/${id}`);
}

// Scans
export async function getScans(): Promise<Scan[]> {
  const { data } = await api.get<Scan[]>('/api/scans');
  return data;
}

export async function getScan(id: string): Promise<Scan> {
  const { data } = await api.get<Scan>(`/api/scans/${id}`);
  return data;
}

export async function deleteScan(id: string): Promise<void> {
  await api.delete(`/api/scans/${id}`);
}

// Analysis — uses fetch instead of axios to avoid Content-Type header conflicts with FormData
export async function analyzeImage(image: Blob, babyId: string): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', image, 'capture.jpg');
  formData.append('baby_id', babyId);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Analysis failed (${response.status})`);
  }

  return response.json();
}

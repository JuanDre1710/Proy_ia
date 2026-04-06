function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/$/, '');
}

export const apiBaseUrls = {
  backend: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8000'),
  sqlBackend: normalizeBaseUrl(import.meta.env.VITE_SQL_API_BASE_URL, 'http://localhost:5251')
};

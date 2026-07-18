const hostedEdgeApiBaseUrl = 'https://vvgbkrqqzayqslwjnbdu.supabase.co/functions/v1/maplehub-api';

const isLocalBrowser = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const configuredApiBaseUrl = (process.env.NEXT_PUBLIC_MAPLE_SQL_API_BASE_URL || '').trim();

export const apiBaseUrl = (
  configuredApiBaseUrl || (isLocalBrowser() ? '/api' : hostedEdgeApiBaseUrl)
).replace(/\/+$/, '');

export const apiEndpoint = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

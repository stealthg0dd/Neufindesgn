/**
 * API Configuration - Centralized endpoint management
 * Ensures all API calls use environment variables instead of hardcoded URLs
 */

export const API_CONFIG = {
  // Get backend base URL from environment, fallback to localhost
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  
  // Get frontend URL for OAuth redirects
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  
  // Get Supabase configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://gpczchjipalfgkfqamcu.supabase.co',
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'gpczchjipalfgkfqamcu',
};

/**
 * Build full API endpoint URL
 * @param path - API path (e.g., '/portfolio/get')
 * @returns Full URL with backend base
 */
export function getApiUrl(path: string): string {
  const base = API_CONFIG.BACKEND_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Build Supabase function URL for edge functions
 * @param functionPath - Function path (e.g., '/portfolio/get')
 * @returns Full Supabase function URL
 */
export function getSupabaseUrl(functionPath: string): string {
  const projectId = API_CONFIG.SUPABASE_PROJECT_ID;
  const cleanPath = functionPath.startsWith('/') ? functionPath : `/${functionPath}`;
  return `https://${projectId}.supabase.co/functions/v1${cleanPath}`;
}

/**
 * Get OAuth redirect URL
 * @returns Frontend URL for OAuth callback
 */
export function getOAuthRedirectUrl(): string {
  return `${API_CONFIG.FRONTEND_URL}/auth/callback`;
}

/**
 * Fetch with error handling and base URL
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  useBackend: boolean = true
): Promise<Response> {
  const url = useBackend ? getApiUrl(path) : getSupabaseUrl(path);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

export default API_CONFIG;

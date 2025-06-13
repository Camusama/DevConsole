/**
 * Environment variable adapter for Next.js
 * This adapter maps VITE_ prefixed environment variables to NEXT_PUBLIC_ for compatibility
 */

// Helper function to get environment variable with fallback
function getEnvVar(nextKey: string, viteKey: string, defaultValue?: string): string | undefined {
  // Try Next.js format first
  if (typeof window !== 'undefined') {
    // Client-side: use process.env with NEXT_PUBLIC_ prefix
    const nextValue = (process.env as any)[nextKey]
    if (nextValue !== undefined) return nextValue
  } else {
    // Server-side: try both formats
    const nextValue = process.env[nextKey]
    if (nextValue !== undefined) return nextValue
    
    const viteValue = process.env[viteKey]
    if (viteValue !== undefined) return viteValue
  }
  
  return defaultValue
}

// Environment configuration object compatible with chatbot
export const env = {
  // AI Service Configuration
  VITE_AI_SERVICE: getEnvVar('NEXT_PUBLIC_AI_SERVICE', 'VITE_AI_SERVICE', 'mock'),
  VITE_USE_MOCK_DATA: getEnvVar('NEXT_PUBLIC_USE_MOCK_DATA', 'VITE_USE_MOCK_DATA', 'false') === 'true',
  
  // OpenAI Configuration
  VITE_OPENAI_API_KEY: getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY', 'VITE_OPENAI_API_KEY'),
  VITE_OPENAI_API_URL: getEnvVar('NEXT_PUBLIC_OPENAI_API_URL', 'VITE_OPENAI_API_URL', 'https://api.openai.com/v1'),
  VITE_OPENAI_STREAM: getEnvVar('NEXT_PUBLIC_OPENAI_STREAM', 'VITE_OPENAI_STREAM', 'true') !== 'false',
  
  // Dify Configuration
  VITE_DIFY_API_KEY: getEnvVar('NEXT_PUBLIC_DIFY_API_KEY', 'VITE_DIFY_API_KEY'),
  VITE_DIFY_API_URL: getEnvVar('NEXT_PUBLIC_DIFY_API_URL', 'VITE_DIFY_API_URL', 'https://api.dify.ai'),
  VITE_DIFY_API_ENDPOINT: getEnvVar('NEXT_PUBLIC_DIFY_API_ENDPOINT', 'VITE_DIFY_API_ENDPOINT', '/api/dify'),
  VITE_DIFY_USER_ID: getEnvVar('NEXT_PUBLIC_DIFY_USER_ID', 'VITE_DIFY_USER_ID', 'devconsole-user'),
  
  // WebSocket Configuration
  VITE_WEBSOCKET_URL: getEnvVar('NEXT_PUBLIC_WEBSOCKET_URL', 'VITE_WEBSOCKET_URL'),
  
  // App Configuration
  VITE_APP_TITLE: getEnvVar('NEXT_PUBLIC_APP_TITLE', 'VITE_APP_TITLE'),
}

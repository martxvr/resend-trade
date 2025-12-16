// Environment variable validation
// This runs at startup to catch missing config early

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file or Vercel environment settings.`;
    console.error(message);
    throw new Error(message);
  }
}

// Export env vars with type safety
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined,
};

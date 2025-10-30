/**
 * Environment variable validation and access
 * Ensures all required environment variables are present at startup
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variables are missing
 */
export const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please create a .env.local file in the project root with these variables.\n` +
      `Refer to the documentation for setup instructions.`
    );
  }

  // Validate that URLs are properly formatted
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL format.\n` +
      `Expected: https://your-project.supabase.co\n` +
      `Got: ${supabaseUrl}`
    );
  }

  console.log('✓ Environment variables validated successfully');
};

/**
 * Typed access to environment variables
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Database URL is not configured. Please add POSTGRES_URL or DATABASE_URL to your environment variables.');
  }
  return neon(url);
}

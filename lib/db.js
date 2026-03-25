import { Pool } from 'pg';

let pool;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database URL is not configured. Please add POSTGRES_URL or DATABASE_URL to your environment variables.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // required for Vercel/Neon
    });
  }

  return async function sql(strings, ...values) {
    // If not called as a tagged template, pass through
    if (!Array.isArray(strings)) {
      const { rows } = await pool.query(strings, values[0] || []);
      return rows;
    }
    
    let text = strings[0];
    for (let i = 1; i < strings.length; i++) {
      text += `$${i}` + strings[i];
    }
    const { rows } = await pool.query(text, values);
    return rows;
  };
}

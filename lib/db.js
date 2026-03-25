import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    let connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database URL is not configured. Please add POSTGRES_URL or DATABASE_URL to your environment variables.');
    }
    
    // CRITICAL FIX: Strip ?sslmode=require parameter from Vercel Postgres URLs.
    // If left in, pg-connection-string parses it and sets { ssl: true }, completely ignoring 
    // the { rejectUnauthorized: false } object, triggering the "self-signed certificate in certificate chain" error!
    if (connectionString.includes('sslmode=')) {
      connectionString = connectionString.replace(/\?sslmode=[a-zA-Z-]+/, '');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

export async function sql(strings, ...values) {
  const p = getPool();
  
  if (!Array.isArray(strings)) {
    return p.query(strings, values[0] || []);
  }

  let text = strings[0];
  for (let i = 1; i < strings.length; i++) {
    text += `$${i}` + strings[i];
  }

  return p.query(text, values);
}

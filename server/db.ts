import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log the DATABASE_URL (hiding password for security)
const dbUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
console.log('[DB] Connecting to database:', dbUrl);
console.log('[DB] Process PID:', process.pid);
console.log('[DB] Full DATABASE_URL check:', process.env.DATABASE_URL?.includes('helium') ? 'ERROR: HELIUM DETECTED!' : 'OK: Using Neon');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Force new connections
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection immediately
pool.query('SELECT NOW()').then(() => {
  console.log('[DB] Connection test successful');
}).catch((err) => {
  console.error('[DB] Connection test FAILED:', err.message);
});

export const db = drizzle(pool, { schema });

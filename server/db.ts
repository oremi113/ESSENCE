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

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

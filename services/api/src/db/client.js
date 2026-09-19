import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
}
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, {
    schema,
});
//# sourceMappingURL=client.js.map
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";

import * as schema from "./schema";

dotenv.config();

export const DatabaseError = pg.DatabaseError;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { logger: true, schema });

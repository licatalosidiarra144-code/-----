// ============================================
// 数据库连接（带 mock 模式）
// ============================================
//
// 没设 DATABASE_URL → mock 模式（in-memory）
// 设了 → Drizzle + PostgreSQL
// ============================================

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
export const isMockMode = !DATABASE_URL;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export function getDb() {
  if (isMockMode) return null;
  if (_db) return _db;
  _pool = new Pool({ connectionString: DATABASE_URL });
  _db = drizzle(_pool, { schema });
  return _db;
}

export { schema };

// Applies any pending migrations under drizzle/ to the DB pointed to by
// DATABASE_URL (in .env.prod locally; set the real value when running
// against production). Safe to run repeatedly — drizzle-orm's migrate()
// only executes migrations newer than the last recorded one.
require('dotenv').config({ path: '.env.prod' });
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  console.log('Applying pending migrations from ./drizzle ...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Done — DB is up to date.');
  await pool.end();
})().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });

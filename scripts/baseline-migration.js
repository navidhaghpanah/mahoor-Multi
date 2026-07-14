// One-time, additive-only setup: registers the generated 0000_baseline.sql
// migration as "already applied" against the live DB, WITHOUT executing its
// CREATE TABLE statements (the tables already exist with real data — running
// the DDL would error on "relation already exists").
//
// This mirrors exactly what drizzle-orm's own PgDialect.migrate() does
// internally (see node_modules/drizzle-orm/pg-core/dialect.cjs +
// node_modules/drizzle-orm/migrator.cjs), so any FUTURE `drizzle-kit generate`
// + real migrate() run will correctly see this baseline as done and only
// apply migrations created after it.
require('dotenv').config({ path: '.env.prod' });
const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');

(async () => {
  const journal = JSON.parse(fs.readFileSync('drizzle/meta/_journal.json', 'utf8'));
  const entry = journal.entries[0];
  const sqlPath = `drizzle/${entry.tag}.sql`;
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const existing = await client.query('SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1');
  if (existing.rows.length > 0) {
    console.log('Migration tracking table already has an entry — not inserting again:', existing.rows[0]);
  } else {
    await client.query(
      'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
      [hash, entry.when]
    );
    console.log('Baseline recorded: hash=' + hash.slice(0, 12) + '... created_at=' + entry.when);
  }

  await client.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });

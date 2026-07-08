// One-off migration: add documents (سند/مدارک) column to real_estate_ads
require('dotenv').config({ path: '.env.prod' });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`ALTER TABLE real_estate_ads ADD COLUMN IF NOT EXISTS documents text`);
  const check = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'real_estate_ads' AND column_name = 'documents'`
  );
  console.log('column exists:', check.rows.length === 1);
  await client.end();
})().catch((e) => { console.error(e.message); process.exit(1); });

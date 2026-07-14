# Schema migrations

This project uses `drizzle-kit` to generate versioned SQL migrations from
`src/db/schema.ts`, instead of the ad-hoc `node scripts/add-*.js` files used
before this setup existed (those still work as one-off references, but new
schema changes should go through this flow).

## Baseline

`0000_baseline.sql` was generated from the schema as it existed in production
on 2026-07-14, when the live DB already had every one of those tables/columns
(built up over many prior deploys). It was **never executed** — running its
`CREATE TABLE` statements against a DB that already has those tables would
fail. Instead, `scripts/baseline-migration.js` recorded it as already-applied
in `drizzle.__drizzle_migrations` directly (same table/hash logic
`drizzle-orm`'s own migrator uses — see that script's comments). This ran
once, already, against production; you don't need to re-run it.

## Adding a schema change from now on

1. Edit `src/db/schema.ts`.
2. `npm run db:generate` — reads the schema, diffs it against the last
   snapshot in `drizzle/meta/`, and writes a new numbered `.sql` file under
   `drizzle/`. Review the generated SQL before applying it.
3. `npm run db:migrate` — applies any migration newer than the last one
   recorded in `drizzle.__drizzle_migrations`. Reads `DATABASE_URL` from
   `.env.prod` locally; point that file at the target DB (or export
   `DATABASE_URL` directly) before running against production.

Both scripts are idempotent — safe to re-run; already-applied migrations are
skipped.

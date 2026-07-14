import { defineConfig } from 'drizzle-kit';

// Schema-diff tooling only. `drizzle-kit generate` reads schema.ts and needs
// no DB connection; dbCredentials is only used by `drizzle-kit push`/`studio`,
// which this project does not use (the live DB was baselined manually — see
// drizzle/README.md).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});

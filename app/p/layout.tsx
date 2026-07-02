import type { ReactNode } from 'react';

// Explicit layout boundary for /p/* public listing pages.
// Without this file, Next.js App Router lacks a clear segment entry point for the
// /p subtree, which can cause the root page's client component (ClientAppRouter)
// to persist in the component tree during client-side navigation from / to /p/[code].
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

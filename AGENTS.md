# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 14** personal blog ("Double's Blog") with TypeScript, Tailwind CSS, and Upstash Redis.

### Services

| Service | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Runs on port 3000 |

### Key commands

See `package.json` scripts: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Non-obvious caveats

- **Production build (`npm run build`) requires valid Upstash Redis credentials** in `.env.local`. The Upstash client validates the URL at build time during page data collection for API routes. Without real credentials, the build fails. The dev server works fine without them for all non-clipboard pages.
- **Tests mock Upstash Redis** — `npm test` works without any Redis credentials.
- `.env.local` is created from `.env.example`. The two required env vars are `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- The `/clipboard` feature is the only feature that requires Redis at runtime. All other pages (blog, thoughts, poetry generator, games) are fully functional without it.

# Copilot Instructions

Use this repo's handoff docs before major work:

- `docs/agent-handoff.md`
- `docs/current-task.md`
- `docs/roadmap.md`

When switching context, summarize the current state before coding. Keep changes simple, focused, and beginner-friendly. Follow the existing Next.js App Router, Supabase, and Tailwind patterns already in the repo.

Preserve auth and row-level security assumptions. Do not expose server secrets to client code. Avoid unrelated product changes and avoid overengineering.

After meaningful implementation work, update `docs/agent-handoff.md` with what changed, what was verified, what remains, and any risks or tradeoffs. For code changes, run `npm run typecheck` and `npm run build` when practical.

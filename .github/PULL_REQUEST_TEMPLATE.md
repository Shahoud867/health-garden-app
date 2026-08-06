<!--
Keep this short — the point is a written record CI can run against (CONTRIBUTING.md
§ "Branching and review"), not a bureaucratic form. Delete any section that doesn't apply.
-->

## What changed and why

<!-- One or two sentences. Link the blueprint section or ADR this implements/amends, if any. -->

## How this was verified

<!-- `npm run verify` output, or which CI checks this relies on. If something couldn't be
     verified locally (e.g. needs a live Supabase stack), say so explicitly. -->

## Checklist

- [ ] `npm run verify` passes locally (or CI is green on this branch)
- [ ] New/changed logic has test coverage
- [ ] Any new table has RLS policies, and they're tested
- [ ] No secret introduced into a tracked file
- [ ] Schema changes are migration files, not dashboard edits (ADR-012)
- [ ] The blueprint or an ADR is updated if this changes an architectural decision

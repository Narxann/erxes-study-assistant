# `study-assistant_api` Plugin Guide

## Identity

- **Plugin:** `study-assistant`
- **Project:** `study-assistant_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/study-assistant_api`
- **Last synchronized:** `2026-10-24`

## Scope

### Owns

- GraphQL contracts for MathBridge problem solving and study-assistant problems.
- Grade-aware Gemini vision/text tutoring with a deterministic demo fallback.
- Tenant-scoped learning attempt history.

### Does not own

- Frontend presentation, OCR, or external AI provider integration.
- Core or another plugin's data and contracts.

## Current Capabilities

- Exposes `studyAssistantSolve` and `studyAssistantLearningAttempts`.
- Exposes `studyAssistantCheckSolution`.
- Returns structured Error Detective metadata: error type, title, explanation, correction, corrected next step, and next exercise.
- Parses supported one-variable linear expressions and identifies the first mathematically invalid submitted step; unsupported input is reported without guessing.
- Provides a shared safe math foundation for exact rational fraction expressions, linear inequalities, and quadratic equations/functions, including quadratic graph data.
- Calls Gemini through a backend-only `GEMINI_API_KEY` when configured and falls back to a safe demo response.
- Starts as an isolated plugin on port `3306`.

## Architecture

| Area | Path | Responsibility |
| --- | --- | --- |
| GraphQL | `src/apollo` | Schema and resolver registration |
| Learning | `src/learning.ts` | Gemini request, structured solution parsing, and fallback |
| Attempts | `src/modules/learning` | Tenant-scoped persisted solve history |
| Validation | `src/trpc/check-solution.ts` | Backward-compatible dispatcher and linear step checker |
| Math engine | `src/trpc/math-engine.ts` | Safe normalization, rational/polynomial parsing, fraction/inequality/quadratic evaluation |
| Runtime | `src/main.ts` | Plugin startup and tenant model context |

## Contracts

### Provides

- `studyAssistantSolve(grade, problem, imageData, imageReference)`.
- `studyAssistantLearningAttempts(grade)`.
- `studyAssistantCheckSolution(problem, steps)`.

### Consumes

- `startPlugin` from `erxes-api-shared`.

## Data and State

- Learning attempts are stored in the tenant-scoped plugin database.
- Image bytes are processed by the solve request; the persisted record stores only an optional reference.
- `GEMINI_API_KEY` and optional `GEMINI_MODEL` are backend environment variables.

## Local Invariants

- Invalid equations return actionable GraphQL results rather than throwing opaque errors.
- The parser must not evaluate arbitrary code.
- Provider failures return the demo fallback rather than exposing provider credentials or raw upstream errors.
- Step checking remains deterministic; structured error metadata is safe to render directly in the learning UI.
- Unsupported topics and ambiguous expressions remain unverified; no LLM response is used as mathematical truth.

## Validation

- `pnpm nx lint study-assistant_api`
- `pnpm nx build study-assistant_api`
- `pnpm exec tsx src/trpc/check-solution.spec.ts` (31 deterministic stress tests)
- `pnpm exec tsx src/trpc/math-engine.spec.ts` (113 Grade 5/8/11 regression tests)

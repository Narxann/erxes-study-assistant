# `study-assistant_ui` Plugin Guide

## Identity

- **Plugin:** `study-assistant`
- **Project:** `study-assistant_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/study-assistant_ui`
- **Last synchronized:** `2026-10-24`

## Scope

### Owns

- MathBridge learning workspace for grades 1-12.
- Grade-aware text/image problem entry, guided explanation, practice, progress, and history display.

### Does not own

- Generic erxes navigation, authentication, or shared UI primitives.
- OCR or external AI provider credentials.

## Current Capabilities

- Provides a federated study-assistant module and navigation entry.
- Accepts a grade from 1 through 12 and lets the backend infer the relevant math topic.
- Accepts typed problems and image data, with a correction-friendly preview.
- Provides a lightweight math symbol toolbar for manual entry.
- Explains recognized problems in hint, step, and full modes.
- Checks student-written steps through the plugin GraphQL mutation.
- Provides a practice exercise, Math DNA progress view, and persisted attempt history.
- Provides the Error Detective flow: student work is submitted line by line and the UI highlights the first incorrect step, error category, correction, and next exercise.

## Architecture

| Area | Path | Responsibility |
| --- | --- | --- |
| Workspace | `src/pages/problems/IndexPage.tsx` | Grade-aware learning flows, image/text input, math toolbar, progress, and history |
| Shell | `src/modules/StudyAssistantMain.tsx` | Routes, layout, and lazy loading |
| Configuration | `src/config.tsx` | Host navigation and module metadata |

## Contracts

### Provides

- Module Federation exposes `./config` and `./study-assistant`.

### Consumes

- `studyAssistantSolve` GraphQL mutation and `studyAssistantLearningAttempts` query.
- `studyAssistantCheckSolution` GraphQL mutation for explicit student steps.
- Public components from `erxes-ui` and `ui-modules`.

## Data and State

- Apollo mutation/query state is used for solving and history.
- Progress counters and the current practice session are local React state.
- Uploaded image data is sent for processing; only a reference/name is submitted for history.

## Local Invariants

- All user-facing actions provide loading, validation, and error feedback.
- No API key or private provider credential is stored in frontend code.
- The selected grade is always sent with a solve request.
- The Error Detective must not reveal the full solution before the student submits their own steps.

## Validation

- `pnpm nx lint study-assistant_ui`
- `pnpm nx build study-assistant_ui`

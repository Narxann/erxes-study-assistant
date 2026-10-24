# `study-assistant_ui` Plugin Guide

## Identity

- **Plugin:** `study-assistant`
- **Project:** `study-assistant_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/study-assistant_ui`
- **Last synchronized:** `2026-10-24`

## Scope

### Owns

- MathBridge learning workspace for grades 5, 8, and 11, with a themed homepage, visual learning path, and focused problem modes.
- Grade-aware text/image problem entry, guided explanation, practice, and secondary history display.

### Does not own

- Generic erxes navigation, authentication, or shared UI primitives.
- OCR or external AI provider credentials.

## Current Capabilities

- Provides a federated study-assistant module and navigation entry.
- Accepts the selected grade and lets the backend infer the relevant math topic.
- Accepts typed problems and image data, with a correction-friendly preview.
- Provides a lightweight math symbol toolbar for manual entry.
- Explains recognized problems in hint, step, and full modes.
- Checks student-written steps through the plugin GraphQL mutation.
- Provides a practice exercise and persisted attempt history.
- Provides the Error Detective flow as the primary workspace: students can submit line-by-line work before requesting an AI explanation, add/remove steps, and see the first incorrect step, error category, correction, and next exercise.
- Provides three post-input learning modes: guided solving, personal step checking, and progressive explanation.
- Provides a rule-based "Өнөөдрийн хичээл" entry point for the supported fraction, inequality, and quadratic topics.
- Provides three typed deterministic demo lessons from `src/pages/problems/exercises.ts`; each lesson owns its problem, three stages, choices, validators, hints, and completion flow.

## Architecture

| Area | Path | Responsibility |
| --- | --- | --- |
| Workspace | `src/pages/problems/IndexPage.tsx` | Homepage, visual learning path, focused modes, image/text input, step editor, Error Detective feedback, and history |
| Lessons | `src/pages/problems/exercises.ts` | Single source of truth for Grade 5 fraction, Grade 8 negative inequality, and Grade 11 quadratic guided exercises and validators |
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
- Current practice state is local React state; no XP, streak, mastery, or lesson completion is fabricated.
- Uploaded image data is sent for processing; only a reference/name is submitted for history.

## Local Invariants

- All user-facing actions provide loading, validation, and error feedback.
- No API key or private provider credential is stored in frontend code.
- The selected grade is always sent with a solve request.
- The Error Detective must not reveal the full solution before the student submits their own steps.
- The direct step editor accepts pasted multiline work and keeps each step separately editable.
- The Error Detective preview marks only the first mathematically invalid submitted step as incorrect and shows corrected guidance beneath it.
- OCR confidence is shown to the learner, and the recognized equation remains editable before checking steps.
- The page does not add a plugin-owned sidebar; Erxes `AppLayout` owns navigation and the page uses compact in-page navigation only.
- Guided lesson questions must be rendered from one `LessonDefinition`; personal problems without a matching definition must never receive demo lesson choices.
- A lesson is complete only after all three deterministic stages validate successfully; restart clears the stage and completion state.
- The page uses Erxes semantic theme tokens for primary actions, surfaces, borders, and text so light/dark themes remain readable.
- The homepage is the default student entry point; the raw step editor appears only inside "Бодолтоо шалгая".
- Math DNA and seven-day recommendation UI are intentionally not part of the student-facing navigation.

## Validation

- `pnpm nx lint study-assistant_ui`
- `pnpm nx build study-assistant_ui`

# Specifications

The user drives the project through specs in `specs/`, written in French. Implement from their acceptance criteria; when a spec is ambiguous or conflicts with existing code, ask instead of guessing.

## One subject per spec

- A spec covers one subject, functional or technical. Every acceptance criterion must belong to the subject named in the title. Split anything else out.
- A tool or piece of infrastructure that a spec needs (a toolchain, a hook manager) gets its own spec, referenced with `Dépend de : …`, never a criterion inside the spec that first needs it.
- A cross-cutting capability (an option on every command, an exit-code contract) gets its own spec, never a section inside the first feature that needs it.
- Never spec an agent workflow that only chains existing commands (e.g. "remove by name" = `list` + `remove`). The agent composes commands itself.

## Spec before code

- Any user-visible behaviour needs a spec before it is implemented, including behaviour forced by a technical constraint (e.g. the captcha that imposed browser login). Write or amend the spec first.
- Work in small batches: one atomic spec, implemented and delivered, before the next. Atomicity is mandatory, submission is not.
- When confident in a spec, commit it and implement it without waiting, then name each decision taken on the user's behalf in the end-of-increment summary. Submit it first when confidence is low, all the more for a functional spec.

## Format

Sections, in order: `Contexte`, `User story` (or `User stories`), `Critères d'acceptation` (numbered, each verifiable), then optionally `Hors périmètre`. A spec that relies on another states it in its context with a link (`Dépend de : …`).

## Backlog

Specs in `specs/backlog/` are accepted but not scheduled. Do not implement them until the user schedules one, which moves it up to `specs/`.

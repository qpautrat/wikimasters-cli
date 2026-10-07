# Specifications

The user drives the project through specs in `specs/`, written in French. Implement from their acceptance criteria; when a spec is ambiguous or conflicts with existing code, ask instead of guessing.

## Reading specs

List the specs by title with `head -n1 specs/*.md specs/backlog/*.md`, then read only those related to the subject.

Present a backlog listing in three tables, an empty one included:

1. **API features**: a CLI command that exposes a call of the WikiMasters API.
2. **Player rules**: a choice of how the player plays, meant for `CLAUDE.local.md`.
3. **Technical**: tooling, rules and infrastructure of the repo.

## One subject per spec

- A spec covers one subject, functional or technical. Every acceptance criterion must belong to the subject named in the title. Split anything else out.
- A tool or piece of infrastructure that a spec needs (a toolchain, a hook manager) gets its own spec, referenced with `Dépend de : …`, never a criterion inside the spec that first needs it.
- Undoing an action (unmark a favourite, remove a label) gets its own spec, referencing the action's spec with `Dépend de : …`, never a criterion inside it.
- A cross-cutting capability (an option on every command, an exit-code contract) gets its own spec, never a section inside the first feature that needs it.
- Never spec an agent workflow that only chains existing commands (e.g. "remove by name" = `list` + `remove`). The agent composes commands itself.

## Command scope

A command exposes an API call and nothing more. A command takes every parameter its API call takes and never checks beforehand what the API checks: it sends the request and reports the API's refusal. Never write a criterion that reproduces a rule the web interface applies without the API imposing it, or that decides how the player plays (which cards to keep, which bid tactic to follow): turn the choice into a command parameter, or leave it to the agent composing the commands. A player rule taken out of a spec goes into the player's own untracked `CLAUDE.local.md`.

## Spec before code

- Any user-visible behaviour needs a spec before it is implemented, including behaviour forced by a technical constraint (e.g. the captcha that imposed browser login). Write or amend the spec first.
- Change an implemented spec in `specs/` only in the commit that makes the code meet it. A change planned for later goes into a correction spec in `specs/backlog/`, whose implementation amends or removes the implemented spec in the same commit.
- Propose the design with the fewest new components, manual user steps included, and keep every existing behaviour unless the user asks to drop it.
- Work in small batches: one atomic spec, implemented and delivered, before the next. Atomicity is mandatory, submission is not.
- When confident in a spec, commit it and implement it without waiting, then name each decision taken on the user's behalf in the end-of-increment summary. Submit it first when confidence is low, all the more for a functional spec.

## Format

Sections, in order: `Contexte`, `User story` (or `User stories`), `Critères d'acceptation` (numbered, each verifiable), then optionally `Hors périmètre`. A spec that relies on another states it in its context with a link (`Dépend de : …`).

## Backlog

Specs in `specs/backlog/` are accepted but not scheduled. Do not implement them until the user schedules one, which moves it up to `specs/`.

Record an order the user sets between backlog specs as a numbered list in `specs/backlog/README.md`, drop a spec from it when it moves up to `specs/`, and present the backlog listing in that order.

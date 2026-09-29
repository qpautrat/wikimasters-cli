# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`wkm-cli` lets an AI agent interact with [WikiMasters](https://www.wiki-masters.com), a collectible card game built from Wikipedia articles (packs, collection, duels, trades, auctions, guilds, messaging). The site has no public API: this project wraps the internal HTTP API used by its web front-end.

Status: greenfield, no code yet. Add build, lint and test commands here once the project is scaffolded.

## Stack

TypeScript on Node.

## Architecture

Two layers, kept strictly separate:

1. **Core client**: a typed wrapper over WikiMasters' internal HTTP endpoints, covering session/auth, requests and parsing responses into domain types. It is the only place that knows endpoint URLs and payload shapes, so a change on the site is fixed in one spot. It does no terminal output and no argument parsing.
2. **Adapters**: thin consumers of the core that map input to core calls and format output, with no business logic. The CLI (`wkm`) is the only adapter in scope. An MCP server is planned and must reuse the core unchanged.

A feature lands in the core first, then gets exposed through the CLI.

## Specification-driven workflow

The user states requirements as user-facing specs in `specs/`, one Markdown file per feature (context, user stories, acceptance criteria). Implement from the acceptance criteria. When a spec is ambiguous or conflicts with existing code, ask instead of guessing.

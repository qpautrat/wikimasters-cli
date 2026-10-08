# Lancer les outils de développement par mise

## Contexte

`CLAUDE.md`, la règle `.claude/rules/api-discovery.md`, le skill `wikimasters` et le message d'usage de `api:get` et `api:site` appellent `npm`, `npx`, `node` ou `jq` sans passer par mise. Dans un shell qui n'active pas mise, ces appels prennent le Node de nvm (22.14.0) au lieu du Node épinglé (24.21.0), ou un `jq` non épinglé, mesuré le 2026-10-07.

Dépend de : [Outils du dépôt](toolchain.md), [Lancer la CLI par une tâche mise](cli-mise-task.md).

## User story

En tant que développeur ou agent, chaque commande de développement que donne le dépôt s'exécute avec les outils épinglés, que mon shell active mise ou non.

## Critères d'acceptation

1. Chaque commande `npm`, `npx`, `node` ou `jq` que donnent `CLAUDE.md`, les règles de `.claude/rules/`, les skills de `.claude/skills/` et le message d'usage d'un outil de `tools/` passe par `mise exec --`, et s'exécute telle quelle depuis la racine du dépôt dans un shell dont le `PATH` ne contient ni les shims ni les outils de mise.
2. Les scripts lancés par lefthook, que le hook git lance par `mise exec -- lefthook`, restent inchangés.

## Hors périmètre

- Une tâche mise pour chaque script npm.
- Les specs qui nomment un script npm pour décrire ce qu'il fait (`npm run lint` analyse `src/`).

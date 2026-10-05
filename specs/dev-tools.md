# Outils de développement hors de `src/`

## Contexte

`src/` ne doit contenir que le code de production : le core et le CLI. Aujourd'hui, `src/dev/api-get.ts`, l'outil derrière `npm run api:get`, y vit, et `npm run build` l'écrit dans `dist/dev/`, livré avec le CLI. Node ne peut pas exécuter directement le TypeScript du core, dont les imports portent l'extension `.js`.

Dépend de : [Interroger l'API en lecture seule](api-get.md).

## User story

En tant que développeur, je range un outil de développement hors du code de production, sans qu'il soit livré avec le CLI, et il réutilise le core.

## Critères d'acceptation

1. Les outils de développement vivent dans `tools/`, à la racine du dépôt. `src/` ne contient que le core et le CLI.
2. `npm run build` n'écrit dans `dist/` que le core et le CLI.
3. Un outil importe le core et `src/cli/session.ts`, sans en dupliquer le code.
4. Le script npm qui lance un outil le compile, avec le code qu'il importe, dans un répertoire ignoré par git, puis l'exécute.
5. Compilé pour un outil, le code du CLI lit et écrit le même `.env`, à la racine du dépôt, que `wikimasters`.
6. `npm run typecheck`, `npm run lint` et `npm run format:check` couvrent `tools/`. Le hook de pre-commit refuse un commit dont les outils ne compilent pas.
7. `npm run -s api:get` garde le comportement décrit dans [Interroger l'API en lecture seule](api-get.md).
8. `CLAUDE.md` documente `tools/` et sa compilation.

# Garder le dernier build réussi quand le build échoue

## Contexte

Quand le build échoue sur une erreur de type, tsc écrit quand même le code dans `dist/` (mesuré le 2026-10-08 en ajoutant une erreur de type à `src/cli/main.ts`). `mise run wikimasters` ne lance pas la CLI après un build en échec ([Reconstruire la CLI avant chaque lancement](rebuild-before-run.md), critère 4), mais `npm run -s wikimasters` lance ensuite ce code qui n'a pas passé le build.

Dépend de : [Reconstruire la CLI avant chaque lancement](rebuild-before-run.md).

## User story

En tant que développeur, après un build en échec, `dist/` contient toujours le dernier build réussi.

## Critères d'acceptation

1. Quand `mise exec -- npm run build` échoue, aucun fichier de `dist/` n'est modifié.
2. Le build sort alors avec un code différent de 0.
3. Quand le build réussit, il écrit `dist/` comme avant.

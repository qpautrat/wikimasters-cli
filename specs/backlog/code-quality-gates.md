# Vérifications de qualité du code

## Contexte

`npm run typecheck` ne vérifie pas les fichiers de test, exclus du build. Le projet n'a ni linter ni formateur.

## User story

En tant que développeur, une seule commande me dit si le code, tests compris, est correct, propre et formaté.

## Critères d'acceptation

1. `npm run typecheck` vérifie aussi les fichiers de test et les utilitaires de test, sans les inclure dans `dist/`.
2. Un linter et un formateur (Biome) sont configurés, avec une commande pour vérifier et une pour corriger.
3. Le code existant passe ces vérifications.
4. Les commandes sont documentées dans `CLAUDE.md`.

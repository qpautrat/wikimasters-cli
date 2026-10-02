# Vérification des types des tests

## Contexte

`npm run typecheck` ne vérifie pas les fichiers de test ni `src/core/testing/`, exclus du build. Une erreur de type dans un test passe inaperçue tant que Vitest l'exécute sans vérifier les types.

## User story

En tant que développeur, `npm run typecheck` me signale une erreur de type, qu'elle soit dans le code ou dans les tests.

## Critères d'acceptation

1. `npm run typecheck` vérifie les fichiers `*.test.ts` et `src/core/testing/`, et échoue sur une erreur de type dans l'un d'eux.
2. `npm run build` n'écrit toujours aucun fichier de test ni de `testing/` dans `dist/`.
3. Le code existant passe `npm run typecheck`.

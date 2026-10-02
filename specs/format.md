# Formateur

## Contexte

Le projet n'a pas de formateur : la mise en forme dépend de l'éditeur de chacun.

## User story

En tant que développeur, une commande me dit si le code est mal formaté, et une autre le formate.

## Critères d'acceptation

1. Biome est installé en dépendance de développement, et son formateur suit le style par défaut de Prettier, le standard de l'écosystème TypeScript : indentation de deux espaces, guillemets doubles, lignes de 80 colonnes.
2. `npm run format:check` vérifie `src/` et échoue si un fichier n'est pas formaté.
3. `npm run format` formate les fichiers en place.
4. Le code existant passe `npm run format:check`.
5. Les deux commandes sont documentées dans `CLAUDE.md`.

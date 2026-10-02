# Linter

## Contexte

Le projet n'a pas de linter : rien ne signale le code mort, les imports inutilisés ou les constructions à risque.

## User story

En tant que développeur, une commande me signale les problèmes de code détectables statiquement, et une autre corrige ceux qui peuvent l'être automatiquement.

## Critères d'acceptation

1. Biome est installé en dépendance de développement, avec ses règles recommandées.
2. `npm run lint` analyse `src/` et échoue s'il trouve un problème.
3. `npm run lint:fix` applique les corrections automatiques sûres.
4. Le code existant passe `npm run lint`.
5. Les deux commandes sont documentées dans `CLAUDE.md`.

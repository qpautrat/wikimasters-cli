# Énoncer que la CLI n'a pas de règle propre

## Contexte

La CLI est un adaptateur d'utilisation de l'API du jeu, rien de plus. Les règles du jeu sont portées par l'API, et seulement par elle : une règle que l'interface web applique sans que l'API l'impose n'en est pas une. Les règles du joueur, c'est-à-dire sa manière de jouer, se trouvent dans la façon dont il utilise la CLI, jamais dans son code. Aucune règle du dépôt n'énonce ce principe, et `.claude/rules/api-discovery.md` demande même de rechercher les règles calculées par l'interface.

## User story

En tant que développeur, je trouve dans les règles du dépôt ce qu'une commande peut ou non contenir, pour qu'aucune nouvelle spec n'y fasse entrer une règle de l'interface ou du joueur.

## Critères d'acceptation

1. Le principe est énoncé dans `CLAUDE.md`, section Architecture, et dans `.claude/rules/specs.md`, pour toute nouvelle spec.
2. Une règle que l'interface web applique sans que l'API l'impose n'est pas reproduite dans le core : la commande envoie la requête et rapporte le refus de l'API.
3. `.claude/rules/api-discovery.md` ne demande plus de rechercher les règles, verrous et filtres appliqués par l'interface.

## Hors périmètre

La revue des specs existantes au regard de ce principe.

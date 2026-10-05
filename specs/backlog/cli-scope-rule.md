# Énoncer que la CLI n'a pas de règle propre

## Contexte

La CLI encadre l'API du jeu et n'a pas de règle propre. Les règles du jeu sont portées par l'API du jeu. Les règles du joueur, c'est-à-dire sa manière de jouer, se trouvent dans la façon dont il utilise la CLI, jamais dans son code. Aucune règle du dépôt n'énonce ce principe, et rien n'empêche une nouvelle spec d'y déroger.

## User story

En tant que développeur, je trouve dans les règles du dépôt ce qu'une commande peut ou non contenir, pour qu'aucune nouvelle spec n'y fasse entrer une règle du joueur.

## Critères d'acceptation

1. Le principe est énoncé dans `CLAUDE.md`, section Architecture, et dans `.claude/rules/specs.md`, pour toute nouvelle spec.
2. Une règle que l'interface web applique sans que l'API l'impose (par exemple, ne pas défausser une carte engagée dans un échange en cours) compte comme une règle du jeu et reste dans le core.

## Hors périmètre

La revue des specs existantes au regard de ce principe.

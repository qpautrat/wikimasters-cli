# Revoir les contrats des commandes au regard du rôle de la CLI

## Contexte

La CLI encadre l'API du jeu et n'a pas de règle propre. Les règles du jeu sont portées par l'API du jeu. Les règles du joueur, c'est-à-dire sa manière de jouer, se trouvent dans la façon dont il utilise la CLI, jamais dans son code.

Certaines specs font entrer des règles du joueur dans le code. `collection discard-commons` choisit la rareté à défausser et les cartes à protéger (favori, brillante, étiquetée). Le critère 6 de `auction bid` justifie une mise par une tactique (« surenchérir sur ma propre mise décourage les concurrents »). Aucune règle du dépôt n'énonce ce principe, et rien n'empêche une nouvelle spec d'y déroger.

## User story

En tant que développeur, je m'assure que chaque commande expose l'API du jeu sans y ajouter de règle du joueur, pour que le joueur décide seul de sa manière de jouer en composant les commandes.

## Critères d'acceptation

1. Le principe est énoncé dans `CLAUDE.md`, section Architecture, et dans `.claude/rules/specs.md`, pour toute nouvelle spec.
2. Une règle que l'interface web applique sans que l'API l'impose (par exemple, ne pas défausser une carte engagée dans un échange en cours) compte comme une règle du jeu et reste dans le core.
3. Chaque critère d'acceptation des specs de `specs/` et de `specs/backlog/` est classé : appel de l'API, règle du jeu, ou règle du joueur.
4. Le classement est présenté à l'utilisateur, qui valide chaque critère classé règle du joueur avant toute modification.
5. Chaque critère validé comme règle du joueur donne une spec de correction dans `specs/backlog/`, une par commande, qui le retire ou le remplace par un paramètre de la commande.
6. Une spec du backlog qui n'a pas encore été implémentée est amendée directement plutôt que corrigée par une nouvelle spec.

## Hors périmètre

- L'implémentation des specs de correction : chacune est planifiée séparément.
- Le serveur MCP prévu.

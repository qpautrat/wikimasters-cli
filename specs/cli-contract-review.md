# Revoir les contrats des commandes au regard du rôle de la CLI

## Contexte

Une spec peut faire entrer dans le code une règle de l'interface ou du joueur, par exemple choisir les cartes à défausser selon leur rareté, écarter comme l'interface les cartes engagées dans un échange, ou justifier une mise par une tactique. Chaque spec doit donc être revue au regard du rôle de la CLI.

Dépend de : [Énoncer que la CLI n'a pas de règle propre](cli-scope-rule.md).

## User story

En tant que développeur, je m'assure que chaque commande expose l'API du jeu sans y ajouter de règle de l'interface ou du joueur, pour que le joueur décide seul de sa manière de jouer en composant les commandes.

## Critères d'acceptation

1. Chaque critère d'acceptation des specs de `specs/` et de `specs/backlog/` est classé : appel de l'API, règle de l'interface, ou règle du joueur.
2. Le classement est présenté à l'utilisateur, qui valide chaque critère classé règle de l'interface ou du joueur avant toute modification.
3. Chaque critère ainsi validé donne une spec de correction dans `specs/backlog/`, une par commande, qui le retire ou le remplace par un paramètre de la commande.
4. Une spec du backlog qui n'a pas encore été implémentée est amendée directement plutôt que corrigée par une nouvelle spec.

## Hors périmètre

- L'implémentation des specs de correction : chacune est planifiée séparément.
- Le serveur MCP prévu.

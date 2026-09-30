# Sortie JSON des commandes

## Contexte

Les commandes `wkm` affichent des phrases destinées à un humain. Un agent IA qui les enchaîne a besoin d'une sortie structurée et stable.

## User story

En tant qu'agent, j'obtiens le résultat de chaque commande sous forme de JSON, pour l'exploiter sans analyser du texte.

## Critères d'acceptation

1. Toute commande `wkm` accepte l'option `--json`.
2. Avec `--json`, la sortie standard contient uniquement le résultat en JSON.
3. `wkm wishlist list --json` écrit `[{ "id": "…", "title": "…", "rarity": "…" }]`, et `[]` pour une liste vide.
4. `wkm wishlist remove <card-id> --json` écrit `{ "id": "…", "removed": true }`, ou `false` si la carte était déjà absente.
5. En cas d'erreur, le message part sur la sortie d'erreur et le code de sortie vaut 1, avec ou sans `--json`.

# Savoir si une carte de la liste de souhaits est déjà dans ma collection

## Contexte

Ma liste de souhaits peut contenir des cartes que j'ai obtenues depuis leur ajout. Elles y font du bruit et m'exposent à un doublon. `wkm wishlist list` ne dit pas si je possède déjà une carte.

Dépend de : [Lister la liste de souhaits](wishlist-list.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je vois pour chaque carte de ma liste de souhaits si elle est déjà dans ma collection, pour retirer celles que je possède et éviter les doublons.

## Critères d'acceptation

1. `wkm wishlist list` indique, sur la ligne de chaque carte, si elle est dans ma collection.
2. Une carte est dans ma collection dès que j'en possède au moins un exemplaire.
3. Avec `--json`, chaque carte porte en plus le champ `owned`, à `true` ou `false`.

## Hors périmètre

- Retirer automatiquement de la liste de souhaits les cartes possédées.
- Filtrer la liste sur ce critère : l'agent le fait à partir de la sortie JSON.

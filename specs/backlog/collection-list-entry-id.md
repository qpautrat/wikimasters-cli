# Afficher l'identifiant d'entrée des cartes de ma collection

## Contexte

Les routes du jeu qui agissent sur une carte de ma collection, comme la mise aux enchères (`POST /api/marketplace`) ou la proposition d'échange (`POST /api/trades`), attendent l'identifiant de l'entrée de ma collection (`user_cards.id`), pas celui de la carte (`cards.id`). `collection list` ne donne aujourd'hui que l'identifiant de la carte.

Dépend de : [Lister ma collection](../collection-list.md).

## User story

En tant que joueur, je lis l'identifiant d'entrée de chaque carte de ma collection, pour le passer aux commandes dont la route l'attend.

## Critères d'acceptation

1. Chaque ligne de `wikimasters collection list` donne, en plus de ce qu'elle donne déjà, l'identifiant de l'entrée de ma collection (UUID `user_cards.id`).
2. Avec `--json`, chaque carte porte cet identifiant dans un champ `entryId`.
3. Les autres informations, l'option `--rarity` et l'ordre des cartes ne changent pas.

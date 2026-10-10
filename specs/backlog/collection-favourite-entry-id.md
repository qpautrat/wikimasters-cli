# Marquer en favori une entrée de ma collection sans la rechercher

## Contexte

`wikimasters collection star` prend l'identifiant de la carte (`cards.id`), lit ma collection pour trouver l'entrée et son état, puis ne modifie l'entrée que si elle n'est pas déjà en favori. Or le jeu marque une entrée par un seul `PATCH user_cards?id=eq.<user_cards.id>` avec `{"starred":true}` : la commande compose deux appels.

Dépend de : [Marquer une carte de ma collection en favori](../collection-favourite.md), [Afficher l'identifiant d'entrée des cartes de ma collection](../collection-list-entry-id.md).

## User story

En tant que joueur, je donne l'entrée de ma collection à marquer en favori, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection star <entrée-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`.
2. La commande envoie une seule requête, `PATCH user_cards` filtrée sur cet identifiant avec `{"starred":true}`, sans lire ma collection au préalable.
3. Quand le jeu ne modifie aucune entrée (entrée inconnue ou qui n'est pas à moi), la commande échoue et le dit.
4. Le marquage fait depuis la commande apparaît dans l'interface.

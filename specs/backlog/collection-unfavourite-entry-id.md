# Retirer de mes favoris une entrée de ma collection sans la rechercher

## Contexte

`wikimasters collection unstar` prend l'identifiant de la carte (`cards.id`), lit ma collection pour trouver l'entrée et son état, puis ne modifie l'entrée que si elle est en favori. Or le jeu retire le favori par un seul `PATCH user_cards?id=eq.<user_cards.id>` avec `{"starred":false}` : la commande compose deux appels.

Dépend de : [Retirer une carte de ma collection de mes favoris](../collection-unfavourite.md), [Marquer en favori une entrée de ma collection sans la rechercher](collection-favourite-entry-id.md).

## User story

En tant que joueur, je donne l'entrée de ma collection à retirer de mes favoris, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection unstar <entrée-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`.
2. La commande envoie une seule requête, `PATCH user_cards` filtrée sur cet identifiant avec `{"starred":false}`, sans lire ma collection au préalable.
3. Quand le jeu ne modifie aucune entrée (entrée inconnue ou qui n'est pas à moi), la commande échoue et le dit.
4. Le retrait fait depuis la commande apparaît dans l'interface.

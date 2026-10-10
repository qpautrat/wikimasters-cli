# Marquer une carte de ma collection en favori

## Contexte

L'interface permet de marquer une carte de ma collection en favori (`user_cards.starred`). Je veux marquer un favori depuis le terminal. Le jeu marque une entrée par un seul `PATCH user_cards?id=eq.<user_cards.id>` avec `{"starred":true}`.

Dépend de : [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md).

## User story

En tant que joueur, je donne l'entrée de ma collection à marquer en favori, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection star <entrée-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`.
2. La commande envoie une seule requête, `PATCH user_cards` filtrée sur cet identifiant avec `{"starred":true}`, sans lire ma collection au préalable.
3. Quand le jeu ne modifie aucune entrée (entrée inconnue ou qui n'est pas à moi), la commande échoue et le dit.
4. Le marquage fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer une carte de mes favoris.
- Lister mes cartes en favori.
- Marquer plusieurs cartes en une commande.

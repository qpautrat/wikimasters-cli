# Retirer une carte de ma collection de mes favoris

## Contexte

Je veux pouvoir retirer une carte de ma collection de mes favoris (`user_cards.starred`) depuis le terminal, par exemple pour un favori marqué par erreur. Le jeu retire le favori par un seul `PATCH user_cards?id=eq.<user_cards.id>` avec `{"starred":false}`.

Dépend de : [Marquer une carte de ma collection en favori](collection-favourite.md).

## User story

En tant que joueur, je donne l'entrée de ma collection à retirer de mes favoris, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection unstar <entrée-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`.
2. La commande envoie une seule requête, `PATCH user_cards` filtrée sur cet identifiant avec `{"starred":false}`, sans lire ma collection au préalable.
3. Quand le jeu ne modifie aucune entrée (entrée inconnue ou qui n'est pas à moi), la commande échoue et le dit.
4. Le retrait fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer plusieurs cartes de mes favoris en une commande.

# Retirer une carte de ma collection de mes favoris

## Contexte

Je veux pouvoir retirer une carte de ma collection de mes favoris (`user_cards.starred`) depuis le terminal, par exemple pour un favori marqué par erreur.

Dépend de : [Marquer une carte de ma collection en favori](collection-favourite.md).

## User story

En tant que joueur, je retire une carte de ma collection de mes favoris, pour qu'elle ne soit plus protégée.

## Critères d'acceptation

1. `wikimasters collection unstar <card-id>` retire de mes favoris la carte de ma collection qui porte cet identifiant de carte.
2. Retirer une carte qui n'est pas en favori réussit sans rien modifier et le signale.
3. Une carte absente de ma collection est refusée sans rien modifier, avec un message qui le dit.
4. Le retrait fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer plusieurs cartes de mes favoris en une commande.

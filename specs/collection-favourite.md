# Marquer une carte de ma collection en favori

## Contexte

L'interface permet de marquer une carte de ma collection en favori (`user_cards.starred`). Je veux marquer un favori depuis le terminal.

## User story

En tant que joueur, je marque une carte de ma collection en favori, pour la protéger.

## Critères d'acceptation

1. `wikimasters collection star <card-id>` marque en favori la carte de ma collection qui porte cet identifiant de carte.
2. Marquer une carte déjà en favori réussit sans rien modifier et le signale.
3. Une carte absente de ma collection est refusée sans rien modifier, avec un message qui le dit.
4. Le marquage fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer une carte de mes favoris.
- Lister mes cartes en favori.
- Marquer plusieurs cartes en une commande.

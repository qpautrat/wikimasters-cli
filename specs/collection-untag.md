# Retirer une étiquette d'une carte de ma collection

## Contexte

Je veux pouvoir retirer une étiquette (`user_card_tags`) d'une carte de ma collection depuis le terminal, pour reclasser la carte.

Dépend de : [Étiqueter une carte de ma collection](collection-tag.md).

## User story

En tant que joueur, je retire une de mes étiquettes d'une carte de ma collection, pour la reclasser.

## Critères d'acceptation

1. `wikimasters collection untag <card-id> <label>` retire l'étiquette nommée `<label>` de la carte de ma collection qui porte cet identifiant de carte.
2. Retirer une étiquette absente de la carte réussit sans rien modifier et le signale.
3. Une carte absente de ma collection est refusée sans rien modifier, avec un message qui le dit.
4. Un nom qui ne correspond à aucune de mes étiquettes est refusé sans rien modifier, avec un message qui liste mes étiquettes.
5. Le retrait fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer toutes les étiquettes d'une carte en une commande.
- Supprimer une étiquette.

# Retirer une étiquette d'une carte de ma collection

## Contexte

Je veux pouvoir retirer une étiquette (`user_card_tags`) d'une entrée de ma collection depuis le terminal, pour reclasser la carte. Le jeu retire une étiquette par un seul `DELETE user_card_tags?user_card_id=eq.<user_cards.id>&tag_id=eq.<tags.id>`, dont le nombre de lignes supprimées (`Prefer: count=exact`) vaut 0 quand l'entrée n'avait pas l'étiquette.

Dépend de : [Étiqueter une carte de ma collection](collection-tag.md), [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md), [Lister mes étiquettes](label-list.md).

## User story

En tant que joueur, je donne l'entrée de ma collection et l'étiquette à en retirer, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection untag <entrée-id> <étiquette-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`, et celui d'une de mes étiquettes (UUID `tags.id`), tel que le donne `labels list`.
2. La commande envoie une seule requête, `DELETE user_card_tags`, sans lire au préalable ma collection ni mes étiquettes.
3. Quand le jeu ne supprime aucune ligne, la commande réussit sans rien modifier et signale que l'entrée n'avait pas cette étiquette.
4. Le retrait fait depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer toutes les étiquettes d'une carte en une commande.
- Supprimer une étiquette.

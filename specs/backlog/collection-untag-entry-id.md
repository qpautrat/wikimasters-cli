# Retirer une étiquette d'une entrée de ma collection sans la rechercher

## Contexte

`wikimasters collection untag` prend l'identifiant de la carte (`cards.id`) et le nom de l'étiquette, lit ma collection pour trouver l'entrée et ses étiquettes, lit mes étiquettes pour trouver celle qui porte ce nom, puis ne retire l'étiquette que si l'entrée l'a. Or le jeu retire une étiquette par un seul `DELETE user_card_tags?user_card_id=eq.<user_cards.id>&tag_id=eq.<tags.id>`, dont le nombre de lignes supprimées (`Prefer: count=exact`) vaut 0 quand l'entrée n'avait pas l'étiquette : la commande compose trois appels.

Dépend de : [Retirer une étiquette d'une carte de ma collection](../collection-untag.md), [Étiqueter une entrée de ma collection sans la rechercher](collection-tag-entry-id.md).

## User story

En tant que joueur, je donne l'entrée de ma collection et l'étiquette à en retirer, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection untag <entrée-id> <étiquette-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`, et celui d'une de mes étiquettes (UUID `tags.id`), tel que le donne `labels list`.
2. La commande envoie une seule requête, `DELETE user_card_tags`, sans lire au préalable ma collection ni mes étiquettes.
3. Quand le jeu ne supprime aucune ligne, la commande réussit sans rien modifier et signale que l'entrée n'avait pas cette étiquette.
4. Le retrait fait depuis la commande apparaît dans l'interface.

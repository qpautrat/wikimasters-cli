# Étiqueter une entrée de ma collection sans la rechercher

## Contexte

`wikimasters collection tag` prend l'identifiant de la carte (`cards.id`) et le nom de l'étiquette, lit ma collection pour trouver l'entrée et ses étiquettes, lit mes étiquettes pour trouver celle qui porte ce nom, puis ne pose l'étiquette que si l'entrée ne l'a pas. Or le jeu pose une étiquette par un seul `POST user_card_tags` avec `{"user_card_id": <user_cards.id>, "tag_id": <tags.id>}` : la commande compose trois appels. La réponse du jeu à une étiquette déjà posée n'a pas été observée.

Dépend de : [Étiqueter une carte de ma collection](../collection-tag.md), [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md), [Lister mes étiquettes](label-list.md).

## User story

En tant que joueur, je donne l'entrée de ma collection et l'étiquette à y poser, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters collection tag <entrée-id> <étiquette-id>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`, et celui d'une de mes étiquettes (UUID `tags.id`), tel que le donne `labels list`.
2. La commande envoie une seule requête, `POST user_card_tags`, sans lire au préalable ma collection ni mes étiquettes.
3. Quand le jeu refuse la pose (entrée ou étiquette inconnue ou qui n'est pas à moi, étiquette déjà posée), la commande échoue en affichant le motif donné par le jeu.
4. L'étiquette posée depuis la commande apparaît dans l'interface.

# Supprimer une étiquette par son identifiant

## Contexte

`wikimasters labels delete` prend le nom de l'étiquette, lit mes étiquettes pour trouver celle qui le porte, puis appelle `POST rpc/delete_tag` avec son identifiant : la commande compose deux appels. La fonction prend directement l'identifiant (`{"p_tag_id": <tags.id>}`) et refuse elle-même un identifiant inconnu ou qui n'est pas à moi (HTTP 400 `P0001` `Tag not found or not owned by caller`).

Dépend de : [Supprimer une étiquette](../label-delete.md), [Lister mes étiquettes](label-list.md).

## User story

En tant que joueur, je donne l'identifiant de l'étiquette à supprimer, et la commande l'envoie tel quel au jeu.

## Critères d'acceptation

1. `wikimasters labels delete <étiquette-id>` prend l'identifiant d'une de mes étiquettes (UUID `tags.id`), tel que le donne `labels list`.
2. La commande envoie une seule requête, `POST rpc/delete_tag`, sans lire mes étiquettes au préalable.
3. Quand le jeu refuse la suppression (étiquette inconnue ou qui n'est pas à moi), la commande échoue en affichant le motif donné par le jeu.
4. Avec `--json`, stdout porte l'identifiant de l'étiquette supprimée.
5. Les autres critères de la commande ne changent pas.

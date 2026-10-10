# Supprimer une étiquette

## Contexte

`wikimasters labels create` crée une étiquette, mais seule l'interface la supprime. L'interface appelle la fonction RPC `delete_tag` avec l'identifiant de l'étiquette (`p_tag_id`), après avoir annoncé de combien de cartes elle sera retirée (JavaScript du site, lu le 2026-10-08).

Dépend de : [Créer une étiquette](label-create.md), [Lister mes étiquettes](label-list.md).

## User story

En tant que joueur, je supprime une de mes étiquettes depuis le terminal, pour retirer un classement dont je ne veux plus.

## Critères d'acceptation

1. `wikimasters labels delete <étiquette-id>` supprime mon étiquette dont l'identifiant (UUID `tags.id`) est celui que donne `labels list`, en une seule requête, `POST rpc/delete_tag`, sans lire mes étiquettes au préalable.
2. Les cartes de ma collection qui portaient l'étiquette ne la portent plus.
3. Quand le jeu refuse la suppression, étiquette inconnue ou qui n'est pas à moi comprise, la commande échoue en affichant le motif donné par le jeu, sans rien supprimer.
4. L'étiquette supprimée disparaît de l'interface.
5. Avec `--json`, stdout porte l'identifiant de l'étiquette supprimée.

## Hors périmètre

- Renommer ou recolorer une étiquette.
- Lister mes étiquettes.

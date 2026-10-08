# Supprimer une étiquette

## Contexte

`wikimasters labels create` crée une étiquette, mais seule l'interface la supprime. L'interface appelle la fonction RPC `delete_tag` avec l'identifiant de l'étiquette (`p_tag_id`), après avoir annoncé de combien de cartes elle sera retirée (JavaScript du site, lu le 2026-10-08).

Dépend de : [Créer une étiquette](../label-create.md).

## User story

En tant que joueur, je supprime une de mes étiquettes depuis le terminal, pour retirer un classement dont je ne veux plus.

## Critères d'acceptation

1. `wikimasters labels delete <name>` supprime mon étiquette nommée `<name>`.
2. Les cartes de ma collection qui portaient l'étiquette ne la portent plus.
3. Supprimer une étiquette que je n'ai pas réussit sans rien supprimer et le signale.
4. Un refus du jeu est rapporté avec sa raison, sans rien supprimer.
5. L'étiquette supprimée disparaît de l'interface.
6. Avec `--json`, stdout porte le nom de l'étiquette et un champ indiquant si elle vient d'être supprimée.

## Hors périmètre

- Renommer ou recolorer une étiquette.
- Lister mes étiquettes.

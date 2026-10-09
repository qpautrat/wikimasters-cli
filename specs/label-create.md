# Créer une étiquette

## Contexte

`wikimasters collection tag` ne pose qu'une étiquette que j'ai déjà créée ([Étiqueter une carte de ma collection](collection-tag.md), critère 4). L'interface crée les étiquettes dans la table `tags` (`id`, `user_id`, `name`, `color`, `created_at`, lue le 2026-10-05). Pour classer une nouvelle collection thématique, par exemple les joueurs de la Karmine Corp 2026, je dois d'abord créer son étiquette dans l'interface : aucune commande ne le fait.

Dépend de : [Étiqueter une carte de ma collection](collection-tag.md).

## User story

En tant que joueur, je crée une étiquette depuis le terminal, pour la poser ensuite sur les cartes d'une collection thématique.

## Critères d'acceptation

1. `wikimasters labels create <name>` crée une étiquette nommée `<name>` parmi les miennes.
2. L'option `--color <couleur>` transmet au jeu la couleur de l'étiquette, telle quelle ; sans elle, la commande n'en transmet aucune.
3. Quand le jeu refuse la création comme un doublon et qu'une de mes étiquettes porte exactement le nom donné, la commande réussit sans rien créer et signale cette étiquette.
4. Un refus du jeu est rapporté avec sa raison, sans rien créer, y compris un refus pour doublon quand aucune de mes étiquettes ne porte exactement le nom donné.
5. La commande transmet le nom au jeu tel que donné, sans le modifier.
6. L'étiquette créée apparaît dans l'interface et `wikimasters collection tag <card-id> <name>` la pose.
7. Avec `--json`, stdout porte l'étiquette avec ses champs `name` et `color`, et un champ indiquant si elle vient d'être créée.

## Hors périmètre

- Renommer, recolorer ou supprimer une étiquette.
- Lister mes étiquettes.
- Retrouver une étiquette dont le nom ne diffère que par les majuscules.

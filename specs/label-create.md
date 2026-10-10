# Créer une étiquette

## Contexte

`wikimasters collection tag` ne pose qu'une étiquette que j'ai déjà créée ([Étiqueter une carte de ma collection](collection-tag.md), critère 4). L'interface crée les étiquettes dans la table `tags` (`id`, `user_id`, `name`, `color`, `created_at`, lue le 2026-10-05). Pour classer une nouvelle collection thématique, par exemple les joueurs de la Karmine Corp 2026, je dois d'abord créer son étiquette dans l'interface : aucune commande ne le fait.

Dépend de : [Étiqueter une carte de ma collection](collection-tag.md).

## User story

En tant que joueur, je crée une étiquette depuis le terminal, pour la poser ensuite sur les cartes d'une collection thématique.

## Critères d'acceptation

1. `wikimasters labels create <name>` crée une étiquette nommée `<name>` parmi les miennes, en une seule requête, `POST tags`, sans lire mes étiquettes avant ni après.
2. L'option `--color <couleur>` transmet au jeu la couleur de l'étiquette, telle quelle ; sans elle, la commande n'en transmet aucune.
3. La commande affiche l'étiquette créée avec son identifiant (UUID `tags.id`), son nom et sa couleur.
4. Quand le jeu refuse la création, doublon compris, la commande échoue en affichant le motif donné par le jeu, sans rien créer.
5. La commande transmet le nom au jeu tel que donné, sans le modifier.
6. L'étiquette créée apparaît dans l'interface et `wikimasters collection tag <card-id> <name>` la pose.
7. Avec `--json`, stdout porte l'étiquette créée avec ses champs `id`, `name` et `color`.

## Hors périmètre

- Renommer, recolorer ou supprimer une étiquette.
- Lister mes étiquettes.
- Retrouver une étiquette dont le nom ne diffère que par les majuscules.

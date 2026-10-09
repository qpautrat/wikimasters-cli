# Créer une étiquette en une seule requête

## Contexte

Quand le jeu refuse la création comme un doublon (HTTP 409 `23505`, nom déjà pris sans tenir compte de la casse), `wikimasters labels create` relit mes étiquettes et réussit si l'une porte exactement le nom donné : la commande compose deux appels. La création (`POST tags`, `Prefer: return=representation`) renvoie l'étiquette créée, mais la commande n'en demande ni n'en affiche l'identifiant (`tags.id`), que le jeu attend pour poser, retirer ou supprimer une étiquette.

Dépend de : [Créer une étiquette](../label-create.md).

## User story

En tant que joueur, je crée une étiquette et j'obtiens ce que le jeu renvoie, identifiant compris, ou son refus.

## Critères d'acceptation

1. `wikimasters labels create <name>` envoie une seule requête, `POST tags`, sans lire mes étiquettes avant ni après.
2. La commande affiche l'étiquette créée avec son identifiant (UUID `tags.id`), son nom et sa couleur.
3. Quand le jeu refuse la création, doublon compris, la commande échoue en affichant le motif donné par le jeu.
4. Avec `--json`, stdout porte l'étiquette créée avec ses champs `id`, `name` et `color`.
5. Les autres critères de la commande ne changent pas.

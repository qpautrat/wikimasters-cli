# Lister mes étiquettes

## Contexte

Le jeu pose et retire une étiquette par son identifiant (`tags.id`). Aucune commande ne le donne : `collection list` et `labels create` ne donnent que le nom. Le jeu lit mes étiquettes avec `GET tags`, filtrée sur mon identifiant de joueur.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je liste mes étiquettes avec leur identifiant, pour les passer aux commandes qui les posent ou les retirent.

## Critères d'acceptation

1. `wikimasters labels list` envoie une seule requête et affiche chacune de mes étiquettes avec son identifiant (UUID `tags.id`), son nom et sa couleur.
2. Aucune étiquette n'est pas une erreur : la commande le signale.
3. Avec `--json`, stdout porte la liste des étiquettes, chacune avec ses champs `id`, `name` et `color`.

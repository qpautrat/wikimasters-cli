# Parcourir les pages d'une recherche d'enchères

## Contexte

`wikimasters auction search` n'affiche que la première page de ce que le jeu renvoie ([Rechercher des enchères](../auction-search.md), hors périmètre). Le jeu cherche aussi dans la catégorie de la carte : le 2026-10-08, `auction search caliste` renvoie 50 enchères, surtout des syndicalistes, et signale que d'autres correspondent ; `auction search canna` renvoie surtout du cannabis. Une enchère sur la carte que je cherche peut se trouver au-delà, sans moyen de l'atteindre. `GET /api/marketplace` prend un paramètre `page`, que le cœur fixe à `1`.

Dépend de : [Rechercher des enchères](../auction-search.md).

## User story

En tant que joueur, je lis la page suivante d'une recherche d'enchères, pour retrouver une enchère que la première page ne montre pas.

## Critères d'acceptation

1. L'option `--page <p>` de `wikimasters auction search` transmet au jeu le numéro de page `<p>`, 1 par défaut, avec le texte et la limite donnés.
2. Une valeur qui n'est pas un entier strictement positif est refusée sans interroger le jeu.
3. La commande affiche les enchères de cette page dans l'ordre du jeu et signale quand le jeu indique que d'autres enchères correspondent au-delà.
4. Une page au-delà des enchères trouvées n'est pas une erreur : la commande signale qu'aucune enchère n'est trouvée et sort avec le code 0.
5. Le commit qui implémente cette spec retire « Parcourir les enchères au-delà des `<n>` premières » du hors périmètre de [Rechercher des enchères](../auction-search.md) et y ajoute ces critères.

## Hors périmètre

- Lire toutes les pages en une seule commande.

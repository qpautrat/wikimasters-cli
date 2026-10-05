# Lister ma collection

## Contexte

Pour choisir les cartes à défausser, l'agent doit voir ma collection avec ce qui distingue chaque carte : rareté possédée, favori, brillance, étiquettes, date d'obtention. Aucune commande ne la donne aujourd'hui.

Une carte possédée garde la rareté qu'elle avait à son obtention (`user_cards.snapshot_rarity`), qui peut différer de sa rareté actuelle au catalogue.

## User story

En tant que joueur, je consulte les cartes de ma collection et ce qui les distingue, pour choisir celles sur lesquelles agir.

## Critères d'acceptation

1. `wikimasters collection list` affiche une ligne par carte de ma collection, quel que soit le nombre de pages qu'elle occupe dans l'interface.
2. Chaque ligne donne l'identifiant unique de la carte (UUID `cards.id`), son titre, sa rareté possédée, son nombre d'exemplaires, si elle est en favori, si elle est brillante, ses étiquettes et sa date d'obtention.
3. L'option `--rarity <code>` ne liste que les cartes de cette rareté possédée.
4. Les cartes sont triées par date d'obtention, la plus ancienne en premier.
5. Une collection vide, ou sans carte de la rareté demandée, n'est pas une erreur : la commande le signale et sort avec le code 0.
6. Avec `--json`, stdout porte la liste des cartes, chacune avec ces informations dans des champs distincts.

## Hors périmètre

- Filtrer sur d'autres critères que la rareté : l'agent le fait à partir de la sortie JSON.
- Les statistiques de la collection.

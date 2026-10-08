# Rechercher des enchères

## Contexte

Pour miser sur la carte que je cherche, je dois retrouver ses enchères. `wikimasters auction list` ne filtre que sur le statut, alors que l'interface du marché propose un champ de recherche. Ce champ envoie `GET /api/marketplace?q=<texte>&page=<p>&limit=50&sort=<tri>` au site (JavaScript de la page `/marketplace`, observé le 2026-10-05).

Dépend de : [Lister les enchères](auction-list.md).

## User story

En tant que joueur, je donne un texte et j'obtiens les enchères qui y correspondent pour le jeu, avec leur identifiant, pour consulter ou miser sur l'une d'elles.

## Critères d'acceptation

1. `wikimasters auction search <texte...>` transmet le texte au jeu, tel quel et mots joints par une espace, comme le fait le champ de recherche de l'interface, et affiche les enchères que le jeu renvoie, dans son ordre.
2. La commande ne filtre ni ne trie elle-même les enchères renvoyées : la correspondance avec le texte et le statut des enchères sont ceux que le jeu applique.
3. L'option `--limit <n>` fixe le nombre maximal d'enchères affichées, 50 par défaut comme dans l'interface ; une valeur qui n'est pas un entier strictement positif est refusée sans interroger le jeu.
4. La commande signale quand le jeu indique que d'autres enchères correspondent au-delà de celles affichées.
5. Chaque ligne donne les mêmes informations qu'une ligne de `wikimasters auction list`.
6. Aucune enchère trouvée n'est pas une erreur : la commande le signale et sort avec le code 0.
7. Avec `--json`, stdout porte la liste des enchères trouvées, chacune avec ces informations dans des champs distincts, et un champ indiquant si d'autres enchères correspondent.
8. L'option `--page <p>` transmet au jeu le numéro de page `<p>`, 1 par défaut, avec le texte et la limite donnés.
9. Une valeur de `--page` qui n'est pas un entier strictement positif est refusée sans interroger le jeu.
10. La commande affiche les enchères de cette page dans l'ordre du jeu et signale quand le jeu indique que d'autres enchères correspondent au-delà.
11. Une page au-delà des enchères trouvées n'est pas une erreur : la commande signale qu'aucune enchère n'est trouvée et sort avec le code 0.

## Hors périmètre

- Les autres filtres de l'interface : rareté, tri, enchères qui me concernent.
- Lire toutes les pages en une seule commande.
- Rechercher une carte du catalogue, couvert par `wikimasters cards search`.

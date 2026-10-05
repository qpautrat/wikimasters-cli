# Lister les enchères

## Contexte

Pour consulter ou miser sur une enchère, `wikimasters auction show` et `wikimasters auction bid` demandent son identifiant, que je dois aujourd'hui retrouver dans l'interface. Je veux lister les enchères depuis le terminal, filtrées sur leur statut (`auctions.status` : `active`, `settled_sold`, `settled_unsold`, `cancelled`, voir `docs/api.md`).

Chaque statut compte plus de 100 000 enchères, et l'API dépasse son délai quand on lit la table sans filtrer sur le statut (observé le 2026-10-05).

Dépend de : [Consulter une enchère](../auction-show.md).

## User story

En tant que joueur, je liste les enchères, au besoin d'un seul statut, pour obtenir leur identifiant et leur état sans passer par l'interface.

## Critères d'acceptation

1. `wikimasters auction list` affiche une ligne par enchère, dans l'ordre où l'API les renvoie.
2. L'option `--limit <n>` fixe le nombre maximal d'enchères affichées, 50 par défaut comme dans l'interface ; une valeur qui n'est pas un entier strictement positif est refusée sans interroger le jeu.
3. L'option `--status <statut>` ne liste que les enchères de ce statut ; la commande transmet la valeur au jeu sans la vérifier, et rapporte ce que l'API répond, liste vide ou refus.
4. Sans `--status`, la commande lit les enchères de tous les statuts ; quand l'API dépasse son délai, la commande échoue avec le motif donné par l'API.
5. Chaque ligne donne l'identifiant unique de l'enchère (UUID `auctions.id`), le titre de la carte, la rareté et la brillance de l'exemplaire mis en vente, le statut, l'heure de fin, le prix de départ et la mise actuelle, ou l'absence de mise.
6. Chaque ligne indique si je suis le meilleur enchérisseur et si j'en suis le vendeur.
7. Aucune enchère à lister n'est pas une erreur : la commande le signale et sort avec le code 0.
8. Avec `--json`, stdout porte la liste des enchères, chacune avec ces informations dans des champs distincts, et `[]` pour une liste vide.

## Hors périmètre

- Filtrer sur d'autres critères que le statut (rareté, brillance, vendeur, heure de fin, enchères que je mène) : ils seront ajoutés selon les besoins.
- Choisir l'ordre des enchères.
- Parcourir les enchères au-delà des `<n>` premières.
- La mise minimale que le jeu accepterait, donnée par `wikimasters auction show`.

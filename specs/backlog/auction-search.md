# Rechercher des enchères

## Contexte

Pour miser sur la carte que je cherche, je dois retrouver ses enchères. `wikimasters auction list` ne filtre que sur le statut, alors que l'interface du marché propose un champ de recherche. Ce champ envoie `GET /api/marketplace?q=<texte>&page=<p>&limit=50&sort=<tri>` au site (JavaScript de la page `/marketplace`, observé le 2026-10-05).

Dépend de : [Lister les enchères](../auction-list.md).

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

## Hors périmètre

- Les autres filtres de l'interface : rareté, tri, enchères qui me concernent.
- Parcourir les enchères au-delà des `<n>` premières.
- Rechercher une carte du catalogue, couvert par `wikimasters cards search`.

## Questions ouvertes

1. **Sur quoi porte la recherche ?** Les critères laissent le jeu en décider en passant par la route de l'interface. Observé le 2026-10-05 : `q` cherche dans `auctions.snapshot_search_document`, qui joint le titre de la carte et sa catégorie en minuscules sans accents (`sidh concept de l'autre monde dans la mythologie celtique`) ; `q=Musique` et `q=genre musical` trouvent des enchères, sans tenir compte de la casse. Écarté : chercher sur le seul titre de la carte (`cards(wikipedia_title)`) en PostgREST, ce qui s'écarte de ce que fait l'interface.
2. **Quelle route appeler ?** Les critères retiennent la route du site `GET /api/marketplace`. Écarté : un filtre PostgREST sur `auctions.snapshot_search_document` (`fts.celtique` avec `status=eq.active` répond) ; il exige de choisir l'opérateur (`fts`, `ilike`) et de filtrer sur le statut pour éviter le dépassement de délai observé sans filtre de statut.
3. **Commande distincte ou option de `auction list` ?** Les critères retiennent une commande `auction search`, sur le modèle de `cards search`, puisqu'elle appelle une autre route. Écarté : une option `--search <texte>` de `auction list`.
4. **Combinaison avec `--status` ?** Les critères ne la proposent pas : sur deux recherches de 50 résultats chacune, la route n'a renvoyé que des enchères `active`, et l'interface n'envoie aucun paramètre de statut. Écarté : une option `--status`, à reprendre si la route s'avère en accepter un. `--limit` est retenu, transmis comme `limit` de la route.

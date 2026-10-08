# Rechercher une carte par sa catégorie ou son résumé

## Contexte

`wikimasters cards search` ne cherche que dans le titre de la carte ([Retrouver une carte par son nom](../card-search.md), hors périmètre). Pour une collection thématique, je ne connais pas d'avance le titre des cartes qui en font partie. Chaque carte du catalogue porte une `category` et un `summary` tirés de son article Wikipédia (lus le 2026-10-08). Le même jour, la lecture de `cards?summary=ilike.*Karmine*` a renvoyé Canna, Caliste, Kyeahoo, Busio, Targamas et Karmine Corp, mêlés à Karminek et Aleksandr Karmine.

Dépend de : [Retrouver une carte par son nom](../card-search.md).

## User story

En tant que joueur, je cherche un texte dans la catégorie ou le résumé des cartes du catalogue, pour découvrir les cartes d'un thème dont je ne connais pas les titres.

## Critères d'acceptation

1. L'option `--in <champ>` de `wikimasters cards search` choisit où chercher le texte : `title` (par défaut), `category` ou `summary`.
2. Une carte correspond quand le champ choisi contient le texte donné, sans tenir compte de la casse.
3. Une valeur de `--in` hors de cette liste est refusée sans interroger le jeu, avec un message qui donne les valeurs acceptées.
4. Avec `--in category` ou `--in summary`, les résultats sont triés par titre ; avec `--in title`, la commande se comporte comme aujourd'hui.
5. Les résultats, leur limite à 50, le signal de troncature et la sortie `--json` restent ceux de [Retrouver une carte par son nom](../card-search.md).
6. Le commit qui implémente cette spec retire la catégorie du hors périmètre de [Retrouver une carte par son nom](../card-search.md) et y ajoute ces critères.

## Hors périmètre

- Afficher la catégorie ou le résumé des cartes trouvées.
- Chercher dans plusieurs champs à la fois.
- La recherche sur la rareté.

# Retrouver une carte par son nom

## Contexte

Les commandes qui agissent sur une carte, comme `wikimasters wishlist add`, prennent son identifiant unique, que je ne connais pas. Je connais le nom de la carte, c'est-à-dire le titre de l'article Wikipédia dont elle est tirée. Le catalogue compte plus de 100 000 cartes : la recherche doit se faire côté API.

Pour une collection thématique, je ne connais pas d'avance le titre des cartes qui en font partie. Chaque carte du catalogue porte une `category` et un `summary` tirés de son article Wikipédia.

Dépend de : [Sortie JSON des commandes](json-output.md).

## User stories

- En tant que joueur, je donne tout ou partie du nom d'une carte et j'obtiens les cartes du catalogue qui correspondent avec leur identifiant, pour agir ensuite sur l'une d'elles.
- En tant que joueur, je cherche un texte dans la catégorie ou le résumé des cartes du catalogue, pour découvrir les cartes d'un thème dont je ne connais pas les titres.

## Critères d'acceptation

1. `wikimasters cards search <texte>` cherche dans le catalogue de toutes les cartes du jeu, que je les possède ou non.
2. Avec `--in title`, une carte correspond quand son nom contient le texte donné, sans tenir compte de la casse.
3. Chaque résultat affiche l'identifiant unique de la carte (UUID `cards.id`), son titre et sa rareté.
4. Avec `--in title`, une carte dont le nom est exactement le texte donné, à la casse près, apparaît en premier.
5. La commande affiche au plus 50 résultats et signale quand d'autres cartes correspondent.
6. Une recherche sans résultat réussit et le dit.
7. Avec `--json`, stdout porte la liste des cartes trouvées, chacune avec ses champs `id`, `title` et `rarity`, et un champ indiquant si la liste est tronquée.
8. L'option `--in <champ>` choisit où chercher le texte : `title` (par défaut), `category` ou `summary`, la catégorie et le résumé tirés de l'article Wikipédia de la carte.
9. Une carte correspond quand le champ choisi contient le texte donné, sans tenir compte de la casse.
10. Une valeur de `--in` hors de cette liste est refusée sans interroger le jeu, avec un message qui donne les valeurs acceptées.
11. Avec `--in category` ou `--in summary`, les résultats sont triés par titre ; avec `--in title`, la commande se comporte comme décrit aux critères 1 à 7.
12. Avec `--in category` ou `--in summary`, les résultats, leur limite à 50, le signal de troncature et la sortie `--json` restent ceux des critères 3, 5, 6 et 7.

## Hors périmètre

- La recherche sans tenir compte des accents ou tolérante aux fautes de frappe.
- La recherche sur la rareté.
- Afficher la catégorie ou le résumé des cartes trouvées.
- Chercher dans plusieurs champs à la fois.
- La pagination au-delà des 50 premiers résultats.

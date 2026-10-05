# Retrouver une carte par son nom

## Contexte

Les commandes qui agissent sur une carte, comme `wikimasters wishlist add`, prennent son identifiant unique, que je ne connais pas. Je connais le nom de la carte, c'est-à-dire le titre de l'article Wikipédia dont elle est tirée. Le catalogue compte plus de 100 000 cartes : la recherche doit se faire côté API.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne tout ou partie du nom d'une carte et j'obtiens les cartes du catalogue qui correspondent avec leur identifiant, pour agir ensuite sur l'une d'elles.

## Critères d'acceptation

1. `wikimasters cards search <nom>` cherche dans le catalogue de toutes les cartes du jeu, que je les possède ou non.
2. Une carte correspond quand son nom contient le texte donné, sans tenir compte de la casse.
3. Chaque résultat affiche l'identifiant unique de la carte (UUID `cards.id`), son titre et sa rareté.
4. Une carte dont le nom est exactement le texte donné, à la casse près, apparaît en premier.
5. La commande affiche au plus 50 résultats et signale quand d'autres cartes correspondent.
6. Une recherche sans résultat réussit et le dit.
7. Avec `--json`, stdout porte la liste des cartes trouvées, chacune avec ses champs `id`, `title` et `rarity`, et un champ indiquant si la liste est tronquée.

## Hors périmètre

- La recherche sans tenir compte des accents ou tolérante aux fautes de frappe.
- La recherche sur d'autres critères que le nom (rareté, catégorie).
- La pagination au-delà des 50 premiers résultats.

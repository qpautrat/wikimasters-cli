# Chercher dans la Collection Globale

## Contexte

Pour compléter un ensemble de cartes, je cherche celles qui me manquent chez mes amis, pour leur proposer un échange. La page « Collection Globale » du jeu (`/global-collection`) appelle `GET /api/cards?page=<n>&q=<texte>&sort=<champ>`, avec `rarity=<code>` pour chaque rareté filtrée et `wishlist=1` pour ne garder que les cartes de ma liste de souhaits. La réponse donne au plus 50 cartes par page (`cards`), `searchHasMore` quand d'autres correspondent, `total`, `rarityCounts`, les cartes que je possède (`ownedCardIds`) et que je souhaite (`wishlistCardIds`), les échanges en attente (`friendPendingOfferKeys`) et, dans `friendOwners`, pour chaque carte trouvée qu'au moins un ami possède, ces amis avec leur identifiant, leur pseudo et les raretés qu'ils en possèdent, par exemple `{"<card id>":[{"id":"…","username":"LucasPerso","rarities":["R"]}]}`. Le texte est cherché dans le titre et la catégorie, pas dans le résumé (observé le 2026-10-09).

Cette route est distincte de la lecture de la table `cards` que fait `wikimasters cards search`, qui reste inchangée.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je cherche une carte, ou les cartes de ma liste de souhaits, dans la Collection Globale, et j'obtiens ce que le jeu en dit, dont les amis qui la possèdent et en quelle rareté, pour leur proposer un échange.

## Critères d'acceptation

1. `wikimasters cards global [texte]` envoie `GET /api/cards` avec le texte donné, ou sans texte.
2. Les options `--page <n>`, `--sort <champ>`, `--rarity <code>` (répétable) et `--wishlist` transmettent au jeu, tels quels, la page, le tri, chaque rareté et le filtre sur ma liste de souhaits.
3. La commande envoie une seule requête et affiche les cartes de la page demandée.
4. Chaque carte affiche son identifiant unique (UUID `cards.id`), son titre, sa rareté, si je la possède, si elle est dans ma liste de souhaits et, pour chaque ami qui la possède, son identifiant, son pseudo et les raretés qu'il en possède.
5. La commande affiche aussi le nombre total de cartes quand le jeu le donne, le décompte par rareté, les échanges en attente et si d'autres pages correspondent.
6. Une recherche sans résultat réussit et le dit.
7. Quand le jeu refuse la recherche, la commande échoue en affichant le motif donné par le jeu.
8. Avec `--json`, stdout porte `cards`, une liste d'objets `id`, `title`, `rarity`, `owned`, `wishlisted` et `friends` (liste d'objets `id`, `username`, `rarities`, vide quand aucun ami ne la possède), ainsi que `total`, `rarityCounts`, `pendingOfferKeys` et `hasMore`.

# Lister mes échanges

## Contexte

Quand un joueur me propose un échange, la notification `trade_offer` de `notifications list` donne l'identifiant de l'échange et le joueur qui le propose, mais pas son contenu. `trade accept`, `trade cancel` et `trade propose --counter` agissent sur un échange sans qu'aucune commande ne montre ce qu'il contient. La page `/trades` du site lit `GET /api/trades`, qui liste mes échanges avec leur statut et les cartes de chacun (observé le 2026-10-17).

Dépend de : [Proposer un échange](trade-propose.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je lis les échanges que j'ai proposés et ceux qu'on m'a proposés, avec leur contenu, pour décider de les accepter, de les annuler ou d'y répondre par une contre-offre.

## Critères d'acceptation

1. `wikimasters trade list` envoie une seule requête et affiche mes échanges, proposés et reçus.
2. Chaque échange donne son identifiant, tel que le prennent `trade accept`, `trade cancel` et `trade propose --counter`, son statut, sa date, le joueur qui le propose, celui qui le reçoit et, le cas échéant, l'échange auquel il répond.
3. Chaque échange donne, pour chacun des deux joueurs, les cartes qu'il donne, chacune avec son entrée de collection, son identifiant de carte et son titre, et les wikibidous qu'il donne.
4. Une liste vide n'est pas une erreur : la commande le signale et sort avec le code 0.
5. Quand le jeu refuse la lecture, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte la liste des échanges avec les données des critères 2 et 3.

## Décisions et code

- `listTrades` (`src/core/trade-list.ts`) envoie `GET /api/trades` sans paramètre et rend les échanges dans l'ordre du jeu. Chaque `Trade` porte `tradeId`, `status`, `createdAt`, `initiator` et `recipient`, et `counterTo` (`null` hors contre-offre). Chaque côté (`TradeSide`) porte `playerId`, `username`, `cards` (des `TradeGivenCard` : `entryId`, `cardId`, `title`, tirés des `items` dont `offered_by` est ce joueur) et `wikibidous`.
- Une réponse dont un échange, un joueur ou une carte n'a pas la forme attendue fait échouer toute la commande (`unexpected response`), comme `friend list`.
- Les statuts ne sont pas filtrés : la commande rend tous les échanges que le jeu renvoie, proposés et reçus, `pending` ou non.
- Texte : une ligne d'en-tête par échange (identifiant, statut, date, contre-offre), puis ce que donne chaque joueur : ses cartes, puis ses wikibidous seulement s'ils sont supérieurs à 0 ; `nothing` quand un joueur ne donne ni carte ni wikibidous. Avec `--json`, stdout porte la liste des `Trade`.

## Hors périmètre

- Refuser un échange reçu.

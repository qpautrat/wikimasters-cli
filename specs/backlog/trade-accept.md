# Accepter un échange

## Contexte

Un autre joueur peut me proposer un échange : je reçois une notification qui porte son identifiant. `wikimasters trade propose` propose un échange et `wikimasters trade cancel` annule un des miens, mais aucune commande n'accepte un échange reçu.

Dépend de : [Proposer un échange](../trade-propose.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'un échange qu'un autre joueur m'a proposé, et la commande l'accepte.

## Critères d'acceptation

1. `wikimasters trade accept <échange-id>` prend l'identifiant de l'échange, tel que le donne le `trade_id` d'une notification de `notifications list`.
2. La commande envoie une seule requête, sans vérifier au préalable le statut de l'échange ni qui l'a proposé.
3. La commande affiche l'identifiant de l'échange et le statut renvoyé par le jeu.
4. Quand le jeu refuse l'acceptation, la commande échoue en affichant le motif donné par le jeu.
5. Avec `--json`, stdout porte `{ "tradeId": "…", "status": "…" }`, où `status` est le statut renvoyé par le jeu.

## Hors périmètre

- Refuser un échange reçu.
- Lister mes échanges.

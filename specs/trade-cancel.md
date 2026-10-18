# Annuler un de mes échanges

## Contexte

`wikimasters trade propose` propose un échange, et aucune commande ne l'annule. La page `/trades` l'annule par `PATCH /api/trades/<id>` avec `{"action":"cancel"}`. Le 2026-10-17, sur un échange `pending` que j'avais proposé, la route a répondu HTTP 200 `{"status":"cancelled"}`, et la carte que j'offrais est restée dans ma collection sous la même entrée. La page traite `human_verification_required` en affichant un captcha et affiche `error` sinon. Le 2026-10-18, un échange déjà annulé et un échange accepté ont reçu HTTP 409 `{"error":"Cet échange n'est plus en attente"}`. La réponse du jeu pour un échange proposé par un autre joueur n'est pas établie.

Dépend de : [Proposer un échange](trade-propose.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'un échange que j'ai proposé, et la commande l'annule.

## Critères d'acceptation

1. `wikimasters trade cancel <échange-id>` prend l'identifiant de l'échange, tel que le donne `trade propose` ou le `trade_id` d'une notification de `notifications list`.
2. La commande envoie une seule requête, sans vérifier au préalable le statut de l'échange ni qui l'a proposé.
3. La commande affiche l'identifiant de l'échange et le statut renvoyé par le jeu.
4. Quand le jeu refuse l'annulation (vérification humaine demandée, échange qui n'est plus en attente), la commande échoue en affichant le motif donné par le jeu.
5. Avec `--json`, stdout porte `{ "tradeId": "…", "status": "cancelled" }`, où `status` est le statut renvoyé par le jeu.

## Hors périmètre

- Accepter ou refuser un échange reçu (`PATCH /api/trades/<id>` avec une autre `action`).
- Lister mes échanges (`GET /api/trades`).

# Annuler une de mes enchères

## Contexte

`wikimasters auction create` met une carte de ma collection aux enchères, et aucune commande ne l'annule. La page d'une enchère (`/marketplace/<id>`) l'annule par `DELETE /api/marketplace/<id>`. Le 2026-10-09, sur une de mes enchères en cours sans mise, la route a répondu HTTP 200 `{"status":"cancelled"}` ; l'enchère est ensuite passée au statut `cancelled` et la carte est revenue dans ma collection, sous un nouvel identifiant d'entrée et avec `obtained_at` à l'heure de l'annulation. La réponse du jeu pour une enchère avec mises, l'enchère d'un autre joueur ou une enchère terminée n'est pas établie.

Dépend de : [Mettre une carte aux enchères](../auction-create.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une de mes enchères, et la commande l'annule pour que la carte revienne dans ma collection.

## Critères d'acceptation

1. `wikimasters auction cancel <auction-id>` prend l'identifiant unique de l'enchère (UUID `auctions.id`), comme les autres commandes `auction`.
2. La commande envoie l'annulation sans vérifier au préalable le statut de l'enchère, son vendeur ni ses mises.
3. La commande affiche l'identifiant de l'enchère annulée.
4. Quand le jeu refuse l'annulation, la commande échoue en affichant le motif donné par le jeu.
5. Avec `--json`, stdout porte `{ "auctionId": "…", "status": "cancelled" }`, où `status` est le statut renvoyé par le jeu.

## Hors périmètre

- Baisser le prix de départ d'une enchère (`/api/marketplace/<id>/reprice`).
- Lister mes enchères en cours en tant que vendeur.
- Retrouver le nouvel identifiant d'entrée de la carte dans ma collection : `collection list` le donne.

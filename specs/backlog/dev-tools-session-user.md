# Afficher le joueur de la session dans les outils de développement

## Contexte

Vérifier une commande sur le compte demande souvent de filtrer sur mon identifiant de joueur (`seller_id`, `current_bidder_id`, `bidder_id`…). Les outils `api:get` et `api:site` ouvrent la session sans afficher à quel joueur elle appartient : le 2026-10-08, pour vérifier `wikimasters auction list`, il a fallu retrouver mon identifiant dans `auction_bids.bidder_id` avant de chercher les enchères que je vends.

Dépend de : [Interroger l'API en lecture seule](../api-get.md), [Envoyer une requête au site](../api-site.md).

## User story

En tant que développeur, je lis l'identifiant du joueur de la session dans la sortie de chaque requête de développement, pour filtrer sur lui à la requête suivante.

## Critères d'acceptation

1. `npm run -s api:get -- '<requête>'` écrit `user <uuid>` sur la sortie d'erreur, où `<uuid>` est l'identifiant du joueur de la session, avant d'envoyer la requête.
2. `npm run -s api:site -- <méthode> <chemin> [corps JSON]` écrit la même ligne sur la sortie d'erreur, avant d'envoyer la requête.
3. La sortie standard de chaque outil ne porte toujours que le corps de la réponse.

## Hors périmètre

- Une commande `wikimasters` qui donne l'identifiant du joueur : `wikimasters login` l'affiche déjà.

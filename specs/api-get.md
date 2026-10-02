# Interroger l'API en lecture seule

## Contexte

La découverte d'une lecture passe par des requêtes en lecture seule sur l'API. Chacune demande aujourd'hui un script jetable qui ouvre la session, enregistre le jeton renouvelé et envoie la requête : trois scripts presque identiques ont été écrits pour trouver la table de la collection.

Dépend de : [Découvrir l'API en l'interrogeant directement](api-discovery.md).

## User story

En tant que développeur, j'envoie une requête de lecture à l'API avec la session stockée, en une commande, sans risque d'écrire.

## Critères d'acceptation

1. `npm run -s api:get -- '<table>?<paramètres PostgREST>'` envoie un `GET` à `/rest/v1/<table>?<paramètres PostgREST>` avec la session stockée, et écrit le corps JSON de la réponse sur la sortie standard.
2. La commande n'envoie que des requêtes `GET` : elle n'offre aucun moyen d'écrire.
3. Le jeton de rafraîchissement renouvelé est enregistré dans `.env` avant la requête. Aucun jeton n'est affiché.
4. Sur une réponse HTTP en erreur, le statut et le message de l'API, dont la suggestion de PostgREST pour une table inconnue, partent sur la sortie d'erreur, et la commande sort avec le code 1.
5. Sans session valide, la commande sort avec le code 4, comme `wkm`.
6. La règle `.claude/rules/api-discovery.md` indique cette commande pour les lectures.

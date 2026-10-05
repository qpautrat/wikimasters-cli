# Envoyer une requête au site

## Contexte

Le contrat d'une route `/api/...` du serveur Next.js, refus compris, s'établit en l'exerçant sur le compte. Chaque requête directe demande aujourd'hui un script jetable qui ouvre la session, construit le cookie d'authentification et les en-têtes du navigateur. Un tel script a établi l'annulation d'une vente (`DELETE /api/marketplace/<id>`) et le refus `{"card_id":…,"error":"card_not_owned"}`, et a lu les pages du site connecté pour trouver ses routes dans son JavaScript.

Dépend de : [Outils de développement hors de `src/`](dev-tools.md), [Découvrir l'API en l'interrogeant directement](api-discovery.md).

## User story

En tant que développeur, j'envoie une requête au serveur Next.js du site avec la session stockée, en une commande, et je vois sa réponse, refus compris.

## Critères d'acceptation

1. `npm run -s api:site -- <méthode> <chemin> [corps JSON]` envoie une requête `<méthode>` à `https://www.wiki-masters.com<chemin>` avec la session stockée, par le code du core qui appelle le site : cookie d'authentification, en-têtes `Origin` et `Referer`, nouvelles tentatives sur une erreur passagère.
2. La méthode est `GET`, `POST`, `PUT`, `PATCH` ou `DELETE`, le chemin commence par `/`, et le corps, facultatif, est du JSON valide, refusé avec `GET`. Sinon, la commande sort avec le code 1 sans rien envoyer.
3. La commande écrit le statut HTTP sur la sortie d'erreur et le corps de la réponse, tel quel, sur la sortie standard, y compris quand le site refuse la requête. Elle ne suit pas une redirection : elle écrit son statut et sa destination. Elle sort avec le code 0 sur un statut 2xx, 1 sinon.
4. Le chemin d'une page du site donne son HTML, tel que le voit l'utilisateur connecté.
5. Le jeton de rafraîchissement renouvelé est enregistré dans `.env` avant la requête. Ni le cookie ni aucun jeton n'est affiché.
6. Sans session valide ou sur HTTP 401, la commande sort avec le code 4. Sur une erreur passagère qui persiste, ou qui peut avoir laissé passer une écriture, elle sort avec le code 75, comme `wikimasters`.
7. Les commandes `wikimasters` qui appellent le site gardent leur comportement.
8. La règle `.claude/rules/api-discovery.md` indique cette commande pour les requêtes directes au site.

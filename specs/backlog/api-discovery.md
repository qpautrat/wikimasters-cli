# Découvrir l'API en l'interrogeant directement

## Contexte

Les endpoints sont aujourd'hui découverts par des captures HAR du parcours manuel, ce qui demande une capture puis un nettoyage à chaque nouvelle fonctionnalité. Pour les lectures, l'API se découvre en l'interrogeant : un nom de table inconnu renvoie une suggestion (`Perhaps you meant the table 'public.user_cards'`), et la lecture d'une ligne donne les colonnes. C'est ainsi que la table de la collection a été trouvée. En revanche, l'API ne révèle ni le nom ni les effets des écritures, des fonctions RPC et des routes `/api/...` du serveur Next.js.

## User story

En tant que développeur, je découvre les données dont une fonctionnalité a besoin en interrogeant l'API, sans capture manuelle, chaque fois que c'est sans risque.

## Critères d'acceptation

1. Pour une lecture, la découverte passe d'abord par des requêtes en lecture seule sur l'API : noms de tables, colonnes, relations.
2. Une capture HAR n'est demandée que pour une écriture, une fonction RPC ou une route `/api/...` du serveur Next.js.
3. Aucune requête d'écriture n'est envoyée à titre exploratoire.
4. La règle `.claude/rules/network-captures.md` est remplacée par une règle de découverte de l'API qui décrit cet ordre de priorité.

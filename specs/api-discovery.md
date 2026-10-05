# Découvrir l'API en l'interrogeant directement

## Contexte

Les endpoints sont aujourd'hui découverts par des captures HAR du parcours manuel, ce qui demande une capture puis un nettoyage à chaque nouvelle fonctionnalité. Pour les lectures, l'API se découvre en l'interrogeant : un nom de table inconnu renvoie une suggestion (`Perhaps you meant the table 'public.user_cards'`), et la lecture d'une ligne donne les colonnes. C'est ainsi que la table de la collection a été trouvée. L'API ne révèle ni le nom ni les effets des écritures, des fonctions RPC et des routes `/api/...` du serveur Next.js : leur contrat, refus compris, s'établit en les exerçant sur le compte, par exemple en mettant une carte aux enchères puis en essayant de la défausser. Enfin, ce qu'une requête révèle n'est consigné nulle part : une relecture ou une session suivante ne peut ni le vérifier ni s'en servir.

## User story

En tant que développeur, je découvre les données dont une fonctionnalité a besoin en interrogeant et en exerçant l'API, sans capture manuelle.

## Critères d'acceptation

1. Pour une lecture, la découverte passe d'abord par des requêtes en lecture seule sur l'API : noms de tables, colonnes, relations.
2. Pour une écriture, une fonction RPC ou une route `/api/...` du serveur Next.js, l'agent établit le contrat lui-même sur le compte : il enchaîne les commandes `wikimasters` existantes et envoie une requête directe pour une étape qu'aucune commande ne couvre.
3. Avant de lancer cette suite, l'agent présente chaque écriture et son effet sur le compte, et ne la lance qu'avec l'accord de l'utilisateur.
4. Une capture HAR n'est demandée que lorsque ni le JavaScript du site ni une capture existante ne révèlent le nom et le corps de la requête.
5. La règle `.claude/rules/network-captures.md` est remplacée par une règle de découverte de l'API qui décrit cet ordre de priorité.
6. Chaque table et route utilisée par le core est décrite dans `docs/api.md` : colonnes utilisées, relations, sens des valeurs qui ne va pas de soi, et source de la découverte (requête en lecture seule, suite d'actions sur le compte ou capture).

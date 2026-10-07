# Indiquer la commande de connexion exacte

## Contexte

Sur le code 4, le message d'erreur dit de lancer `wikimasters login` ([Connexion](../login.md), critère 6). Aucune commande `wikimasters` n'existe dans le shell (`command -v wikimasters` ne trouve rien, mesuré le 2026-10-07) : la CLI se lance par `npm run -s wikimasters --` depuis la racine du dépôt, avec le Node épinglé par mise. Le message nomme une commande alors qu'il vient du cœur, qu'un futur serveur MCP doit réutiliser tel quel.

Dépend de : [Connexion](../login.md).

## User story

En tant que développeur, quand une commande me demande de me reconnecter, je copie la commande que donne le message et elle fonctionne.

## Critères d'acceptation

1. Sur le code 4, le message d'erreur de la CLI indique de lancer `mise -C <racine du dépôt> exec -- npm run -s wikimasters -- login`, avec le chemin absolu de la racine, et cette commande fonctionne telle quelle depuis n'importe quel dossier.
2. L'erreur levée par le cœur ne nomme aucune commande : c'est la CLI qui ajoute la commande à lancer.
3. Le commit qui implémente cette spec modifie le critère 6 de [Connexion](../login.md).

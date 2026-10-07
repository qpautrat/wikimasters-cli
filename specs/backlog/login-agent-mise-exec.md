# Demander la connexion sans supposer mise activé

## Contexte

Sur le code 4, quand les règles du joueur n'indiquent pas de méthode de connexion, le skill `wikimasters` lui demande de lancer `npm run -s wikimasters -- login` dans un terminal, à la racine du dépôt ([Se connecter depuis un agent](../login-agent.md), critère 2). Cette commande suppose que mise est activé dans le shell du joueur. Sinon, `npm` n'est pas celui du Node épinglé dans `mise.toml`, ou n'existe pas. Lors d'un test en nouveau développeur le 2026-10-07, la commande a dû être donnée avec `mise exec --`.

Dépend de : [Se connecter depuis un agent](../login-agent.md).

## User story

En tant que joueur dont le shell n'active pas mise, quand l'agent me demande de me connecter, la commande qu'il me donne fonctionne telle quelle.

## Critères d'acceptation

1. Sur le code 4, sans méthode de connexion dans les règles du joueur, le skill demande de lancer dans un terminal `mise -C <racine du dépôt> exec -- npm run -s wikimasters -- login`, avec le chemin absolu de la racine, qui fonctionne depuis n'importe quel dossier.
2. Le commit qui implémente cette spec modifie le critère 2 de [Se connecter depuis un agent](../login-agent.md).

## Hors périmètre

- Les commandes que l'agent lance lui-même.

# Se connecter depuis un agent

## Contexte

Sur le code 4, le skill `wikimasters` lance lui-même `wikimasters login`, qui ouvre Firefox sur macOS. La connexion par collage prévue ([Se connecter en collant la session](login-paste-session.md)) demande qu'un humain colle la session dans un terminal, ce que l'agent ne peut pas faire à sa place. Chaque joueur peut préférer une méthode de connexion, qu'il écrit dans son `CLAUDE.local.md`.

Une commande lancée par le préfixe `!` de Claude Code n'a probablement pas de terminal interactif (non mesuré) : la connexion se lance dans un terminal du joueur.

Dépend de : [Connexion](../login.md).

## User story

En tant que joueur qui passe par un agent, quand une commande demande de me reconnecter, l'agent se connecte par la méthode que mes règles indiquent, ou me dit quoi lancer.

## Critères d'acceptation

1. Sur le code 4, quand les règles du joueur indiquent une méthode de connexion, le skill la suit, puis relance une fois la commande d'origine.
2. Sinon, le skill ne lance pas `wikimasters login` : il demande au joueur de lancer `npm run -s wikimasters -- login` dans un terminal, à la racine du dépôt, puis relance une fois la commande d'origine quand le joueur indique s'être connecté.
3. Le skill ne demande jamais au joueur de lui transmettre la session ou son cookie dans la conversation.
4. Le commit qui implémente cette spec met à jour `specs/login.md`, dont le contexte dit que l'agent lance lui-même `wikimasters login`, et `CLAUDE.md`, pour que `CLAUDE.local.md` puisse aussi indiquer la méthode de connexion du joueur.

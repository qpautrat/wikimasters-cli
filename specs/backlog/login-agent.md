# Se connecter depuis un agent

## Contexte

Sur le code 4, le skill `wikimasters` lance lui-même `wikimasters login`, qui ouvre Firefox. Avec la connexion par collage, un humain doit coller la session dans un terminal : l'agent ne peut pas le faire à sa place. Chaque joueur peut préférer une méthode de connexion, qu'il écrit dans son `CLAUDE.local.md`.

Dépend de : [Se connecter en collant la session](login-paste-session.md).

## User story

En tant que joueur qui passe par un agent, quand une commande demande de me reconnecter, l'agent me dit quoi faire, ou se connecte par la méthode que mes règles indiquent.

## Critères d'acceptation

1. Sur le code 4, quand les règles du joueur indiquent une méthode de connexion, le skill la suit, puis relance une fois la commande d'origine.
2. Sinon, le skill ne lance pas `wikimasters login` : il demande au joueur de taper `! npm run -s wikimasters -- login` et de suivre ses instructions, puis relance une fois la commande d'origine quand le joueur indique s'être connecté.
3. Le skill ne demande jamais au joueur de lui transmettre la session ou son cookie dans la conversation.

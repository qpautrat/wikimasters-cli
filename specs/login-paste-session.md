# Se connecter en collant la session

## Contexte

`wikimasters login` lance Firefox depuis son emplacement sur macOS et lit ses cookies avec le CLI `sqlite3` ([Connexion](login.md)). Les développeurs à qui je partage le dépôt utilisent d'autres systèmes et d'autres navigateurs : ils ne peuvent pas se connecter.

Le site ne propose qu'une connexion par email et mot de passe, protégée par un captcha (`signInWithPassword` avec un `captchaToken` Turnstile, lu dans le JavaScript de `/login` le 2026-10-06). La session doit donc venir d'un navigateur où l'utilisateur s'est connecté lui-même. Le site la garde dans le cookie `sb-cyrxjeppjqsxxjayfrur-auth-token`, parfois découpé en morceaux `.0`, `.1`… que les outils de développement de tout navigateur affichent.

Supabase révoque toute la session quand un refresh token déjà échangé est réutilisé hors de ses exceptions (« A reuse attempt that matches neither exception revokes the whole session », documentation Supabase, *Sessions*). Le navigateur d'où vient la session ne doit donc plus s'en servir.

Je garde la connexion par Firefox, transparente pour moi sur macOS, que mon agent lance selon mes règles.

Dépend de : [Connexion](login.md), [Se connecter depuis un agent](login-agent.md).

## User stories

1. En tant que développeur, sur n'importe quel système et avec n'importe quel navigateur, je me connecte en collant dans la CLI la session de mon navigateur.
2. En tant que joueur sur macOS, je continue à me connecter par Firefox sans rien copier, avec `--firefox`.

## Critères d'acceptation

### `wikimasters login`

1. La commande explique sur stderr où trouver la session : se connecter sur le site dans une fenêtre privée, ouvrir les outils de développement, copier la valeur du cookie `sb-cyrxjeppjqsxxjayfrur-auth-token`, ou de chacun de ses morceaux, puis fermer la fenêtre privée sans se déconnecter avant de coller.
2. La commande lit un morceau par ligne, dans l'ordre `.0`, `.1`…, jusqu'à une ligne vide ou la fin de l'entrée, et les joint. Sur un terminal, la saisie n'est pas affichée ; hors terminal, la commande lit l'entrée standard de la même façon.
3. Une valeur qui ne contient pas de refresh token échoue avec le code 1 et un message qui le dit, sans rien enregistrer.
4. La commande échange aussitôt le refresh token collé et enregistre la session comme aujourd'hui ; un refresh token que l'API refuse sort avec le code 4.
5. Avec `--json`, stdout ne porte que le résultat, comme aujourd'hui.
6. Ni la valeur collée ni le refresh token n'apparaissent sur stdout, sur stderr ou dans un message d'erreur.

### `wikimasters login --firefox`

7. L'option `--firefox` garde la connexion par Firefox, avec les critères 1 à 3 de [Connexion](login.md).

### Documentation

8. Le commit qui implémente cette spec met à jour `specs/login.md` et la description de la connexion dans `CLAUDE.md`.

## Hors périmètre

- Lancer Firefox ailleurs que sur macOS.
- Lire les cookies d'un autre navigateur que Firefox.
- La façon dont l'agent réagit au code 4, traitée dans [Se connecter depuis un agent](login-agent.md).
- L'absence de `sqlite3` pour `--firefox`, traitée dans [Lire les cookies Firefox sans `sqlite3`](backlog/login-firefox-node-sqlite.md).

# Lancer la CLI par une tâche mise

## Contexte

La CLI se lance par `mise exec -- npm run -s wikimasters -- <commande>` depuis la racine du dépôt : sans `mise exec`, `npm` prend le Node de nvm (22.14.0) au lieu du Node épinglé (24.21.0), ou n'existe pas, mesuré le 2026-10-07 dans un shell sans les shims ni les outils de mise. Ce préfixe se répète dans chaque exemple du README, dans `CLAUDE.md` et dans le skill `wikimasters`.

Dépend de : [Outils du dépôt](toolchain.md), [Construire la CLI à l'installation](build-on-install.md).

## User story

En tant que joueur, je lance une commande `wikimasters` par `mise run wikimasters <commande>`, que mon shell active mise ou non.

## Critères d'acceptation

1. `mise.toml` déclare une tâche `wikimasters` qui lance la CLI construite dans `dist/` avec le Node épinglé.
2. `mise run wikimasters <commande>` transmet tels quels à la CLI chaque argument et chaque option, `--help` et `--json` compris, depuis la racine du dépôt dans un shell dont le `PATH` ne contient ni les shims ni les outils de mise.
3. Sur un succès, la sortie standard et la sortie d'erreur ne contiennent que ce qu'écrit la CLI.
4. `mise run wikimasters` sort avec le code de sortie de la CLI : 0, 1, 4 ou 75.
5. L'entrée standard reste celle du terminal : `mise run wikimasters login` lit la session collée sans l'afficher.
6. `mise -C <racine du dépôt> run wikimasters <commande>` fonctionne de la même façon depuis n'importe quel dossier.
7. Le README, `CLAUDE.md` et le skill `wikimasters` donnent chaque commande de la CLI sous la forme `mise run wikimasters <commande>`, et le skill donne la commande de connexion sous la forme `mise -C '<racine du dépôt>' run wikimasters login`.
8. `npm run -s wikimasters -- <commande>` fonctionne toujours.
9. Le commit qui implémente cette spec modifie le critère 2 de [Construire la CLI à l'installation](build-on-install.md), le critère 2 de [Se connecter depuis un agent](login-agent.md) et le critère 1 de [Indiquer la commande de connexion exacte](backlog/login-hint-command.md).

## Hors périmètre

- Le message d'erreur du code 4, couvert par [Indiquer la commande de connexion exacte](backlog/login-hint-command.md).
- Une tâche mise pour les outils de développement (`build`, `test`, `api:get`, `api:site`…).

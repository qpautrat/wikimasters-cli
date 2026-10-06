# Présenter le dépôt dans un README

## Contexte

Le dépôt GitHub est public et je veux le faire tester par des développeurs autour de moi. Il n'a pas de `README.md` : après `git clone`, rien ne dit ce que fait la CLI, ce qu'il faut installer, comment se connecter ni quelles commandes existent. `CLAUDE.md` décrit le dépôt pour un agent qui y contribue, pas pour quelqu'un qui veut jouer depuis le terminal.

## User story

En tant que développeur qui vient de cloner le dépôt, je lis le README et j'exécute ma première commande sur mon compte WikiMasters sans lire le code.

## Critères d'acceptation

1. Un `README.md` à la racine du dépôt, en anglais comme `docs/`, dit en une phrase ce que fait la CLI et précise que le site n'a pas d'API publique.
2. Il liste les prérequis de l'utilisateur : mise, Firefox et `sqlite3`, ainsi que les systèmes sur lesquels `wikimasters login` fonctionne.
3. Il donne, dans l'ordre, les commandes qui mènent d'un clone à une première commande sur le compte : installation, construction, renseignement de `.env`, `login`, puis une commande en lecture seule.
4. Il présente chaque commande de la CLI dans un tableau, avec ce qu'elle fait et un exemple d'appel.
5. Il explique les codes de sortie 0, 1, 4 et 75, et l'option `--json`.
6. Une section explique comment jouer à travers un agent : ouvrir Claude Code à la racine du dépôt et formuler sa demande en langage naturel, que le skill `wikimasters` traduit en commandes, avec deux exemples de demandes.
7. Cette section indique que le joueur peut écrire sa façon de jouer dans un `CLAUDE.local.md` non versionné, que l'agent respecte.
8. Il renvoie vers `docs/api.md`, `docs/game-rules.md`, et vers `CLAUDE.md` et `specs/` pour contribuer.
9. Chaque commande donnée en exemple dans le README, exécutée telle quelle sur le compte, se comporte comme le README le décrit.
10. `CLAUDE.md` impose de mettre à jour le README dans le commit qui ajoute, modifie ou retire une commande, ou qui change l'installation.

## Hors périmètre

- Une traduction française du README.
- Un guide de contribution distinct de `CLAUDE.md`.

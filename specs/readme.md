# Présenter le dépôt dans un README

## Contexte

Le dépôt GitHub est public et je veux le faire tester par des développeurs autour de moi. Il n'a pas de `README.md` : après `git clone`, rien ne dit ce que fait la CLI, ce qu'il faut installer, comment se connecter ni quelles commandes existent. `CLAUDE.md` décrit le dépôt pour un agent qui y contribue, pas pour quelqu'un qui veut jouer depuis le terminal.

La connexion demande de coller dans la CLI la session de son navigateur : le développeur doit comprendre ce qu'il confie à la CLI pour lui faire confiance.

Dépend de : [Se connecter en collant la session](login-paste-session.md).

## User story

En tant que développeur qui vient de cloner le dépôt, je lis le README et j'exécute ma première commande sur mon compte WikiMasters sans lire le code.

## Critères d'acceptation

1. Un `README.md` à la racine du dépôt, en anglais comme `docs/`, dit en une phrase ce que fait la CLI et précise que le site n'a pas d'API publique.
2. Il liste les prérequis de l'utilisateur : mise et un navigateur, plus Firefox sur macOS et `sqlite3` pour `wikimasters login --firefox`.
3. Il donne, dans l'ordre, chaque étape qui mène d'un clone à une première commande sur le compte, configuration comprise : installation, construction, `login`, puis une commande en lecture seule.
4. Il présente chaque commande de la CLI dans un tableau, avec ce qu'elle fait et un exemple d'appel.
5. Il explique les codes de sortie 0, 1, 4 et 75, et l'option `--json`.
6. Une section explique comment jouer à travers un agent : ouvrir Claude Code à la racine du dépôt et formuler sa demande en langage naturel, que le skill `wikimasters` traduit en commandes, avec deux exemples de demandes.
7. Cette section indique que le joueur peut écrire sa façon de jouer dans un `CLAUDE.local.md` non versionné, que l'agent respecte.
8. Il renvoie vers `docs/api.md`, `docs/game-rules.md`, et vers `CLAUDE.md` et `specs/` pour contribuer.
9. Une section décrit la connexion pas à pas et ce que la CLI fait de la session :
   - la CLI ne voit jamais l'email ni le mot de passe, la connexion se fait sur le site ;
   - la valeur collée est une session, dont le refresh token change à chaque commande et ne sert qu'une fois ;
   - le refresh token n'est enregistré que dans `.env`, ignoré par git, lisible par son seul propriétaire sur macOS et Linux, et n'est jamais affiché ;
   - la session n'est envoyée qu'au site, à son Supabase et à ses routes `/api/...`, comme le fait le navigateur ;
   - pourquoi fermer la fenêtre privée sans se déconnecter avant de coller, et ce que la déconnexion depuis le site fait à la session de la CLI ;
   - les fichiers du code qui lisent, enregistrent et envoient la session.
10. Chaque exemple d'une commande en lecture seule, exécuté tel quel sur le compte, se comporte comme le README le décrit. Chaque exemple d'une commande qui modifie le compte suit la syntaxe que donne `--help` pour cette commande, et n'est pas exécuté pour vérifier le README.

## Hors périmètre

- Une traduction française du README.
- Un guide de contribution distinct de `CLAUDE.md`.

# Publier la CLI sur npm

## Contexte

Pour utiliser la CLI, il faut aujourd'hui cloner le dépôt, lancer `mise install`, puis chaque commande par `mise run wikimasters -- <commande>` depuis le clone. Un joueur qui veut seulement jouer n'a besoin ni des sources, ni des outils de développement, ni du hook git.

Le nom du paquet sera choisi au moment de la publication ; cette spec l'écrit `<nom>`. `wikimasters` et `wikimasters-cli` sont libres sur npm (`npm view` répond 404, mesuré le 2026-10-07).

Dépend de : [Licence du dépôt](../license.md), [Ranger la session dans le dossier de l'utilisateur](session-user-dir.md).

## User story

En tant que joueur, j'installe la CLI depuis npm, sans cloner le dépôt, et je lance `wikimasters <commande>` depuis n'importe quel dossier.

## Critères d'acceptation

1. `package.json` n'est plus `private` et déclare `repository` vers le dépôt GitHub.
2. `npm pack --dry-run` ne liste que `package.json`, `README.md`, `LICENSE` et les fichiers de `dist/`, sans fichier de test ni `dist/core/testing/`.
3. `npm publish` construit `dist/` avant de créer le paquet.
4. Sur une machine sans clone du dépôt, avec un Node qui satisfait `engines`, `npm install -g <nom>` installe la commande `wikimasters`, et `wikimasters --help` affiche l'aide depuis n'importe quel dossier.
5. Après cette installation, `wikimasters login` puis `wikimasters wishlist list` fonctionnent depuis n'importe quel dossier.
6. Le README décrit l'installation depuis npm et donne les commandes sous la forme `wikimasters <commande>` pour la CLI installée, en gardant l'installation depuis un clone pour contribuer.
7. Le commit qui implémente cette spec modifie le critère 6 de [Connexion](../login.md) : le message du code 4 indique de lancer `wikimasters login`, la commande de la CLI installée.

## Hors périmètre

- La publication depuis une CI.
- Le choix et l'incrément des numéros de version.
- Le skill `wikimasters` pour un joueur qui n'a pas cloné le dépôt.

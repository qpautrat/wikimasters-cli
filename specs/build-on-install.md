# Construire la CLI à l'installation

## Contexte

Sur un clone neuf, `mise install` installe les outils et les dépendances npm, mais ne construit pas `dist/`. La première commande `npm run -s wikimasters -- --help` plante alors avec une erreur Node brute (`Cannot find module …/dist/cli/main.js`), mesurée lors d'un test en nouveau développeur le 2026-10-07.

Dépend de : [Outils du dépôt](toolchain.md).

## User story

En tant que développeur qui vient de cloner le dépôt, je lance ma première commande `wikimasters` juste après `mise install`.

## Critères d'acceptation

1. Sur un clone neuf, `mise install` construit `dist/` après l'installation des dépendances npm.
2. Juste après, `mise run wikimasters -- --help` affiche l'aide sans autre commande.
3. Le commit qui implémente cette spec modifie le critère 2 de [Outils du dépôt](toolchain.md) et la description de `mise install` dans `CLAUDE.md`.

## Hors périmètre

- Reconstruire `dist/` après une modification de `src/`.

# Outils du dépôt

## Contexte

Le dépôt ne déclare pas la version de Node qu'il utilise : chaque poste prend celle qui est installée. `package.json` ne fixe qu'un minimum (`engines`).

## User story

En tant que développeur, une commande installe les outils du dépôt aux versions qu'il déclare.

## Critères d'acceptation

1. Un `mise.toml` à la racine du dépôt épingle la version exacte de Node, une version LTS, et fixe la version minimale de mise qu'il requiert.
2. Dans le dépôt, `mise install` installe les outils épinglés, puis les dépendances npm avec le Node épinglé, puis construit `dist/`, sans dépendre d'une configuration extérieure au dépôt.
3. Les outils appelés par les scripts npm restent des dépendances de développement, figées par `package-lock.json`. Les outils appelés par git, indépendants du code, sont épinglés dans `mise.toml`.
4. Le projet se construit et ses tests passent avec cette version.
5. L'installation est documentée dans `CLAUDE.md`.

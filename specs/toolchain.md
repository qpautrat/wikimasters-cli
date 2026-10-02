# Outils du dépôt

## Contexte

Le dépôt ne déclare pas la version de Node qu'il utilise : chaque poste prend celle qui est installée. `package.json` ne fixe qu'un minimum (`engines`).

## User story

En tant que développeur, une commande installe les outils du dépôt aux versions qu'il déclare.

## Critères d'acceptation

1. Un `mise.toml` à la racine du dépôt épingle la version exacte de Node, une version LTS.
2. Dans le dépôt, `mise install` installe Node à cette version, sans dépendre d'une configuration extérieure au dépôt.
3. Les outils distribués par npm restent des dépendances de développement, figées par `package-lock.json`.
4. Le projet se construit et ses tests passent avec cette version.
5. L'installation est documentée dans `CLAUDE.md`.

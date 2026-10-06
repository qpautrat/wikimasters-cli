# Trouver Firefox hors de macOS

## Contexte

`wikimasters login` lance Firefox depuis `/Applications/Firefox.app/Contents/MacOS/firefox`, son emplacement sur macOS (`src/core/browser-login.ts`). Sur Linux ou Windows, la commande échoue : les développeurs à qui je partage le dépôt ne peuvent pas se connecter.

Dépend de : [Connexion](../login.md), [Présenter le dépôt dans un README](readme.md).

## User story

En tant que développeur sur macOS, Linux ou Windows, je me connecte avec `wikimasters login` sans configuration lorsque Firefox est installé à son emplacement habituel, et en indiquant son chemin sinon.

## Critères d'acceptation

1. Sur macOS, la commande lance Firefox depuis `/Applications/Firefox.app`, comme aujourd'hui.
2. Sur Linux, elle lance l'exécutable `firefox` trouvé dans le `PATH`.
3. Sur Windows, elle lance Firefox depuis son répertoire d'installation par défaut sous `Program Files`.
4. La variable `WIKIMASTERS_FIREFOX`, lue dans `.env` puis dans l'environnement comme les autres variables, donne le chemin de l'exécutable Firefox et l'emporte sur l'emplacement par défaut.
5. Quand Firefox est introuvable, la commande échoue avec le code 1 et un message qui donne le chemin essayé et le nom de la variable `WIKIMASTERS_FIREFOX`.
6. Le README liste les systèmes pris en charge et la variable `WIKIMASTERS_FIREFOX`, et `.env.example` la mentionne.

## Hors périmètre

- Un autre navigateur que Firefox.
- Installer `sqlite3`, que la commande appelle pour lire les cookies du profil.

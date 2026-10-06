# Se connecter hors de macOS

## Contexte

`wikimasters login` lance Firefox depuis `/Applications/Firefox.app/Contents/MacOS/firefox`, son emplacement sur macOS (`src/core/browser-login.ts`). Sur Linux ou Windows, la commande échoue : les développeurs à qui je partage le dépôt ne peuvent pas se connecter.

D'autres points de la connexion peuvent échouer hors de macOS (non mesuré) :

- le profil temporaire est créé sous le répertoire temporaire du système, que le Firefox snap d'Ubuntu ne voit pas ;
- sur Windows, le processus lancé peut se terminer dès que la fenêtre s'ouvre, ce que la commande prend pour une fermeture de Firefox ;
- la commande lit les cookies avec le CLI `sqlite3`, souvent absent sur Windows, et une erreur à son lancement n'est pas rapportée : la connexion échoue au bout de 5 minutes sans dire pourquoi.

Dépend de : [Connexion](../login.md), [Présenter le dépôt dans un README](readme.md).

## User story

En tant que développeur sur macOS, Linux ou Windows, je me connecte avec `wikimasters login` sans configuration lorsque Firefox est installé à son emplacement habituel, et en indiquant son chemin sinon.

## Critères d'acceptation

1. Sur macOS, la commande lance Firefox depuis `/Applications/Firefox.app`, comme aujourd'hui.
2. Sur Linux, elle lance l'exécutable `firefox` trouvé dans le `PATH`, y compris le Firefox snap d'Ubuntu.
3. Sur Windows, elle lance Firefox depuis `Program Files\Mozilla Firefox`, sinon depuis `Program Files (x86)\Mozilla Firefox`.
4. La variable `WIKIMASTERS_FIREFOX`, lue dans `.env` puis dans l'environnement comme les autres variables, donne le chemin de l'exécutable Firefox et l'emporte sur l'emplacement par défaut.
5. Quand Firefox est introuvable, la commande échoue avec le code 1 et un message qui donne chaque chemin essayé, ou le nom `firefox` cherché dans le `PATH`, et le nom de la variable `WIKIMASTERS_FIREFOX`.
6. Sur chaque système, la commande ne considère Firefox comme fermé qu'une fois sa fenêtre fermée par l'utilisateur.
7. Quand `sqlite3` est introuvable, la commande échoue avec le code 1 et un message qui le dit, sans attendre la fin du délai de connexion.
8. Le README liste les systèmes pris en charge et la variable `WIKIMASTERS_FIREFOX`, et `.env.example` la mentionne.

## Hors périmètre

- Un autre navigateur que Firefox.
- Installer `sqlite3`.

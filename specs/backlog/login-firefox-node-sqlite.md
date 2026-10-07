# Lire les cookies Firefox sans `sqlite3`

## Contexte

La connexion par Firefox lit les cookies du profil avec le CLI `sqlite3` (`src/core/browser-login.ts`), que ni `mise.toml` ni `package.json` ne déclarent. Quand `sqlite3` est introuvable, l'erreur à son lancement n'est pas rapportée : la commande attend la fin du délai de 5 minutes et échoue sans dire pourquoi.

Node embarque un module SQLite, `node:sqlite`, chargé sans option depuis Node 22.13.0 (`doc/api/sqlite.md` de Node). Le Node épinglé dans `mise.toml` (24.21.0) le charge sans avertissement (mesuré le 2026-10-07).

Cette spec corrige le critère 2 de [README](../readme.md), qui cite `sqlite3` parmi les prérequis.

Dépend de : [Connexion](../login.md).

## User story

En tant que joueur qui se connecte par Firefox, je n'ai pas à installer `sqlite3`.

## Critères d'acceptation

1. Sans `sqlite3` dans le `PATH`, `wikimasters login --firefox` se connecte et enregistre la session comme avec.
2. Sans `sqlite3` dans le `PATH`, les tests passent.
3. `engines` dans `package.json` exige Node 22.13.0 au minimum.
4. `README.md` ne cite plus `sqlite3` parmi les prérequis.

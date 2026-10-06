# Signaler l'absence de `sqlite3` à la connexion par Firefox

## Contexte

La connexion par Firefox lit les cookies du profil avec le CLI `sqlite3` (`src/core/browser-login.ts`). Quand `sqlite3` est introuvable, l'erreur à son lancement n'est pas rapportée : la commande attend la fin du délai de 5 minutes et échoue sans dire pourquoi.

Dépend de : [Connexion](../login.md).

## User story

En tant que joueur qui se connecte par Firefox sans `sqlite3`, je sais tout de suite ce qui manque.

## Critères d'acceptation

1. Quand `sqlite3` est introuvable, la connexion par Firefox échoue avec le code 1 et un message qui le dit, sans attendre la fin du délai de connexion.

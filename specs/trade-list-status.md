# Filtrer mes échanges par statut

## Contexte

`wikimasters trade list` rend tous mes échanges que le jeu renvoie, quel que soit leur statut : les échanges acceptés et annulés s'y mêlent à ceux encore en attente. La page `/trades` lit `GET /api/trades` sans paramètre ; observé le 2026-10-28, elle ignore un paramètre `status`, et `active=1` ne garde que les échanges `pending`.

Dépend de : [Lister mes échanges](trade-list.md).

## User story

En tant que joueur, je donne un statut à `trade list` et je ne lis que mes échanges dans ce statut, par exemple ceux encore en attente.

## Critères d'acceptation

1. `wikimasters trade list --status <statut>` n'affiche que mes échanges, proposés et reçus, dont le statut est celui donné.
2. Le statut est pris tel que le donne `trade list`, sans liste fermée côté CLI.
3. La commande envoie une seule requête.
4. Aucun échange dans ce statut n'est pas une erreur : la commande le signale et sort avec le code 0.
5. Sans `--status`, la commande affiche tous mes échanges, comme avant.
6. Avec `--json`, stdout porte la liste des seuls échanges dans ce statut, sous la même forme que sans `--status`.

## Décisions et code

- La route ne filtre pas par statut : `listTrades(session, status?)` (`src/core/trade-list.ts`) envoie toujours `GET /api/trades` sans paramètre et ne garde, dans la réponse, que les échanges dont `status` est celui donné. `active=1` n'est pas utilisé : il ne couvre que `pending`.
- `trade list --status <statut>` passe le statut tel quel, sans liste fermée. Sans échange dans ce statut, le texte est `You have no <statut> trade.`, code de sortie 0 ; avec `--json`, stdout porte `[]`.

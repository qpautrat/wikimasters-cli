# Miser un montant choisi sur une enchère

## Contexte

`wikimasters auction bid <auction-id>` place toujours la mise minimale fixée par le jeu. Je veux parfois miser davantage.

Dépend de : [Miser sur une enchère](../auction-bid.md).

## User story

En tant que joueur, je donne l'identifiant d'une enchère et un montant, et la commande y place une mise de ce montant exact.

## Critères d'acceptation

1. `wikimasters auction bid <auction-id>` accepte un montant en wikibidous, entier strictement positif.
2. Avec ce montant, la commande place une mise de ce montant exact, ni arrondi ni ajusté.
3. Sans montant, la commande place la mise minimale, comme aujourd'hui.
4. Une valeur qui n'est pas un entier strictement positif est refusée sans rien miser.
5. Un montant inférieur à la mise minimale que le jeu accepte est refusé sans rien miser, avec un message qui donne cette mise minimale.
6. Les autres refus et l'affichage restent ceux de la mise minimale : motif donné par le jeu, montant misé et nouveau solde affichés.
7. La commande mise le montant choisi même quand je suis déjà le meilleur enchérisseur.

## Hors périmètre

- Plafonner le montant d'une mise.
- Miser automatiquement à la place du joueur.

# Lister les enchères en cours sur lesquelles j'ai misé

## Contexte

Pour remiser sur une enchère, `wikimasters auction bid` demande son identifiant, que je dois aujourd'hui retrouver dans l'interface. Je veux voir depuis le terminal les enchères en cours sur lesquelles j'ai misé, avec leur identifiant et l'état de ma mise.

Dépend de : [Miser sur une enchère](../auction-bid.md).

## User story

En tant que joueur, je consulte les enchères en cours sur lesquelles j'ai misé, pour savoir où je mène et sur lesquelles remiser.

## Critères d'acceptation

1. `wikimasters auction bids` affiche une ligne par enchère en cours sur laquelle j'ai misé au moins une fois, même si plusieurs de mes mises portent sur la même enchère.
2. Chaque ligne donne l'identifiant de l'enchère, le titre de la carte, ma mise la plus haute, la mise actuelle, si je suis le meilleur enchérisseur, et l'heure de fin.
3. Une enchère est en cours tant que son statut est `active` et que son heure de fin n'est pas passée ; les autres n'apparaissent pas.
4. Les enchères sont triées par heure de fin, la plus proche en premier.
5. Aucune enchère en cours n'est pas une erreur : la commande le signale et sort avec le code 0.

## Hors périmètre

- Les enchères terminées, gagnées ou perdues.
- Les enchères en cours sur lesquelles je n'ai pas misé.

# Laisser le jeu refuser une mise

## Contexte

`wikimasters auction bid` refuse de lui-même de miser sur une enchère terminée ou dont je suis le vendeur. C'est la page de l'enchère qui masque le formulaire dans ces cas, pas l'API qui l'impose : la commande doit envoyer la mise et rapporter le refus du jeu.

Dépend de : [Miser sur une enchère](../auction-bid.md), [Revoir les contrats des commandes au regard du rôle de la CLI](../cli-contract-review.md).

## User story

En tant que joueur, une mise que le jeu refuse échoue avec le motif du jeu, sans que la commande applique une règle de l'interface.

## Critères d'acceptation

1. La commande envoie la mise sans vérifier au préalable si l'enchère est en cours ni si j'en suis le vendeur.
2. Quand le jeu refuse la mise, la commande échoue en affichant le motif donné par le jeu.
3. Le critère 4 de [Miser sur une enchère](../auction-bid.md) est retiré.

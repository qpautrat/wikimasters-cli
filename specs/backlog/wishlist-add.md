# Ajouter une carte à la liste de souhaits

## Contexte

Dans l'interface, ajouter une carte à la liste de souhaits demande d'ouvrir « Toutes les cartes », de retrouver la carte parmi toutes les cartes du jeu, de l'ouvrir puis de l'ajouter. Je veux le faire depuis le terminal.

L'écriture n'est pas encore connue : elle demande une capture HAR du parcours dans l'interface.

Dépend de : [Lister la liste de souhaits](../wishlist-list.md).

## User story

En tant que joueur, je donne l'identifiant unique d'une carte et elle est ajoutée à ma liste de souhaits.

## Critères d'acceptation

1. `wikimasters wishlist add <card-id>` prend en argument l'identifiant unique de la carte (UUID `cards.id`).
2. La carte est cherchée dans le catalogue de toutes les cartes du jeu, qu'elle soit ou non dans ma collection.
3. Un identifiant absent du catalogue est refusé sans rien modifier, avec un message qui le dit.
4. La carte désignée est ajoutée à la liste de souhaits et apparaît dans `wikimasters wishlist list` et dans l'interface.
5. La commande est idempotente : relancée sur une carte déjà dans la liste de souhaits, elle réussit sans rien modifier et le signale.

## Hors périmètre

- La recherche d'une carte par son nom pour obtenir son identifiant.
- L'ajout de plusieurs cartes en une commande.

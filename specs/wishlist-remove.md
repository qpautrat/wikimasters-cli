# Retirer une carte de la liste de souhaits

## Contexte

Dans l'interface, retirer une carte de la liste de souhaits demande d'ouvrir « Toutes les cartes », de retrouver la carte de mémoire, de l'ouvrir puis de cliquer sur « Retirer de la liste des souhaits ». La procédure est lourde.

## User story

En tant que joueur, je donne l'identifiant unique d'une carte et elle est retirée de ma liste de souhaits.

## Critères d'acceptation

1. La commande prend en argument l'identifiant unique de la carte (UUID `cards.id`).
2. La carte désignée est retirée de la liste de souhaits.
3. La commande est idempotente : relancée sur une carte déjà absente de la liste de souhaits, elle réussit sans rien modifier.

## Hors périmètre

La recherche d'une carte pour obtenir son identifiant fera l'objet d'une spec séparée.

## Questions ouvertes

- **Authentification** : comment la CLI obtient-elle les identifiants du compte ?

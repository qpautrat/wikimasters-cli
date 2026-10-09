# Mettre aux enchères une entrée de ma collection sans la rechercher

## Contexte

`wikimasters auction create` prend l'identifiant de la carte (`cards.id`), lit ma collection pour trouver l'entrée correspondante et refuse sans rien envoyer une carte que je ne possède pas. Or `POST /api/marketplace` attend directement l'identifiant de l'entrée (`user_cards.id`) : cette lecture préalable compose deux appels et vérifie ce que le jeu vérifie déjà.

Dépend de : [Mettre une carte aux enchères](../auction-create.md), [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md).

## User story

En tant que joueur, je donne l'entrée de ma collection à mettre aux enchères, et la commande l'envoie telle quelle au jeu.

## Critères d'acceptation

1. `wikimasters auction create <entrée-id> <prix-de-départ> <durée-en-minutes>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`.
2. La commande envoie une seule requête, `POST /api/marketplace`, sans lire ma collection au préalable.
3. Une entrée que je ne possède pas est refusée par le jeu, et la commande échoue en affichant le motif donné par le jeu.
4. Les autres critères de la commande ne changent pas.

# Défausser des entrées de ma collection sans les rechercher

## Contexte

`wikimasters collection discard` prend des identifiants de carte (`cards.id`), lit ma collection pour trouver les entrées correspondantes, refuse sans rien envoyer une carte que je ne possède pas et découpe l'envoi en lots de 100. Or `POST /api/user-cards/bulk-discard` attend directement les identifiants d'entrée (`{"card_ids": [<user_cards.id>, …]}`), refuse lui-même une entrée que je ne possède pas (`card_not_owned`) et refuse plus de 100 identifiants par appel (`{"error":"Maximum 100 cartes par requête"}`) : la commande compose plusieurs appels et vérifie ce que le jeu vérifie déjà.

Dépend de : [Défausser des cartes choisies de ma collection](../collection-discard.md), [Afficher l'identifiant d'entrée des cartes de ma collection](../collection-list-entry-id.md).

## User story

En tant que joueur, je donne les entrées de ma collection à défausser, et la commande les envoie telles quelles au jeu.

## Critères d'acceptation

1. `wikimasters collection discard <entrée-id>…` prend un ou plusieurs identifiants d'entrée de ma collection (UUID `user_cards.id`), tels que les donne `collection list`.
2. La commande envoie une seule requête, `POST /api/user-cards/bulk-discard`, avec tous les identifiants donnés, sans lire ma collection au préalable ni les découper en lots.
3. Quand le jeu refuse la requête entière (plus de 100 identifiants), la commande échoue en affichant le motif donné par le jeu.
4. Quand le jeu refuse certaines entrées, la commande les nomme par leur identifiant avec le motif donné par le jeu.
5. Les autres critères de la commande ne changent pas.

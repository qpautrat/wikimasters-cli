# Défausser des cartes choisies de ma collection

## Contexte

`wikimasters collection discard-commons` choisit lui-même les cartes à défausser : la rareté commune, et des cartes épargnées (favori, brillante, étiquetée). Ces choix sont ceux du joueur, pas de l'API : la défausse du jeu prend une liste de cartes. Cette commande la remplace et laisse l'agent choisir les cartes, par exemple à partir de `wikimasters collection list`.

Le jeu défausse par `POST /api/user-cards/bulk-discard`, qui prend directement les identifiants d'entrée (`user_cards.id`), refuse lui-même une entrée que je ne possède pas (`card_not_owned`) et refuse plus de 100 identifiants par appel.

Dépend de : [Revoir les contrats des commandes au regard du rôle de la CLI](cli-contract-review.md), [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md).

## User story

En tant que joueur, je donne les entrées de ma collection à défausser, et la commande les envoie telles quelles au jeu pour me rapporter des wikibidous.

## Critères d'acceptation

1. `wikimasters collection discard <entrée-id>…` prend un ou plusieurs identifiants d'entrée de ma collection (UUID `user_cards.id`), tels que les donne `collection list`.
2. La commande envoie une seule requête, `POST /api/user-cards/bulk-discard`, avec tous les identifiants donnés, sans lire ma collection au préalable ni les découper en lots.
3. Quand le jeu refuse la requête entière (plus de 100 identifiants), la commande échoue en affichant le motif donné par le jeu.
4. Quand le jeu refuse certaines entrées, la commande les nomme par leur identifiant avec le motif donné par le jeu.
5. La commande affiche le nombre de cartes défaussées, les wikibidous gagnés et mon nouveau solde de wikibidous.
6. `wikimasters collection discard-commons` n'existe plus.
7. Les specs [Marquer une carte de ma collection en favori](collection-favourite.md) et [Étiqueter une carte de ma collection](collection-tag.md) ne présentent plus `discard-commons` comme ce qui protège une carte de la défausse.

## Hors périmètre

- Choisir les cartes à défausser selon leur rareté, leur favori, leur brillance ou leurs étiquettes : l'agent le fait.

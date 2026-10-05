# Défausser des cartes choisies de ma collection

## Contexte

`wikimasters collection discard-commons` choisit lui-même les cartes à défausser : la rareté commune, et des cartes épargnées (favori, brillante, étiquetée). Ces choix sont ceux du joueur, pas de l'API : la défausse du jeu prend une liste de cartes. Cette commande la remplace et laisse l'agent choisir les cartes, par exemple à partir de `wikimasters collection list`.

Dépend de : [Revoir les contrats des commandes au regard du rôle de la CLI](cli-contract-review.md).

## User story

En tant que joueur, je donne les cartes de ma collection à défausser, et la commande défausse exactement celles-là pour me rapporter des wikibidous.

## Critères d'acceptation

1. `wikimasters collection discard <card-id>…` prend un ou plusieurs identifiants uniques de carte (UUID `cards.id`), comme les autres commandes `collection`.
2. La commande défausse les cartes désignées, et elles seules, quel que soit leur nombre.
3. Une carte absente de ma collection est refusée sans rien défausser, avec un message qui la nomme.
4. Quand le jeu refuse de défausser certaines des cartes, la commande les nomme avec le motif donné par le jeu.
5. La commande affiche le nombre de cartes défaussées, les wikibidous gagnés et mon nouveau solde de wikibidous.
6. `wikimasters collection discard-commons` n'existe plus.
7. Les specs [Marquer une carte de ma collection en favori](collection-favourite.md) et [Étiqueter une carte de ma collection](collection-tag.md) ne présentent plus `discard-commons` comme ce qui protège une carte de la défausse.

## Hors périmètre

- Choisir les cartes à défausser selon leur rareté, leur favori, leur brillance ou leurs étiquettes : l'agent le fait.

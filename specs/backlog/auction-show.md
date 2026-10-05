# Consulter une enchère

## Contexte

Pour décider d'une mise, l'agent doit connaître l'état d'une enchère : la mise actuelle, qui mène, l'heure de fin et la mise minimale que le jeu accepterait. Aucune commande ne le donne aujourd'hui.

## User story

En tant que joueur, je donne l'identifiant d'une enchère et j'obtiens son état, pour décider de miser ou non.

## Critères d'acceptation

1. `wikimasters auction show <auction-id>` prend l'identifiant unique de l'enchère (UUID `auctions.id`).
2. La commande affiche le titre de la carte, la rareté et la brillance de l'exemplaire mis en vente, le statut, l'heure de fin, le prix de départ et la mise actuelle, ou l'absence de mise.
3. La commande indique si je suis le meilleur enchérisseur et si j'en suis le vendeur.
4. La commande affiche la mise minimale que le jeu accepterait à cet instant (voir `docs/game-rules.md`).
5. Un identifiant qui ne correspond à aucune enchère est refusé avec un message qui le dit.
6. Avec `--json`, stdout porte ces informations, chacune dans son propre champ.

## Hors périmètre

- Lister ou rechercher les enchères.
- L'historique des mises d'une enchère.

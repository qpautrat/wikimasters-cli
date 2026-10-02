# Miser sur une enchère

## Contexte

Les enchères permettent d'acheter une carte précise avec des wikibidous. Le jeu impose à chaque mise un montant minimal, qui dépend de la mise précédente (voir `docs/game-rules.md`). Miser le minimum est la première brique pour déléguer ses mises à l'agent.

## User story

En tant que joueur, je donne l'identifiant d'une enchère et la commande y place la mise minimale fixée par le jeu.

## Critères d'acceptation

1. La commande prend en argument l'identifiant unique de l'enchère (UUID `auctions.id`).
2. La commande place une mise égale au montant minimal que le jeu accepte pour cette enchère au moment de la mise.
3. La commande affiche le montant misé et mon nouveau solde de wikibidous.
4. La commande échoue sans rien miser, avec un message explicite, quand l'enchère n'est plus en cours ou quand j'en suis le vendeur.
5. Quand le jeu refuse la mise (solde insuffisant, mise dépassée entre-temps, vérification humaine demandée), la commande échoue en affichant le motif donné par le jeu.
6. La commande mise même quand je suis déjà le meilleur enchérisseur : surenchérir sur ma propre mise décourage les concurrents.

## Hors périmètre

- Miser un montant choisi.
- Lister ou rechercher les enchères pour obtenir leur identifiant.
- Miser automatiquement à la place du joueur.

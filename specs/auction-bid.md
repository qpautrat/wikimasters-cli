# Miser sur une enchère

## Contexte

Les enchères permettent d'acheter une carte précise avec des wikibidous. L'API expose une seule route de mise, qui prend un montant et juge seule si la mise est recevable : statut de l'enchère, vendeur, montant minimal (voir `docs/game-rules.md`). La commande est à son image.

## User story

En tant que joueur, je donne l'identifiant d'une enchère et un montant, et la commande y place une mise de ce montant exact.

## Critères d'acceptation

1. La commande prend en arguments l'identifiant unique de l'enchère (UUID `auctions.id`) et un montant en wikibidous.
2. Un montant qui n'est pas un entier strictement positif est refusé sans rien envoyer.
3. La commande envoie une mise de ce montant exact, ni arrondi ni ajusté, sans vérifier au préalable le statut de l'enchère, son vendeur, son meilleur enchérisseur ni le montant minimal.
4. La commande affiche le montant misé et mon nouveau solde de wikibidous.
5. Quand le jeu refuse la mise (enchère terminée, mise trop basse, solde insuffisant, vérification humaine demandée), la commande échoue en affichant le motif donné par le jeu, et pour une mise trop basse le minimum qu'il accepte.

## Hors périmètre

- Calculer la mise minimale : `wikimasters auction show` la donne.
- Lister ou rechercher les enchères pour obtenir leur identifiant.
- Miser automatiquement à la place du joueur.

# Laisser le jeu refuser le prix de départ et la durée d'une enchère

## Contexte

`wikimasters auction create` refuse sans rien envoyer un prix de départ ou une durée qui n'est pas un entier strictement positif. Le jeu vérifie déjà la durée (de 10 minutes à 12 heures) ; ce qu'il répond à un prix de départ nul ou négatif n'a pas été observé.

Dépend de : [Mettre une carte aux enchères](../auction-create.md).

## User story

En tant que joueur, je donne un prix de départ et une durée, et la commande les envoie tels quels au jeu, qui les accepte ou les refuse.

## Critères d'acceptation

1. Un prix de départ ou une durée qui n'est pas un nombre entier est refusé sans rien envoyer.
2. Un prix de départ ou une durée entier, nul ou négatif compris, est envoyé tel quel.
3. Quand le jeu refuse le prix de départ ou la durée, la commande échoue en affichant le motif donné par le jeu.
4. Les autres critères de la commande ne changent pas.

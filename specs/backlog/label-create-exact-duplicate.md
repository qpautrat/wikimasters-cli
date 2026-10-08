# Signaler l'étiquette existante par son nom exact à la création

## Contexte

Quand le jeu refuse une création d'étiquette comme un doublon, `wikimasters labels create` retrouve l'étiquette existante en comparant les noms sans tenir compte des majuscules ([Créer une étiquette](../label-create.md), critère 3). La CLI suppose ainsi comment le jeu compare les noms, alors qu'elle ne transforme pas ses arguments et ne reproduit aucune règle du jeu : c'est l'agent qui choisit le nom transmis. Cette correction ramène le critère 3 de [Créer une étiquette](../label-create.md) au nom exact.

Dépend de : [Créer une étiquette](../label-create.md).

## User story

En tant que joueur, je crée une étiquette sous le nom exact que je donne, sans que la CLI interprète ce nom.

## Critères d'acceptation

1. Quand le jeu refuse la création comme un doublon et qu'une de mes étiquettes porte exactement le nom donné, `wikimasters labels create <name>` réussit sans rien créer et signale cette étiquette.
2. Quand le jeu refuse la création comme un doublon et qu'aucune de mes étiquettes ne porte exactement le nom donné, la commande rapporte le refus du jeu avec sa raison, sans rien créer.
3. La commande transmet le nom au jeu tel que donné, sans le modifier.

## Hors périmètre

- Retrouver une étiquette dont le nom ne diffère que par les majuscules.

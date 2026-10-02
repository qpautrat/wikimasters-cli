# Défausser toutes mes cartes communes

## Contexte

Défausser des cartes rapporte des wikibidous, la monnaie des enchères. Dans l'interface, la collection permet de sélectionner des cartes et de les défausser par lot, mais page par page, 50 cartes au plus par page : défausser toutes ses communes demande beaucoup de clics.

Une carte possédée garde la rareté qu'elle avait à son obtention (`user_cards.snapshot_rarity`), qui peut différer de la rareté actuelle de la carte au catalogue. C'est la rareté possédée que l'interface affiche et classe.

## User story

En tant que joueur, je défausse en une commande toutes les cartes communes de ma collection, sans risquer de défausser une carte plus rare, pour gagner des wikibidous.

## Critères d'acceptation

1. La commande défausse toutes les cartes de ma collection dont la rareté possédée est commune (`C`), quel que soit le nombre de pages qu'elles occupent dans l'interface.
2. Aucune carte d'une autre rareté possédée n'est défaussée, même si sa rareté actuelle au catalogue est commune.
3. Les cartes communes marquées en favori, brillantes, portant au moins une étiquette ou engagées dans un échange en cours ne sont pas défaussées.
4. La commande affiche le nombre de cartes défaussées, les wikibidous gagnés et mon nouveau solde de wikibidous.
5. Sans carte commune à défausser, la commande réussit sans rien modifier.

## Hors périmètre

- Défausser des cartes d'une autre rareté.
- Choisir les cartes à défausser une par une.

# Limiter le nombre de cartes communes défaussées

## Contexte

`wikimasters collection discard-commons` défausse toutes mes cartes communes d'un coup. Je veux parfois n'en défausser qu'une partie, pour garder des communes ou ne gagner que les wikibidous dont j'ai besoin.

Dépend de : [Défausser toutes mes cartes communes](../discard-commons.md).

## User story

En tant que joueur, je choisis le nombre maximal de cartes communes à défausser, pour ne pas vider toutes mes communes quand je n'en ai pas besoin.

## Critères d'acceptation

1. La commande accepte un nombre maximal de cartes à défausser, entier strictement positif.
2. Sans ce nombre, la commande défausse toutes les cartes communes éligibles, comme aujourd'hui.
3. Avec ce nombre, elle défausse au plus ce nombre de cartes, en commençant par les plus anciennement obtenues.
4. Un nombre supérieur au nombre de communes éligibles les défausse toutes, sans erreur.
5. Une valeur qui n'est pas un entier strictement positif est refusée sans rien défausser.

# Lister la liste de souhaits

## Contexte

Pour consulter ma liste de souhaits, il faut aujourd'hui passer par l'interface. Je veux la voir depuis le terminal, avec l'identifiant de chaque carte pour pouvoir enchaîner sur d'autres commandes.

## User story

En tant que joueur, je consulte ma liste de souhaits avec, pour chaque carte, son identifiant, son titre et sa rareté.

## Critères d'acceptation

1. `wkm wishlist list` affiche une ligne par carte de ma liste de souhaits : identifiant, titre, rareté.
2. Les cartes sont triées par date d'ajout, la plus récente en premier.
3. Une liste vide n'est pas une erreur : la commande le signale et sort avec le code 0.

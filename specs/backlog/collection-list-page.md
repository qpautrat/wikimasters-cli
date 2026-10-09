# Lister une page de ma collection

## Contexte

`wikimasters collection list` lit toute ma collection, page après page de 1000 entrées, en autant de requêtes qu'il en faut (4 pour 3925 cartes le 2026-10-09). Chaque page est une requête `GET user_cards` distincte : la commande compose plusieurs appels.

Dépend de : [Lister ma collection](../collection-list.md).

## User story

En tant que joueur, je lis une page de ma collection, et l'agent demande les pages suivantes s'il en a besoin.

## Critères d'acceptation

1. `wikimasters collection list` envoie une seule requête et affiche la page demandée, la première par défaut.
2. Les options `--page <p>` et `--limit <n>` choisissent la page et le nombre d'entrées par page, 1000 par défaut, et sont transmises au jeu telles quelles.
3. La commande signale quand la page est pleine, signe que d'autres pages peuvent suivre.
4. Avec `--json`, stdout porte la liste des cartes de la page et un champ `full`, vrai quand la page porte autant d'entrées que demandé.
5. Les autres critères de la commande ne changent pas, sauf celui qui affiche toute la collection quel que soit le nombre de pages.

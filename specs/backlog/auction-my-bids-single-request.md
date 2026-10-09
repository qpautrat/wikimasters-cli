# Lister mes mises sur les enchères en cours en une seule requête

## Contexte

`wikimasters auction bids` lit mes mises sur les enchères en cours, page après page de 1000, puis garde ma mise la plus haute par enchère et trie les enchères par heure de fin : la commande compose plusieurs appels et retravaille la réponse du jeu. La requête `GET auction_bids` renvoie une ligne par mise, avec l'enchère embarquée (heure de fin, mise actuelle, meilleur enchérisseur, titre de la carte), filtrée sur les enchères `active` dont l'heure de fin n'est pas passée.

Dépend de : [Lister les enchères en cours sur lesquelles j'ai misé](../auction-my-bids.md).

## User story

En tant que joueur, je lis mes mises sur les enchères en cours telles que le jeu les renvoie, et l'agent en tire ma mise la plus haute par enchère et leur ordre.

## Critères d'acceptation

1. `wikimasters auction bids` envoie une seule requête et affiche la page demandée, la première par défaut.
2. Les options `--page <p>` et `--limit <n>` choisissent la page et le nombre de mises par page, 1000 par défaut, et sont transmises au jeu telles quelles.
3. La commande affiche une ligne par mise, dans l'ordre où le jeu les renvoie : l'identifiant de l'enchère, le titre de la carte, le montant de la mise, la date de la mise, la mise actuelle, si je suis le meilleur enchérisseur et l'heure de fin.
4. La commande signale quand la page est pleine, signe que d'autres pages peuvent suivre.
5. Avec `--json`, stdout porte la liste des mises de la page, chacune avec ces informations dans des champs distincts, et un champ `full`, vrai quand la page porte autant de mises que demandé.
6. Les critères qui gardent une ligne par enchère avec ma mise la plus haute et qui trient par heure de fin ne s'appliquent plus ; les autres ne changent pas.

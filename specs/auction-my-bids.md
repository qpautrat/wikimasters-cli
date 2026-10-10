# Lister les enchères en cours sur lesquelles j'ai misé

## Contexte

Pour remiser sur une enchère, `wikimasters auction bid` demande son identifiant, que je dois aujourd'hui retrouver dans l'interface. Je veux voir depuis le terminal mes mises sur les enchères en cours, avec l'identifiant de chaque enchère et son état.

Dépend de : [Miser sur une enchère](auction-bid.md).

## User story

En tant que joueur, je lis mes mises sur les enchères en cours telles que le jeu les renvoie, et l'agent en tire ma mise la plus haute par enchère et leur ordre, pour savoir où je mène et sur lesquelles remiser.

## Critères d'acceptation

1. `wikimasters auction bids` envoie une seule requête et affiche la page demandée de mes mises sur les enchères en cours, la première par défaut.
2. Les options `--page <p>` et `--limit <n>`, des entiers strictement positifs, choisissent la page et le nombre de mises par page, 1000 par défaut ; la limite est transmise au jeu telle quelle. Une page ou une limite qui n'en est pas un est refusée sans rien lire.
3. La commande affiche une ligne par mise, dans l'ordre où le jeu les renvoie : l'identifiant de l'enchère, le titre de la carte, le montant de la mise, la date de la mise, la mise actuelle, si je suis le meilleur enchérisseur et l'heure de fin.
4. Une enchère est en cours tant que son statut est `active` et que son heure de fin n'est pas passée ; les mises sur les autres n'apparaissent pas.
5. La commande signale quand la page est pleine, signe que d'autres pages peuvent suivre.
6. Une page vide n'est pas une erreur : la commande le signale et sort avec le code 0.
7. Avec `--json`, stdout porte la liste des mises de la page, chacune avec ces informations dans des champs distincts, et un champ `full`, vrai quand la page porte autant de mises que demandé.

## Hors périmètre

- Les enchères terminées, gagnées ou perdues.
- Les enchères en cours sur lesquelles je n'ai pas misé.

# Rechercher un joueur

## Contexte

Je ne connais d'un joueur que son pseudo, ou une partie, alors que d'autres requêtes du jeu prennent son identifiant. La page « Amis » du jeu permet de chercher un joueur par son pseudo.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne tout ou partie d'un pseudo et j'obtiens les joueurs que le jeu trouve, avec leur identifiant.

## Critères d'acceptation

1. La commande envoie une seule requête, avec le texte tel quel, sans le vérifier au préalable.
2. Chaque ligne donne l'identifiant du joueur et son pseudo.
3. Quand la réponse peut ne pas porter tous les joueurs qui correspondent, la commande le signale.
4. Une réponse vide n'est pas une erreur : la commande le signale.
5. Quand le jeu refuse la recherche, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte les joueurs trouvés, chacun avec son identifiant et son pseudo, et indique quand d'autres joueurs peuvent correspondre.

## Hors périmètre

- L'avatar des joueurs.

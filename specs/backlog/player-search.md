# Rechercher un joueur

## Contexte

Je ne connais d'un joueur que son pseudo, ou une partie, alors que d'autres requêtes du jeu prennent son identifiant. La page « Amis » du jeu (`/friends`) cherche les joueurs avec `GET /api/friends/search?q=<texte>`, qui répond `{"users": [{"id", "username", "avatar_url", "avatar_pos_x", "avatar_pos_y"}…]}`. Le texte est cherché n'importe où dans le pseudo, sans tenir compte de la casse. La réponse porte au plus 10 joueurs ; un texte d'un caractère ou absent reçoit une liste vide (observé le 2026-10-22). La page n'envoie la recherche qu'à partir de deux caractères.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne tout ou partie d'un pseudo et j'obtiens les joueurs que le jeu trouve, avec leur identifiant.

## Critères d'acceptation

1. `wikimasters player search <texte>` envoie une seule requête, avec le texte tel quel, sans en vérifier la longueur au préalable.
2. Chaque ligne donne l'identifiant du joueur et son pseudo.
3. La commande signale quand la réponse porte 10 joueurs, signe que d'autres peuvent correspondre.
4. Une réponse vide n'est pas une erreur : la commande le signale.
5. Quand le jeu refuse la recherche, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte `users`, une liste d'objets `id` et `username`, et `full`, vrai quand la réponse porte 10 joueurs.

## Hors périmètre

- L'avatar des joueurs.

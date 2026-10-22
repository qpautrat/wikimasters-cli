# Lister mes amis et mes demandes en attente

## Contexte

Mes amis et les demandes d'ami en attente, celles que j'ai reçues comme celles que j'ai envoyées, ne se consultent aujourd'hui que dans la page « Amis » du jeu. Accepter, refuser ou annuler une demande, ou retirer un ami, depuis le terminal demande de les connaître avec leur identifiant.

La page lit la liste avec `GET /api/friends`, qui répond `{"friendships": [...], "counts": {...}}` ; chaque entrée porte l'identifiant de la ligne `friendships`, son statut (`accepted` ou `pending`), `requester_id`, `addressee_id` et les deux joueurs `requester` et `addressee`.

Dépend de : [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, j'obtiens la liste de mes amis et de mes demandes d'ami en attente, avec les identifiants qui les désignent.

## Critères d'acceptation

1. `wikimasters friend list` envoie une seule requête, sans filtrer ni trier ce que le jeu renvoie.
2. Chaque entrée donne l'identifiant et le pseudo du joueur, s'il s'agit d'un ami (`friend`, statut `accepted`), d'une demande reçue (`received`, statut `pending` dont je suis le destinataire) ou d'une demande envoyée (`sent`, statut `pending` dont je suis l'auteur), et l'identifiant que le jeu donne à cette entrée, celui de la ligne `friendships`.
3. La liste correspond à ce que montre la page « Amis » du jeu au même moment.
4. Une liste vide n'est pas une erreur : la commande le signale.
5. Quand le jeu refuse la requête, la commande échoue en affichant le motif donné par le jeu. Une entrée d'un autre statut qu'`accepted` ou `pending`, ou dont je ne suis ni l'auteur ni le destinataire, fait échouer la commande sur une réponse inattendue.
6. Avec `--json`, stdout porte la liste, chaque entrée avec les champs affichés en texte : `friendshipId`, `kind`, `playerId` et `username`.

## Hors périmètre

- Les amis et les demandes d'un autre joueur.

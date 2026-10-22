# Retirer un ami ou une demande d'ami que j'ai envoyée

## Contexte

Retirer un joueur de mes amis, ou annuler une demande d'ami que j'ai envoyée et qui reste en attente tant que l'autre joueur n'y a pas répondu, demande aujourd'hui d'ouvrir le jeu.

Le jeu fait les deux par la même requête, `DELETE /api/friends/<id>` sans corps, où `<id>` est l'identifiant de la ligne `friendships`. La page « Amis » l'envoie depuis le bouton « Annuler » d'une demande envoyée, et la page de profil d'un ami depuis le bouton « Retirer des amis », avec le `friendshipId` que renvoie `GET /api/profile/<pseudo>`. Le 2026-10-22 :

- sur une demande `pending` envoyée à un autre joueur, la route a répondu HTTP 200 `{"success":true}`, et ni la table `friendships` ni `GET /api/friends` ne renvoient plus la ligne : la demande est supprimée, pour moi comme pour le joueur demandé ;
- sur une amitié `accepted`, la route a répondu HTTP 200 `{"success":true}`, et la table `friendships` ne renvoie plus la ligne : aucune ligne ne me lie plus à ce joueur, pour moi comme pour lui ;
- une seconde requête sur une ligne supprimée, un identifiant inconnu et un identifiant mal formé ont reçu HTTP 404 `{"error":"Introuvable"}`.

Dépend de : [Ajouter un ami](friend-add.md), [Accepter une demande d'ami](friend-accept.md), [Lister mes amis et mes demandes en attente](friend-list.md), [Sortie JSON des commandes](json-output.md).

## User stories

- En tant que joueur, je donne l'identifiant d'une demande d'ami que j'ai envoyée, et la commande l'annule.
- En tant que joueur, je donne l'identifiant qui désigne un de mes amis, et la commande le retire de mes amis.

## Critères d'acceptation

1. `wikimasters friend remove <amitié-id>` prend l'identifiant tel que le donne le `friendshipId` d'une ligne `friend` ou `sent` de `friend list`.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que la ligne existe, que j'y figure, ni qu'il s'agit d'une demande en attente ou d'une amitié.
3. Une fois la demande annulée, elle n'apparaît plus en attente dans la page « Amis » du jeu, ni chez moi ni chez le joueur demandé.
4. Une fois l'ami retiré, il n'apparaît plus parmi mes amis dans la page « Amis » du jeu, et je n'apparais plus parmi les siens.
5. La commande affiche `Friendship <amitié-id> removed.` quand le jeu renvoie `{"success":true}`, et échoue sur toute autre réponse en la citant, le retrait ayant pu avoir lieu.
6. Quand le jeu refuse le retrait (ligne introuvable, déjà retirée), la commande échoue en affichant le motif donné par le jeu.
7. Avec `--json`, stdout porte `{ "friendshipId": "…", "success": true }`, où `success` est le résultat renvoyé par le jeu.

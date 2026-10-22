# Refuser une demande d'ami

## Contexte

Un autre joueur peut m'envoyer une demande d'ami, et la refuser demande aujourd'hui d'ouvrir la page « Amis » du jeu. La page la refuse par `PATCH /api/friends/<id>` avec `{"action":"decline"}`, où `<id>` est l'identifiant de la ligne `friendships`, et ignore la réponse. Le 2026-10-22, sur une demande `pending` reçue d'un autre joueur, la route a répondu HTTP 200 `{"status":"declined"}`, et la table `friendships` ne renvoie plus la ligne. Le même jour, un second refus de cette demande, un identifiant inconnu et un identifiant mal formé ont reçu HTTP 404 `{"error":"Demande introuvable"}`.

`GET /api/friends`, que lit la page « Amis », omettait cette demande quand elle était en attente.

Dépend de : [Lister mes amis et mes demandes en attente](friend-list.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une demande d'ami que j'ai reçue, et la commande la refuse.

## Critères d'acceptation

1. `wikimasters friend decline <demande-id>` prend l'identifiant de la demande, tel que le donne le `friendshipId` d'une demande `received` de `friend list`.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que la demande existe, qu'elle m'est adressée ou qu'elle est encore en attente.
3. Une fois la demande refusée, elle n'apparaît plus parmi mes demandes en attente dans la page « Amis » du jeu, et le joueur n'apparaît pas parmi mes amis.
4. La commande affiche l'identifiant de la demande refusée et le statut renvoyé par le jeu.
5. Quand le jeu rejette le refus (demande introuvable, demande déjà refusée), la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte `{ "friendshipId": "…", "status": "declined" }`, où `status` est le statut renvoyé par le jeu.

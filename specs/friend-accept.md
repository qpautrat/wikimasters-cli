# Accepter une demande d'ami

## Contexte

Un autre joueur peut m'envoyer une demande d'ami, et l'accepter demande aujourd'hui d'ouvrir la page « Amis » du jeu. La page l'accepte par `PATCH /api/friends/<id>` avec `{"action":"accept"}`, où `<id>` est l'identifiant de la ligne `friendships`, et ignore la réponse. Le 2026-10-22, sur une demande `pending` reçue d'un autre joueur, la route a répondu HTTP 200 `{"status":"accepted"}`, et la ligne `friendships` est passée au statut `accepted`. Le même jour, une seconde acceptation de cette demande a reçu HTTP 409 `{"error":"Demande déjà traitée"}`, et un identifiant inconnu ou mal formé HTTP 404 `{"error":"Demande introuvable"}`.

`GET /api/friends`, que lit la page « Amis », omettait cette demande quand elle était en attente et omet toujours ce joueur une fois la demande acceptée.

Dépend de : [Lister mes amis et mes demandes en attente](friend-list.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une demande d'ami que j'ai reçue, et la commande l'accepte.

## Critères d'acceptation

1. `wikimasters friend accept <demande-id>` prend l'identifiant de la demande, tel que le donne le `friendshipId` d'une demande `received` de `friend list`.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que la demande existe, qu'elle m'est adressée ou qu'elle est encore en attente.
3. Une fois la demande acceptée, le joueur apparaît parmi mes amis dans la page « Amis » du jeu, et j'apparais parmi les siens.
4. La commande affiche l'identifiant de la demande acceptée et le statut renvoyé par le jeu.
5. Quand le jeu refuse l'acceptation (demande introuvable, demande déjà traitée), la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte `{ "friendshipId": "…", "status": "accepted" }`, où `status` est le statut renvoyé par le jeu.

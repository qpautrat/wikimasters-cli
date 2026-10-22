# Ajouter un ami

## Contexte

Pour proposer un échange à un joueur, il doit être mon ami, et l'ajouter en ami demande aujourd'hui d'ouvrir la page « Amis » du jeu (`/friends`). D'après le JavaScript de cette page (lu le 2026-10-22, non encore envoyé sur le compte), l'ajout envoie `POST /api/friends` avec `{"addressee_id": <identifiant du joueur>}`, qui répond `{"friendship": …}` ; la demande reste en attente (`pending`) jusqu'à ce que l'autre joueur l'accepte. Le jeu limite les demandes par jour : il refuse au-delà par HTTP 429 avec `{"code": "friend_request_daily_limit", "error", "limit", "is_pro", "resets_at"}`. Tout autre refus porte son motif dans `error`.

Dépend de : [Rechercher un joueur](player-search.md).

## User story

En tant que joueur, je donne l'identifiant d'un joueur et la commande lui envoie une demande d'ami.

## Critères d'acceptation

1. `wikimasters friend add <player-id>` envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que le joueur existe, qu'il n'est pas déjà mon ami ou qu'aucune demande n'est déjà en attente.
2. La demande envoyée apparaît en attente dans la page « Amis » du jeu, chez moi et chez le joueur demandé.
3. La commande affiche l'identifiant de la relation d'amitié créée et son statut.
4. Quand le jeu refuse la demande, la commande échoue en affichant le motif donné par le jeu.
5. Quand le jeu refuse parce que la limite quotidienne de demandes est atteinte, la commande affiche aussi cette limite et le moment où elle se réinitialise.
6. Avec `--json`, stdout porte la relation d'amitié telle que le jeu la renvoie.

## Hors périmètre

- [Accepter une demande d'ami](friend-accept.md).
- [Refuser une demande d'ami](friend-decline.md).
- [Annuler une demande d'ami que j'ai envoyée](friend-cancel.md).
- Retirer un ami.
- [Lister mes amis et mes demandes en attente](friend-list.md).

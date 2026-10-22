# Ajouter un ami

## Contexte

L'interface du jeu ne propose un échange qu'à un ami, et ajouter un joueur en ami demande aujourd'hui d'ouvrir la page « Amis » du jeu. La demande attend que l'autre joueur l'accepte. La page envoie la demande avec `POST /api/friends` et le corps `{"addressee_id": <identifiant>}`, qui répond `{"friendship": {"id", "requester_id", "addressee_id", "status", "created_at", "updated_at"}}`.

Dépend de : [Rechercher un joueur](player-search.md).

## User story

En tant que joueur, je donne l'identifiant d'un joueur et la commande lui envoie une demande d'ami.

## Critères d'acceptation

1. `wikimasters friend add <identifiant>` envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que le joueur existe, qu'il n'est pas déjà mon ami ou qu'aucune demande n'est déjà en attente.
2. La demande envoyée apparaît en attente dans la page « Amis » du jeu, chez moi et chez le joueur demandé.
3. La commande affiche l'identifiant de la demande créée et son statut.
4. Quand le jeu refuse la demande, la commande échoue en affichant le motif donné par le jeu.
5. Avec `--json`, stdout porte la demande telle que le jeu la renvoie.

## Hors périmètre

- [Accepter une demande d'ami](friend-accept.md).
- [Refuser une demande d'ami](friend-decline.md).
- [Retirer un ami ou une demande d'ami que j'ai envoyée](friend-remove.md).
- [Lister mes amis et mes demandes en attente](friend-list.md).

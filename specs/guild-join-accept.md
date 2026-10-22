# Accepter de rejoindre une guilde

## Contexte

Une guilde peut m'inviter à la rejoindre, et accepter cette invitation demande aujourd'hui d'ouvrir la page « Guildes » du jeu. Le jeu n'a pas d'identifiant d'invitation : la notification `guild_invite` porte le `guild_id` de la guilde qui invite, et la page accepte l'invitation par `POST /api/guilds/join` avec `{"guild_id": "<id>"}`. Le 2026-10-22, sur une invitation reçue de « Les Churros », la route a répondu HTTP 200 `{"ok":true}`, et la page « Guildes » m'a montré membre de cette guilde. Le même jour, une nouvelle acceptation a reçu HTTP 409 `{"error":"Vous êtes déjà dans une guilde"}`, et un identifiant inconnu ou mal formé HTTP 404 `{"error":"Guilde introuvable"}`.

Dépend de : [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une guilde qui m'a invité à la rejoindre, et la commande accepte son invitation.

## Critères d'acceptation

1. `wikimasters guild join <guilde-id>` prend l'identifiant de la guilde, tel que le donne le `guild_id` des données d'une notification `guild_invite` de `notifications list`.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que l'invitation existe, qu'elle m'est adressée ou qu'elle est encore valable.
3. Une fois l'invitation acceptée, je suis membre de la guilde dans la page « Guildes » du jeu.
4. La commande affiche l'identifiant de la guilde dont l'invitation est acceptée.
5. Quand le jeu refuse l'acceptation (guilde introuvable, déjà dans une guilde), la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte `{ "guildId": "…", "ok": true }`, où `ok` est le résultat renvoyé par le jeu.

## Hors périmètre

Lister mes invitations reçues et quitter une guilde : specs à part.

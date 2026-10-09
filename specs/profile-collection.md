# Lire la collection d'un joueur

## Contexte

Pour proposer un échange, je dois désigner l'exemplaire exact de la carte que je demande dans la collection de l'autre joueur. Le formulaire d'échange du jeu lit cette collection avec `GET /api/profile/<pseudo>/collection?page=<n>&sort=<champ>&stats=0&pending=1`, avec `q=<texte>`, `rarity=<code>` pour chaque rareté filtrée et `wishlisted_by_me=1` pour ne garder que les cartes de ma liste de souhaits. Le jeu numérote les pages à partir de 0 (`page=0` est la première) ; chaque page porte au plus 50 entrées ; chaque entrée donne l'identifiant de l'entrée de collection (`id`), ce que la proposition d'échange attend, la carte (identifiant, titre, rareté possédée), le nombre d'exemplaires, le favori, la brillance et les étiquettes. La réponse liste aussi les cartes du joueur engagées dans un échange en attente (`pendingTradeCardIds`) ; le formulaire envoie toujours `pending=1` pour les obtenir (non vérifié sur le compte, aucun échange en attente le 2026-10-09). La route prend le pseudo : un identifiant de joueur reçoit HTTP 404 `{"error":"Profil introuvable"}`. La collection d'un joueur qui n'est pas mon ami se lit aussi (observé le 2026-10-09).

Dépend de : [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne le pseudo d'un joueur et j'obtiens une page de sa collection, avec l'identifiant de chaque entrée, pour lui demander une carte en échange.

## Critères d'acceptation

1. `wikimasters profile collection <pseudo>` envoie une seule requête et affiche la page demandée de la collection du joueur, la première (page 0) par défaut.
2. Les options `--page <n>`, `--sort <champ>`, `--search <texte>`, `--rarity <code>` (répétable) et `--wishlisted` transmettent au jeu, tels quels, la page, le tri, le texte, chaque rareté et le filtre sur ma liste de souhaits ; sans `--sort`, la commande n'envoie pas de tri.
3. Chaque ligne donne l'identifiant de l'entrée de collection, l'identifiant unique de la carte (UUID `cards.id`), son titre, sa rareté possédée, son nombre d'exemplaires, si elle est en favori, si elle est brillante, ses étiquettes et si elle est engagée dans un échange en attente.
4. La commande signale quand la page est pleine (50 entrées), signe que d'autres pages peuvent suivre.
5. Une page vide n'est pas une erreur : la commande le signale.
6. Quand le jeu refuse la lecture (profil introuvable), la commande échoue en affichant le motif donné par le jeu.
7. Avec `--json`, stdout porte `entries`, une liste d'objets `entryId`, `id`, `title`, `rarity`, `count`, `starred`, `shiny`, `labels` et `pendingTrade`, et `full`, vrai quand la page porte 50 entrées.

## Hors périmètre

- Le filtre sur une étiquette du joueur (`tag_id`) et les statistiques de la collection (`stats=1`), dont les réponses n'ont pas été observées.

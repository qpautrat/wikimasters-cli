# Proposer un échange

## Contexte

Quand un ami possède une carte qui me manque, je lui propose un échange. Le formulaire d'échange du jeu envoie `POST /api/trades` avec `{"recipient_id": <identifiant du joueur>, "items": [{"user_card_id": <entrée de collection>, "card_id": <carte>, "offered_by": <identifiant de celui qui la donne>}…], "initiator_wikibidous": <wikibidous que je donne>, "recipient_wikibidous": <wikibidous que je demande>}`, plus `"parent_trade_id": <échange>` pour une contre-offre. L'interface n'ouvre le formulaire qu'avec un ami, limite un échange à 100 cartes et à 10 000 wikibidous par joueur, refuse une carte en favori et un solde insuffisant ; on ne sait pas encore lesquelles de ces règles l'API impose. Le jeu peut demander une vérification humaine (`human_verification_required`). L'échange proposé apparaît dans `GET /api/trades` avec le statut `pending`.

Dépend de : [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md), [Lire la collection d'un joueur](profile-collection.md), [Chercher dans la Collection Globale](cards-global.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne un ami, les cartes que je lui offre, celles que je lui demande et, si je veux, des wikibidous de part et d'autre, et la commande lui propose l'échange.

## Critères d'acceptation

1. `wikimasters trade propose <joueur-id>` prend l'identifiant du joueur, tel que le donne `cards global`.
2. L'option `--give <entrée-id>:<card-id>`, répétable, prend l'identifiant d'une entrée de ma collection et celui de sa carte, tels que les donne `collection list`.
3. L'option `--take <entrée-id>:<card-id>`, répétable, prend l'identifiant d'une entrée de la collection du joueur et celui de sa carte, tels que les donne `profile collection`.
4. Les options `--give-wikibidous <n>` et `--take-wikibidous <n>` valent 0 par défaut ; une valeur qui n'est pas un nombre entier est refusée sans rien envoyer.
5. L'option `--counter <échange-id>` envoie la proposition comme contre-offre de cet échange.
6. La commande envoie une seule requête, avec les cartes, les montants et l'échange d'origine exacts, sans lire ma collection au préalable ni vérifier l'amitié, le nombre de cartes, les montants, mon solde ou l'état des cartes (favori, brillante, étiquetée).
7. La commande affiche l'identifiant de l'échange proposé.
8. Quand le jeu refuse la proposition (vérification humaine demandée, carte verrouillée, solde insuffisant), la commande échoue en affichant le motif donné par le jeu.
9. Avec `--json`, stdout porte l'identifiant de l'échange proposé dans un champ `tradeId`.

## Hors périmètre

- Accepter, refuser ou annuler un échange (`PATCH /api/trades/<id>`).
- Lister mes échanges.
- Choisir les cartes ou les montants : l'agent le fait.

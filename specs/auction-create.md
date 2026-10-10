# Mettre une carte aux enchères

## Contexte

Les wikibidous qui financent mes enchères viennent de la vente des cartes de ma collection. Le formulaire de mise aux enchères du jeu envoie `POST /api/marketplace` avec `{"card_id": <user_cards.id>, "base_amount": <prix de départ>, "duration_minutes": <durée>}`, et le jeu répond l'identifiant de l'enchère créée (`auction_id`). La route attend l'identifiant de l'entrée de ma collection, pas celui de la carte. L'interface propose les durées 10, 30, 60, 180, 360 et 720 minutes et limite le nombre d'enchères simultanées ; l'API refuse une durée hors de 10 minutes à 12 heures.

Dépend de : [Lister ma collection](collection-list.md), [Afficher l'identifiant d'entrée des cartes de ma collection](collection-list-entry-id.md), [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne une entrée de ma collection, un prix de départ et une durée, et la commande l'envoie telle quelle au jeu, qui la met aux enchères.

## Critères d'acceptation

1. `wikimasters auction create <entrée-id> <prix-de-départ> <durée-en-minutes>` prend l'identifiant d'une entrée de ma collection (UUID `user_cards.id`), tel que le donne `collection list`, un prix de départ en wikibidous et une durée en minutes.
2. Un prix de départ ou une durée qui n'est pas un entier strictement positif est refusé sans rien envoyer.
3. La commande envoie une seule requête, `POST /api/marketplace`, sans lire ma collection au préalable ; une entrée que je ne possède pas est refusée par le jeu, et la commande échoue en affichant le motif donné par le jeu.
4. La commande envoie le prix de départ et la durée exacts, sans vérifier au préalable la liste des durées de l'interface, le nombre de mes enchères en cours ni l'état de l'entrée (favori, brillante, étiquetée).
5. La commande affiche l'identifiant de l'enchère créée.
6. Quand le jeu refuse la mise aux enchères (vérification humaine demandée, trop d'enchères simultanées, durée refusée), la commande échoue en affichant le motif donné par le jeu.
7. Avec `--json`, stdout porte l'identifiant de l'enchère créée dans un champ `auctionId`.

## Hors périmètre

- Annuler une enchère ou baisser son prix de départ.
- Lister mes enchères en cours en tant que vendeur.
- Choisir le prix de départ ou la durée : l'agent le fait.

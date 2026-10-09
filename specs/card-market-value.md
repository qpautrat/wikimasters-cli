# Connaître la valeur de marché d'une carte

## Contexte

Pour financer mes enchères, je vends les cartes qui ne m'intéressent pas, en commençant par celles qui valent le plus. Le jeu ne montre la valeur d'une carte que dans le formulaire de mise aux enchères, carte par carte : il appelle `GET /api/marketplace/cards/<card id>/sales?scope=summary`. Pour un compte non PRO, la route donne le prix de vente moyen de la carte pour chaque rareté sous laquelle elle a été vendue, par exemple `{"summary":{"R":{"average":16}}}`, et `{}` quand la carte ne s'est jamais vendue. Elle ne dit pas sur quelle période porte la moyenne. Une carte inconnue reçoit HTTP 404 `{"error":"Carte introuvable"}`.

Dépend de : [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je donne une ou plusieurs cartes et j'obtiens pour chacune son prix de vente moyen par rareté, pour décider quelles cartes mettre aux enchères en priorité.

## Critères d'acceptation

1. `wikimasters cards value <card-id>…` prend un ou plusieurs identifiants uniques de carte (UUID `cards.id`), que je possède la carte ou non.
2. La commande envoie une requête de résumé des ventes par carte, dans l'ordre donné.
3. Pour chaque carte, la commande affiche son identifiant, son titre et, pour chaque rareté donnée par le jeu, le prix de vente moyen en wikibidous.
4. Une carte sans vente réussit et la commande le dit.
5. Quand le jeu refuse une carte (carte introuvable), la commande échoue en nommant la carte et le motif donné par le jeu, sans interroger les cartes suivantes.
6. Avec `--json`, stdout porte la liste des cartes, chacune avec ses champs `id`, `title` et `averages`, un objet qui associe à chaque rareté donnée par le jeu son prix moyen ; `averages` est vide pour une carte sans vente.

## Hors périmètre

- L'historique détaillé des ventes et les champs réservés aux comptes PRO (nombre de ventes, dernière vente, minimum, maximum).
- Choisir la rareté à retenir pour une carte, ou classer les cartes par valeur : l'agent le fait à partir de `collection list`.
- La période sur laquelle porte la moyenne.

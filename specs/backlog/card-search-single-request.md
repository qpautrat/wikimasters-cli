# Chercher une carte en une seule requête

## Contexte

Avec `--in title`, `wikimasters cards search` lit d'abord les cartes dont le titre contient le texte, puis relit celles dont le titre est exactement le texte pour les placer en tête : la commande compose deux appels.

Dépend de : [Retrouver une carte par son nom](../card-search.md).

## User story

En tant que joueur, je cherche une carte, et la commande envoie une seule requête au jeu, quel que soit le champ cherché.

## Critères d'acceptation

1. `wikimasters cards search <texte>` envoie une seule requête, quel que soit le champ choisi avec `--in`.
2. Avec `--in title` comme avec `--in category` ou `--in summary`, les résultats sont triés par titre.
3. La carte dont le titre est exactement le texte donné n'est plus placée en tête.
4. Les autres critères de la commande ne changent pas.

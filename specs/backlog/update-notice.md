# Signaler qu'une version plus récente de la CLI est publiée

## Contexte

La CLI est publiée sur npm et le site modifie parfois son API interne, ce qui peut casser une version ancienne. `wikimasters --version` donne la version installée, mais rien ne prévient l'utilisateur qu'une version plus récente est publiée.

Dépend de : [Afficher la version installée de la CLI](../version-option.md).

## User story

En tant qu'utilisateur de la CLI dans un terminal, je suis prévenu qu'une version plus récente de `wikimasters` est publiée, pour la mettre à jour.

## Critères d'acceptation

1. Quand une version plus récente que celle installée est publiée sur npm, une commande lancée dans un terminal affiche un avis qui donne les deux versions et la commande de mise à jour.
2. L'avis s'affiche au plus une fois par jour.
3. L'avis n'apparaît jamais sur la sortie standard, avec ou sans `--json`.
4. Hors d'un terminal ou en intégration continue, aucun avis ne s'affiche.
5. L'utilisateur peut désactiver l'avis.
6. Une commande répond dans le même temps et sort avec le même code, que la recherche d'une version plus récente ait lieu ou non, aboutisse ou échoue.

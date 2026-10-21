# Signaler qu'une version plus récente de la CLI est publiée

## Contexte

La CLI est publiée sur npm et le site modifie parfois son API interne, ce qui peut casser une version ancienne. `wikimasters --version` donne la version installée, mais rien ne prévient l'utilisateur qu'une version plus récente est publiée. Les CLI distribuées par npm le signalent d'habitude dans le terminal, sans gêner les scripts ni les agents qui lisent leur sortie.

Dépend de : [Afficher la version installée de la CLI](../version-option.md).

## User story

En tant qu'utilisateur de la CLI dans un terminal, je suis prévenu qu'une version plus récente de `wikimasters` est publiée, pour la mettre à jour.

## Critères d'acceptation

1. Quand une version plus récente que celle installée est publiée sur npm, une commande lancée dans un terminal affiche un avis qui donne les deux versions et la commande de mise à jour.
2. L'avis s'affiche au plus une fois par jour.
3. L'avis n'apparaît jamais sur la sortie standard, avec ou sans `--json`.
4. Hors d'un terminal ou en intégration continue, aucun avis ne s'affiche.
5. L'utilisateur peut désactiver l'avis.
6. Une commande ne met pas plus de temps à répondre, et son code de sortie ne change pas, que la dernière version publiée soit connue ou non.

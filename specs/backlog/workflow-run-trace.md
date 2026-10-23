# Tracer chaque run du workflow de développement

## Contexte

Une fois un run terminé, je ne peux ni observer ni analyser ce que l'agent a fait : seule la conversation en garde la trace, sans structure.

Dépend de : [Dérouler le workflow de développement d'une feature toujours de la même façon](feature-workflow.md).

## User story

En tant que développeur, après un run du workflow, je retrouve ce qui s'est passé à chaque étape, pour l'analyser.

## Critères d'acceptation

1. Chaque run produit une trace sur ma machine, que git ignore, identifiée par la spec traitée et la date du run.
2. Un run arrêté avant la fin produit aussi sa trace, jusqu'à l'étape où il s'est arrêté.
3. La trace liste les étapes dans l'ordre où elles ont eu lieu, chacune avec son début, sa fin et son résultat : réussie, en échec ou arrêtée.
4. La trace liste chaque écart à une règle, avec la règle, l'étape et le moment.
5. La trace liste chaque décision prise en mon nom, avec l'étape et sa raison.
6. La trace donne, par étape et pour le run entier, la durée, les tokens consommés et le nombre d'appels d'outils.
7. La trace ne contient aucun secret : ni jeton, ni cookie, ni contenu d'un fichier `.env`.

## Hors périmètre

- Un outillage d'observabilité hors de ma machine.
- Analyser et comparer les traces : [Analyser et comparer les runs du workflow de développement](workflow-run-analysis.md).

# Analyser et comparer les runs du workflow de développement

## Contexte

Pour améliorer les règles et les skills du workflow, je dois voir où un run a dévié et ce qui diverge d'un run à l'autre. Aujourd'hui, la rétro proposée en fin d'incrément repose sur la seule conversation.

Dépend de : [Tracer chaque run du workflow de développement](workflow-run-trace.md).

## User stories

- En tant que développeur, je fais la rétro d'un run à partir de sa trace.
- En tant que développeur, je compare plusieurs runs pour repérer ce qui diverge et corriger les règles.

## Critères d'acceptation

1. Pour un run, je lis ses étapes, ses écarts aux règles, ses décisions, sa durée et son coût sans relire la conversation.
2. La rétro proposée en fin d'incrément s'appuie sur la trace du run.
3. Pour plusieurs runs, je vois, étape par étape, les différences d'ordre, de résultat, de durée et de coût.
4. Pour plusieurs runs, je vois les règles les plus souvent enfreintes et les décisions qui diffèrent d'un run à l'autre sur une même étape.

## Hors périmètre

- Un outillage d'observabilité hors de ma machine.
- Modifier les règles ou les skills à partir de l'analyse.

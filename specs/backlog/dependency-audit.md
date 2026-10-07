# Bloquer les commits qui contiennent une dépendance vulnérable

## Contexte

Le hook de pre-commit installe les dépendances indexées avec `npm ci --no-audit` : aucune vérification ne porte sur leurs vulnérabilités connues. Une vulnérabilité ne se voit que dans la sortie de `npm ci` lors d'un `mise install`, où personne ne la relève. Le 2026-10-07, un test sur clone neuf a affiché « 1 high severity vulnerability », dans `source-map-js`, une dépendance indirecte dont le correctif est disponible.

Dépend de : [Vérifications avant chaque commit](../commit-checks.md).

## User story

En tant que développeur, un commit dont les dépendances indexées ont une vulnérabilité connue est refusé avant d'être créé.

## Critères d'acceptation

1. Le hook de pre-commit lance `npm audit` sur le `package-lock.json` indexé et refuse le commit si une vulnérabilité est signalée, quelle que soit sa sévérité, dans une dépendance de production comme de développement.
2. Le refus nomme chaque paquet vulnérable et la sévérité de sa vulnérabilité.
3. Si le registre npm est injoignable, le hook refuse le commit et le dit.
4. Le commit qui implémente cette spec corrige les vulnérabilités présentes dans `package-lock.json`.
5. La vérification est documentée dans `CLAUDE.md`, avec les autres vérifications du hook.

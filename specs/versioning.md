# Numéroter les versions publiées

## Contexte

La CLI est publiée sur npm sous le nom `wikimasters-cli`, en version `0.1.0`. Le choix et l'incrément des numéros de version sont hors du périmètre de la publication : rien ne dit aujourd'hui quel numéro porte la version suivante, ni quel commit correspond à une version publiée.

Dépend de : [Publier la CLI sur npm](npm-publish.md).

## User story

En tant que joueur qui installe la CLI depuis npm, je sais d'après son numéro de version si une mise à jour apporte une fonctionnalité, corrige un défaut ou casse un usage existant, et je retrouve sur GitHub le code de chaque version.

## Critères d'acceptation

1. Avant chaque publication, la version de `package.json` augmente selon SemVer d'après les commits depuis la version publiée précédente : majeure pour un changement cassant (`!` ou `BREAKING CHANGE`), mineure pour un `feat`, correctif pour un `fix` ou un `perf`.
2. Un changement cassant depuis une version `0.x` fait passer la version à `1.0.0`.
3. Sans `feat`, `fix`, `perf` ni changement cassant depuis la version publiée précédente, aucune version n'est publiée.
4. Chaque version publiée a un tag git `v<version>` sur le commit publié, poussé sur GitHub.

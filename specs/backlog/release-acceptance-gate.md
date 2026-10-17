# Publier seulement quand les tests d'acceptation passent

## Contexte

`scripts/release.sh` change la version, la committe, la tague et pousse le tag, que GitHub Actions publie sur npm. Rien ne vérifie avant que la version fonctionne contre le vrai jeu : les tests du hook de pre-commit sont unitaires.

Dépend de : [Tests d'acceptation contre le jeu](acceptance-tests.md), [Numéroter les versions publiées](../versioning.md).

## User story

En tant que développeur, une version dont une commande ne fonctionne plus contre le jeu n'est pas publiée.

## Critères d'acceptation

1. `scripts/release.sh` lance les tests d'acceptation avant de changer la version.
2. Si l'un échoue, le script s'arrête sans changer la version, sans committer, sans taguer et sans rien pousser, et nomme les tests en échec.
3. Quand aucun `feat`, `fix`, `perf` ni changement cassant n'a été committé depuis le dernier tag, le script s'arrête sans lancer les tests d'acceptation, comme aujourd'hui.

## Hors périmètre

- Lancer les tests d'acceptation dans GitHub Actions.

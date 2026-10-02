# Vérifications avant chaque commit

## Contexte

Les commits sont atomiques : chacun doit laisser le dépôt dans un état valide. Aujourd'hui, rien ne vérifie un commit avant sa création, et une erreur ne se découvre qu'au commit suivant ou plus tard. Un commit atomique indexe souvent une partie seulement des modifications en cours : le vérifier sur la copie de travail ne prouve rien.

Dépend de : [Outils du dépôt](toolchain.md), [Vérification des types des tests](typecheck-tests.md), [Linter](lint.md), [Formateur](format.md).

## User story

En tant que développeur, un commit qui laisserait le dépôt dans un état invalide est refusé avant d'être créé.

## Critères d'acceptation

1. lefthook est épinglé dans `mise.toml`, et `mise install` installe le hook de pre-commit.
2. Le hook refuse le commit si le build, la vérification des types, le linter, le formateur ou les tests échouent.
3. Le hook vérifie le contenu indexé : une modification non indexée ou un fichier non suivi ne change pas son verdict.
4. Le hook est documenté dans `CLAUDE.md`.

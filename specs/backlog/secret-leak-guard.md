# Bloquer les commits qui contiennent un secret

## Contexte

Deux fichiers peuvent exposer la session du compte WikiMasters. Une capture HAR brute contient cookies et jetons : la première en contenait 7 en-têtes d'authentification et 6 JWT. Les captures sont versionnées, et seul un nettoyage manuel les protège. `.env` contient le jeton de rafraîchissement : il est ignoré par git, mais `git add -f` le commiterait. Aujourd'hui, rien n'empêche techniquement ces commits.

## User story

En tant que développeur, un commit qui contient un secret est refusé avant d'être créé.

## Critères d'acceptation

1. Le repo déclare ses propres outils, versions épinglées, dans un `mise.toml` à sa racine : Node et `betterleaks`. `mise install` suffit à les installer, sans dépendre d'une configuration extérieure au repo.
2. Un hook de pre-commit, installé avec les dépendances du projet, lance `betterleaks` sur les fichiers indexés et refuse le commit s'il détecte un secret.
3. Le hook refuse une capture HAR qui contient encore un JWT ou une valeur de cookie non masquée.
4. Le hook refuse `.env`.

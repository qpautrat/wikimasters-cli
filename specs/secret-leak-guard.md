# Bloquer les commits qui contiennent un secret

## Contexte

Deux fichiers peuvent exposer la session du compte WikiMasters. Une capture HAR brute contient cookies et jetons : la première en contenait 7 en-têtes d'authentification et 6 JWT. Les captures restent locales, mais `git add -f` en commiterait une. `.env` contient le jeton de rafraîchissement : il est ignoré par git, mais `git add -f` le commiterait. Aujourd'hui, rien n'empêche techniquement ces commits.

Dépend de : [Outils du dépôt](toolchain.md), [Vérifications avant chaque commit](commit-checks.md).

## User story

En tant que développeur, un commit qui contient un secret est refusé avant d'être créé.

## Critères d'acceptation

1. `betterleaks` est épinglé dans `mise.toml`.
2. Le hook de pre-commit lance `betterleaks` sur le contenu indexé et refuse le commit s'il détecte un secret.
3. Le hook refuse tout fichier `.har`, à la racine du dépôt comme dans un sous-dossier.
4. Le hook refuse tout fichier `.env`, à la racine du dépôt comme dans un sous-dossier.

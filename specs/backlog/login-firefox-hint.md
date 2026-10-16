# Signaler la connexion par Firefox sur macOS

## Contexte

Sur macOS, `wikimasters login --firefox` connecte sans rien copier ([Connexion](../login.md)). `wikimasters login` sans option n'explique que la copie du cookie ([Se connecter en collant la session](../login-paste-session.md)) : un testeur sur macOS n'a découvert l'option qu'après avoir copié les cookies à la main.

Dépend de : [Se connecter en collant la session](../login-paste-session.md).

## User story

En tant que joueur sur macOS, j'apprends dès `wikimasters login` que `--firefox` m'évite de copier la session.

## Critères d'acceptation

1. Sur macOS, `wikimasters login` affiche sur stderr, avant les instructions de copie, une ligne qui indique que `wikimasters login --firefox` connecte sans copier la session.
2. Sur les autres systèmes, les instructions restent inchangées.
3. La commande continue de lire la session collée, comme aujourd'hui.
4. Le commit qui implémente cette spec met à jour `specs/login-paste-session.md`.

## Hors périmètre

- Détecter si Firefox est installé.

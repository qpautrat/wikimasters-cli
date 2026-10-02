# Nettoyer les corps encodés des captures HAR

## Contexte

Les navigateurs exportent parfois le corps d'une réponse en base64 (`content.encoding: "base64"`). `scripts/sanitize-har.sh` ne cherche les JWT et les adresses email que dans le texte en clair : un secret dans un corps encodé n'est ni masqué ni détecté par le hook.

Dépend de : [Bloquer les commits qui contiennent un secret](../secret-leak-guard.md).

## User story

En tant que développeur, un secret contenu dans un corps encodé d'une capture est masqué par le nettoyage et refusé par le hook.

## Critères d'acceptation

1. `scripts/sanitize-har.sh` masque les JWT et les adresses email d'un corps encodé en base64, et le réencode.
2. `scripts/sanitize-har.sh --check` refuse une capture dont un corps encodé contient encore un JWT ou une adresse email.
3. Une capture déjà nettoyée reste inchangée.

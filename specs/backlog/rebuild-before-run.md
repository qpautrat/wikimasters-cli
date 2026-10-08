# Reconstruire la CLI avant chaque lancement

## Contexte

`mise run wikimasters` lance la CLI construite dans `dist/`. Après un `git pull` ou une modification de `src/`, `dist/` reste celui du dernier build tant qu'on ne lance pas `mise exec -- npm run build` : le README le demande au développeur, et le skill `wikimasters` le vérifie avant chaque commande. Le build prend 0,5 s (mesuré le 2026-10-07 sur un clone neuf).

Dépend de : [Lancer la CLI par une tâche mise](../cli-mise-task.md).

## User story

En tant que développeur, après un `git pull` ou une modification de `src/`, ma commande `mise run wikimasters -- <commande>` lance le code à jour sans autre commande.

## Critères d'acceptation

1. `mise run wikimasters -- <commande>` construit `dist/` à partir de `src/` avant de lancer la CLI.
2. Après une modification d'un fichier de `src/`, la commande `mise run wikimasters -- <commande>` suivante exécute le code modifié.
3. Quand le build réussit, la sortie standard et la sortie d'erreur ne contiennent que ce qu'écrit la CLI.
4. Quand le build échoue, la CLI n'est pas lancée, la sortie d'erreur contient l'erreur du compilateur, et la commande sort avec un code différent de 0, 4 et 75.
5. Le README ne demande plus de reconstruire la CLI après un `git pull` ou une modification de `src/`, et le skill `wikimasters` ne vérifie plus l'âge de `dist/` avant une commande.

## Hors périmètre

- La CLI installée depuis un registry, qui n'a pas de `src/`.

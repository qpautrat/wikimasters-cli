# Bloquer les références au fichier d'instructions local du joueur

## Contexte

Le joueur écrit sa façon de jouer, sa méthode de connexion comprise, dans un fichier d'instructions local non versionné, que Claude Code charge de lui-même. Un fichier versionné qui y renvoie n'apporte rien à l'agent. Aucune instruction versionnée ni aucune spec n'y fait donc référence, mais rien n'empêche un commit d'en ajouter une.

Dépend de : [Vérifications avant chaque commit](commit-checks.md).

## User story

En tant que développeur, un commit qui ajoute une référence au fichier d'instructions local du joueur dans la configuration de l'agent ou dans les specs est refusé avant d'être créé.

## Critères d'acceptation

1. Le hook de pre-commit refuse le commit quand une ligne ajoutée dans `CLAUDE.md`, sous `.claude/` ou sous `specs/` contient `CLAUDE` suivi de `.local`, sans distinction de casse.
2. Le hook ne lit que les lignes ajoutées du contenu indexé : une ligne déjà présente, une ligne supprimée ou une modification non indexée ne change pas son verdict.
3. Le refus nomme le fichier et le numéro de chaque ligne refusée.
4. `CLAUDE.md` documente cette vérification.

## Hors périmètre

`README.md`, qui s'adresse au joueur et lui indique où écrire sa façon de jouer.

# Ranger la session dans le dossier de l'utilisateur

## Contexte

La CLI lit et écrit sa session dans `.env`, à la racine du paquet (`packageRoot()` dans `src/cli/config.ts`). Pour un clone, c'est la racine du dépôt. Pour une CLI installée par `npm install -g`, ce serait le dossier du paquet dans le `node_modules` global : la session y disparaîtrait à chaque mise à jour ou réinstallation, et `login` échouerait quand ce dossier n'est pas accessible en écriture.

Dépend de : [Connexion](../login.md).

## User story

En tant que joueur, ma session survit à une mise à jour de la CLI, qu'elle soit lancée depuis un clone ou installée.

## Critères d'acceptation

1. La CLI lit et écrit sa session dans `$XDG_CONFIG_HOME/wikimasters/.env` quand `XDG_CONFIG_HOME` est défini et non vide, sinon dans `~/.config/wikimasters/.env`, qu'elle soit lancée depuis un clone ou installée.
2. `wikimasters login` crée ce dossier s'il n'existe pas. Le fichier reste lisible par son seul propriétaire sur macOS et Linux.
3. Un `.env` à la racine du dépôt n'est plus ni lu ni écrit : après la mise à jour, le joueur se reconnecte une fois.
4. `WIKIMASTERS_SUPABASE_ANON_KEY` et `WIKIMASTERS_REFRESH_TOKEN` gardent leur rôle, lus dans ce fichier puis dans l'environnement, le fichier l'emportant.
5. `npm run -s api:get` et `npm run -s api:site` lisent et écrivent le même fichier que `wikimasters`.
6. `.env.example` est supprimé. Le README, `CLAUDE.md`, l'aide de `wikimasters login` et le skill `wikimasters` nomment le nouvel emplacement.
7. Le commit qui implémente cette spec modifie le critère 5 de [Outils de développement hors de `src/`](../dev-tools.md) et le critère 9 de [Présenter le dépôt dans un README](../readme.md).

## Hors périmètre

- Un emplacement propre à Windows.
- La reprise automatique d'une session déjà enregistrée dans un `.env` à la racine du dépôt.

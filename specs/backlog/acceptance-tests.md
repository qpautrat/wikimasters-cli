# Tests d'acceptation contre le jeu

## Contexte

Les tests automatisés du dépôt sont unitaires : ils passent un faux `fetch` (`src/core/testing/fake-supabase.ts`) qui simule les réponses de Supabase et du site telles que nous les avons observées. Ils ne disent pas si une commande fonctionne encore contre le vrai jeu : un changement de route, de corps ou de format de réponse côté site les laisse au vert. Aujourd'hui, seule une vérification manuelle sur le compte, faite avant de committer une commande, le montre, et rien ne la rejoue ensuite.

Ces tests ont besoin du réseau et de la session de l'utilisateur, ouverte par une connexion avec captcha dans un navigateur (`specs/login*.md`) ; ils ne peuvent donc tourner ni dans le hook de pre-commit ni dans GitHub Actions. Le site refuse les requêtes qu'il juge automatisées (`automation_limit`, observé sur `GET /api/marketplace`).

Dépend de : [Sortie JSON des commandes](../json-output.md), [Annuler un de mes échanges](trade-cancel.md).

## User story

En tant que développeur, je lance une commande qui exécute chaque commande de la CLI contre le vrai jeu, avec ma session, et me dit lesquelles ne remplissent plus les critères d'acceptation de leur spec.

## Critères d'acceptation

1. `mise exec -- npm run test:acceptance` construit `dist/`, puis lance les tests d'acceptation, qui exécutent le binaire `wikimasters` de `dist/` dans un sous-processus avec la session stockée, comme l'agent l'appelle.
2. Les tests d'acceptation sont dans des fichiers `*.acceptance.test.ts`, hors de `src/` ; `npm test` et le hook de pre-commit ne les lancent pas.
3. Chaque commande de la CLI a un test d'acceptation qui vérifie, sur le compte, les critères de sa spec observables depuis la sortie : texte, `--json`, code de sortie et motif d'un refus du jeu.
4. Un test lit l'état du compte dont il a besoin avec les commandes de la CLI, juste avant de l'exercer.
5. Un test annule chaque écriture qu'il fait, avec la commande inverse, même quand il échoue : `wishlist add` / `wishlist remove`, `collection star` / `collection unstar`, `collection tag` / `collection untag`, `labels create` / `labels delete`, `auction create` / `auction cancel`, `trade propose` / `trade cancel`.
6. Une commande dont l'écriture ne s'annule pas (`collection discard`, `auction bid`) n'est testée que sur un refus du jeu, par exemple une mise sur une enchère terminée.
7. Un test qui touche un autre joueur prend son pseudo et son identifiant dans l'environnement, et est ignoré, en le disant, quand ils manquent.
8. Les tests s'exécutent l'un après l'autre, jamais en parallèle.
9. Sans session valide, la suite s'arrête dès le premier test en demandant de lancer `wikimasters login`.
10. Le commit qui ajoute ou change une commande ajoute ou met à jour son test d'acceptation, et `CLAUDE.md` remplace la vérification manuelle sur le compte avant un commit par le passage de ce test.

## Hors périmètre

- Lancer les tests d'acceptation dans le hook de pre-commit ou dans GitHub Actions.
- Tester `login`, qui ouvre un navigateur ou attend un collage de la session.

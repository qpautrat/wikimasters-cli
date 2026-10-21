# Afficher la version installée de la CLI

## Contexte

La CLI est publiée sur npm et chaque release en change la version. `wikimasters` n'affiche pas la version installée : son utilisateur, humain ou agent, ne peut ni la comparer à la dernière version publiée ni l'indiquer quand il signale un problème.

## User story

En tant qu'utilisateur de la CLI, j'obtiens la version de `wikimasters` installée, pour savoir laquelle j'utilise.

## Critères d'acceptation

1. `wikimasters --version` écrit sur la sortie standard la version installée, celle publiée sur npm, seule sur une ligne, par exemple `1.4.0`, et sort avec le code 0.
2. Cette option n'envoie aucune requête et ne demande pas de session.
3. L'aide de `wikimasters` mentionne l'option.

## Décisions

- L'option est celle de `commander` : `-V, --version`, qui lit la version dans le `package.json` du paquet installé.
- `--json` ne change pas la sortie de `--version`, qui n'est pas une commande.

## Hors périmètre

- Savoir si une version plus récente est publiée.

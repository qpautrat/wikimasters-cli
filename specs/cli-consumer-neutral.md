# Penser la CLI pour tout utilisateur, humain ou agent

## Contexte

`CLAUDE.md` présente `wikimasters-cli` comme un outil qui permet à un agent IA d'interagir avec WikiMasters, et les règles du dépôt font de l'agent le consommateur des commandes : c'est lui qui enchaîne les commandes, lit les champs de la sortie ou réagit aux codes de sortie. Une décision de conception peut alors partir du principe que l'utilisateur est un agent, alors que la CLI sert aussi bien un humain dans un terminal qu'un agent.

Dépend de : [Énoncer que la CLI n'a pas de règle propre](cli-scope-rule.md).

## User story

En tant que développeur, je trouve dans `CLAUDE.md` et les règles du dépôt une CLI pensée comme une CLI, quel que soit son utilisateur, humain ou agent, pour qu'aucune décision ne suppose l'un ou l'autre.

## Critères d'acceptation

1. `CLAUDE.md` présente le projet comme une CLI pour WikiMasters, sans désigner un agent IA comme son utilisateur.
2. `CLAUDE.md` et `.claude/rules/specs.md` désignent celui qui enchaîne les commandes, lit leur sortie et réagit à leurs codes de sortie comme l'utilisateur de la CLI, sans le supposer humain ou agent.
3. Le critère 4 de [Énoncer que la CLI n'a pas de règle propre](cli-scope-rule.md) désigne l'utilisateur de la CLI, et non l'agent, comme celui qui lit le solde dans le profil.

## Hors périmètre

- La reformulation des specs déjà implémentées qui parlent d'un agent comme utilisateur de la CLI.
- Les mentions de l'agent qui contribue au dépôt, comme la configuration d'agent suivie dans `CLAUDE.md`.

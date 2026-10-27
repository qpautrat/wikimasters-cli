# Sortir mon workflow personnel de développement du dépôt

## Contexte

`wikimasters-cli` est un dépôt public, celui d'un paquet npm public, ouvert à toute contribution. Il porte aujourd'hui mon workflow personnel de développement : l'outil qui déroule l'incrément d'une spec jusqu'à la release, ses dépendances, les specs qui le décrivent ou le prolongent, et des règles qui décrivent comment je mène mes développements. Un contributeur subit ce bruit sans en avoir l'usage.

Dépend de : [Dérouler le workflow de développement d'une feature toujours de la même façon](../feature-workflow.md).

## User story

En tant que mainteneur, je garde mon workflow personnel hors du dépôt, pour qu'un contributeur n'y trouve que ce qu'une contribution doit respecter.

## Critères d'acceptation

1. Le dépôt ne contient plus l'outillage de mon workflow personnel, ni les dépendances que seul cet outillage utilise.
2. Ni `specs/` ni `specs/backlog/` ne contiennent une spec de mon workflow personnel.
3. Ni `CLAUDE.md` ni aucune règle versionnée ne décrit mon workflow personnel, ni ne renvoie à un outil, un skill ou un plugin qui lui appartient.
4. Un contributeur contribue avec ce que le dépôt contient, sans rien installer de mon workflow.
5. Je développe toujours ce dépôt avec mon workflow, sur ma machine, avec le même comportement qu'avant.
6. Chaque règle qui s'impose à une contribution reste dans le dépôt et reste appliquée.

## Hors périmètre

- Changer le comportement de mon workflow.

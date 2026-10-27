# Sortir mon workflow personnel de développement du dépôt

## Contexte

`wikimasters-cli` est un dépôt public, celui d'un paquet npm public, ouvert à toute contribution. Il porte aujourd'hui mon workflow personnel de développement :

- l'outil qui déroule l'incrément d'une spec jusqu'à la release, et ses dépendances ;
- mes specs et mon backlog, et la règle qui décrit comment je les écris, les ordonne et les implémente ;
- la règle qui décrit comment je découvre l'API ;
- la consigne de vérifier une commande sur le compte avant de la committer.

Un contributeur subit ce bruit sans en avoir l'usage : sur GitHub, une contribution passe par des issues et des pull requests, et un contributeur découvre l'API et ses contrats comme il l'entend.

Dépend de : [Dérouler le workflow de développement d'une feature toujours de la même façon](../feature-workflow.md).

## User story

En tant que mainteneur, je garde mon workflow personnel hors du dépôt, pour qu'un contributeur n'y trouve que ce qu'une contribution doit respecter.

## Critères d'acceptation

1. Le dépôt ne contient plus l'outillage de mon workflow personnel, ni les dépendances que seul cet outillage utilise.
2. Le dépôt ne contient plus mes specs, ni mon backlog et son ordre, et rien de versionné n'y renvoie.
3. Ni `CLAUDE.md` ni aucune règle versionnée ne décrit mon workflow personnel : comment j'écris, ordonne et implémente une spec, comment je découvre l'API, comment je vérifie une commande sur le compte. Aucune ne renvoie à un outil, un skill ou un plugin de ce workflow.
4. Un contributeur contribue avec ce que le dépôt contient, sans rien installer de mon workflow.
5. Je développe toujours ce dépôt avec mon workflow, sur ma machine, avec le même comportement qu'avant, specs et règles comprises.
6. Chaque règle qui s'impose à une contribution reste dans le dépôt et reste appliquée.
7. La publication d'une version reste dans le dépôt et garde son comportement.

## Hors périmètre

- Changer le comportement de mon workflow.
- Définir comment un contributeur propose un changement.
- Remplacer la vérification d'une commande sur le compte par des tests déterministes : [Tests d'acceptation contre le jeu](acceptance-tests.md).

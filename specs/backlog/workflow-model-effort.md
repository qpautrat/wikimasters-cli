# Choisir le modèle et le niveau d'effort de l'agent du workflow de développement

## Contexte

Quand je lance le workflow de développement sur une spec, l'agent tourne toujours avec le modèle et le niveau d'effort par défaut de Claude Code : je ne peux pas les adapter à la spec que je lui confie.

Dépend de : [Dérouler le workflow de développement d'une feature toujours de la même façon](../feature-workflow.md).

## User story

En tant que développeur, quand je lance le workflow sur une spec, je choisis le modèle et le niveau d'effort de l'agent pour ce run.

## Critères d'acceptation

1. Au lancement d'un run, je peux choisir le modèle de l'agent ; toute la session du run tourne avec ce modèle.
2. Au lancement d'un run, je peux choisir le niveau d'effort de l'agent parmi ceux que Claude Code propose ; toute la session du run tourne avec ce niveau.
3. Je peux choisir l'un sans l'autre.
4. Sans choix de ma part, le run tourne comme aujourd'hui, avec le modèle et le niveau d'effort par défaut de Claude Code.
5. Un niveau d'effort inconnu arrête le run avant sa première étape, avec un message qui liste les niveaux acceptés.
6. Le résumé de fin de run indique le modèle et le niveau d'effort avec lesquels la session a tourné.

## Hors périmètre

- Un modèle ou un niveau d'effort différent selon l'étape du workflow.

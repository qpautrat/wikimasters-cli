# Dérouler le workflow de développement d'une feature toujours de la même façon

## Contexte

Le développement d'une feature va de la planification de sa spec à sa publication : montée de la spec, découverte de l'API, code, vérification sur le compte, commit, review, push et release. `CLAUDE.md`, les règles de `.claude/rules/` et les skills le décrivent, et l'agent l'interprète à chaque run. D'un run à l'autre, il saute ou réordonne des étapes, prend des décisions différentes sur un même cas, me sollicite à des moments différents, rend un résumé de forme différente et consomme un temps et un coût très variables. L'ordre des étapes est réparti entre plusieurs règles, et rien ne vérifie qu'une étape a eu lieu.

## User story

En tant que développeur, quand je planifie une spec du backlog, je lance son run d'une commande ; il passe par les mêmes étapes dans le même ordre jusqu'à la release et me sollicite toujours aux mêmes moments.

## Critères d'acceptation

1. Je lance le run d'une spec planifiée d'une seule commande, qui prend la spec ; il se déroule sans que je le pilote en conversation.
2. Le workflow est défini comme une suite ordonnée d'étapes, de la montée de la spec à la release, chacune avec ce qu'elle exige pour commencer et le résultat qu'elle doit produire.
3. Cet ordre est défini à un seul endroit ; aucune règle ni aucun skill ne le décrit à nouveau.
4. L'enchaînement des étapes ne dépend pas de l'interprétation de l'agent : une étape ne commence qu'une fois le résultat de la précédente produit et vérifié ; une étape qui ne produit pas son résultat arrête le run en nommant l'étape.
5. Le workflow nomme les décisions qu'il laisse à l'agent ; toute autre étape a un résultat imposé.
6. Le run ne me sollicite qu'aux points que les règles prévoient déjà : une spec ambiguë ou en conflit avec le code, une spec dont l'agent doute, soumise avant d'être implémentée, et les écritures de découverte de l'API sur le compte. Il n'en ajoute aucun.
7. Le résumé de fin d'incrément a toujours la même structure : bloquants, questions, décisions prises en mon nom, findings de review non corrigés, proposition de rétro.
8. Chaque règle de `CLAUDE.md` et de `.claude/rules/` reste appliquée, hormis l'ordre des étapes, que le critère 3 sort des règles.

## Hors périmètre

- Rédiger une spec du backlog.
- Tracer un run : [Tracer chaque run du workflow de développement](workflow-run-trace.md).
- Analyser et comparer les runs : [Analyser et comparer les runs du workflow de développement](workflow-run-analysis.md).

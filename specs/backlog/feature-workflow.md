# Dérouler le workflow de développement d'une feature toujours de la même façon

## Contexte

Le développement d'une feature va de la rédaction de sa spec à sa publication : spec backlog, montée de la spec, découverte de l'API, code, vérification sur le compte, review, push et release. `CLAUDE.md`, les règles de `.claude/rules/` et les skills le décrivent, et l'agent l'interprète à chaque run. D'un run à l'autre, il saute ou réordonne des étapes, prend des décisions différentes sur un même cas, me sollicite à des moments différents, rend un résumé de forme différente et consomme un temps et un coût très variables.

## User story

En tant que développeur, quand je confie une feature à l'agent, de la rédaction de sa spec à sa publication, il passe par les mêmes étapes dans le même ordre à chaque run et me sollicite toujours aux mêmes moments.

## Critères d'acceptation

1. Le workflow est défini comme une suite ordonnée d'étapes, de la rédaction de la spec à la release, chacune avec ce qu'elle exige pour commencer et le résultat qu'elle doit produire.
2. Le run ne commence une étape qu'une fois le résultat de la précédente produit ; une étape sautée ou hors ordre arrête le run en nommant l'étape.
3. Le workflow nomme les décisions qu'il laisse à l'agent ; toute autre étape a un résultat imposé.
4. Le run ne me sollicite qu'aux points que les règles prévoient déjà : une spec ambiguë ou en conflit avec le code, et les écritures de découverte de l'API sur le compte. Il n'en ajoute aucun.
5. Le résumé de fin d'incrément a toujours la même structure : bloquants, questions, décisions prises en mon nom, findings de review non corrigés, proposition de rétro.
6. Chaque règle de `CLAUDE.md` et de `.claude/rules/` reste appliquée.

## Hors périmètre

- Tracer un run : [Tracer chaque run du workflow de développement](workflow-run-trace.md).
- Analyser et comparer les runs : [Analyser et comparer les runs du workflow de développement](workflow-run-analysis.md).

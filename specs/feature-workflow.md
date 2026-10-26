# Dérouler le workflow de développement d'une feature toujours de la même façon

## Contexte

Le développement d'une feature va de la planification de sa spec à sa publication : montée de la spec, découverte de l'API, code, vérification sur le compte, commit, review, push et release. `CLAUDE.md`, les règles de `.claude/rules/` et les skills le décrivent, et l'agent l'interprète à chaque run. D'un run à l'autre, il saute ou réordonne des étapes, prend des décisions différentes sur un même cas, me sollicite à des moments différents, rend un résumé de forme différente et consomme un temps et un coût très variables. L'ordre des étapes est réparti entre plusieurs règles, et rien ne vérifie qu'une étape a eu lieu.

## User story

En tant que développeur, quand je planifie une spec du backlog, je lance son run d'une commande ; il passe par les mêmes étapes dans le même ordre jusqu'à la release et me sollicite toujours aux mêmes moments.

## Critères d'acceptation

1. `mise exec -- npm run -s feature:run -- <spec>` lance le run de `specs/backlog/<spec>.md`. Un agent du Claude Agent SDK, sur la connexion Claude Code de ma machine, le déroule sans que je le pilote en conversation.
2. `tools/workflow/steps.ts` définit le workflow comme une suite ordonnée d'étapes : lecture de la spec, découverte de l'API, implémentation, vérification des critères, commit, review, correction des findings, push, release. Chaque étape porte ce qu'elle exige pour commencer et le résultat qu'elle doit produire, tous deux vérifiés par le code.
3. Cet ordre n'est défini que dans `tools/workflow/steps.ts`, qui porte aussi les consignes de ses étapes sans renvoyer à aucun fichier non versionné ; aucune règle ni aucun skill ne le décrit à nouveau.
4. Le code enchaîne les étapes, sans dépendre de l'interprétation de l'agent. Une étape ne commence qu'une fois le résultat de la précédente produit et vérifié : arbre de travail, commits, typecheck, lint, format, tests, critères d'acceptation rapportés un à un, `origin/main`. Le code lance lui-même le push et `scripts/release.sh`, que l'agent ne peut pas lancer. Une étape qui ne produit pas son résultat arrête le run : la commande sort avec le code 1 et le résumé nomme l'étape.
5. Chaque étape nomme les décisions qu'elle laisse à l'agent ; toute autre issue de l'étape est imposée.
6. L'agent ne me sollicite que par une question posée dans le terminal, et seulement aux points que les règles prévoient déjà : une spec ambiguë ou en conflit avec le code, une spec dont il doute, soumise avant d'être implémentée, et les écritures de découverte de l'API sur le compte. Le run s'arrête si l'agent rapporte une spec dont il doute ou une écriture sur le compte sans m'avoir posé de question. Les autres outils ne me demandent aucune permission.
7. Le résumé de fin d'incrément, sur la sortie standard, a toujours les mêmes sections, vides comprises : Bloquants, Questions, Décisions prises en ton nom, Findings de review non corrigés, Rétro, qui propose `/mattpocock-skills:retro` sur la session de l'agent.
8. Chaque règle de `CLAUDE.md` et de `.claude/rules/` reste appliquée, hormis l'ordre des étapes, que le critère 3 sort des règles.

## Hors périmètre

- Rédiger une spec du backlog.
- Tracer un run : [Tracer chaque run du workflow de développement](backlog/workflow-run-trace.md).
- Analyser et comparer les runs : [Analyser et comparer les runs du workflow de développement](backlog/workflow-run-analysis.md).

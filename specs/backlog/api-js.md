# Chercher dans le JavaScript d'une page du site

## Contexte

La règle `.claude/rules/api-discovery.md` fait prendre le nom et le corps d'une requête dans le JavaScript du site, atteint par le HTML d'une page. Aucun outil ne le fait : le 2026-10-09, trouver les routes de mise aux enchères et d'annulation a demandé une douzaine d'appels manuels. Le HTML d'une page référence ses fichiers JavaScript avec un suffixe de déploiement, par exemple `static/chunks/0o9xz9q9zsudm.js?dpl=dpl_…`. Le bundler (Next.js avec Turbopack) charge d'autres fichiers à la demande, qu'un fichier déjà chargé cite, par exemple `422455,e=>{e.v(t=>Promise.all(["static/chunks/0l~6ecg18yth-.js"].map(t=>e.l(t))).then(()=>t(484375)))}` : c'est derrière ce module `e.A(422455)` que se trouvait le formulaire qui envoie `POST /api/marketplace`.

Dépend de : [Outils de développement hors de `src/`](../dev-tools.md), [Envoyer une requête au site](../api-site.md).

## User story

En tant que développeur, je donne une page du site et un texte, et je lis chaque passage du JavaScript de cette page qui contient ce texte, fichiers chargés à la demande compris, en une commande.

## Critères d'acceptation

1. `npm run -s api:js -- <chemin> <texte>` lit le HTML de la page `https://www.wiki-masters.com<chemin>` avec la session stockée, par le code du core qui appelle le site, comme `api:site`.
2. Le chemin commence par `/` et le texte n'est pas vide. Sinon, la commande sort avec le code 1 sans rien envoyer.
3. La commande télécharge chaque fichier `static/chunks/….js` que le HTML référence, puis chaque fichier `static/chunks/….js` cité dans un fichier téléchargé, jusqu'à ne plus en trouver de nouveau. Chaque fichier n'est téléchargé qu'une fois.
4. La commande cherche le texte tel quel, sensible à la casse, dans chaque fichier téléchargé, et écrit sur la sortie standard, pour chaque occurrence, le nom du fichier, la position de l'occurrence dans le fichier et les 200 caractères qui la précèdent et la suivent.
5. Sans occurrence, la commande le dit sur la sortie d'erreur et sort avec le code 1.
6. Quand la page ou un fichier répond un statut autre que 2xx, la commande écrit ce statut et l'adresse demandée sur la sortie d'erreur et sort avec le code 1.
7. Aucun fichier téléchargé, HTML ou JavaScript, ne reste sur le disque à la fin de l'exécution, qu'elle réussisse ou échoue.
8. Le jeton de rafraîchissement renouvelé est enregistré dans le fichier de session de `wikimasters` avant la première requête. Ni le cookie ni aucun jeton n'est affiché.
9. Sans session valide ou sur HTTP 401, la commande sort avec le code 4. Sur une erreur passagère qui persiste, elle sort avec le code 75, comme `wikimasters`.
10. L'étape 2 de la règle `.claude/rules/api-discovery.md` indique cette commande pour trouver une requête dans le JavaScript du site.

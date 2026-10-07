# Connexion

## Contexte

La connexion à WikiMasters est protégée par un captcha, qu'un humain doit résoudre dans un vrai navigateur. Ensuite, les commandes `wikimasters` doivent fonctionner sans redemander de connexion tant que la session est valide. Quand c'est nécessaire, l'agent se connecte comme le prévoit [Se connecter depuis un agent](login-agent.md) : il doit donc savoir, à la sortie d'une commande, si une reconnexion est requise.

## User stories

1. En tant que joueur, je me connecte depuis le terminal en collant la session de mon navigateur ([Se connecter en collant la session](login-paste-session.md)) ou, sur macOS, en résolvant le captcha dans une fenêtre Firefox que la commande ouvre pour moi.
2. En tant que joueur, je ne me reconnecte pas tant que ma session reste valide.
3. En tant qu'agent, je sais à la sortie d'une commande si l'utilisateur doit se reconnecter.

## Critères d'acceptation

### `wikimasters login --firefox`

1. La commande ouvre Firefox sur la page de connexion, avec un profil temporaire distinct du Firefox habituel.
2. Dès que la session apparaît, Firefox se ferme et la session est enregistrée localement, hors de tout fichier versionné.
3. Si Firefox est fermé avant la connexion, ou après 5 minutes sans connexion, la commande échoue avec un message explicite.

### Renouvellement de la session

4. Chaque commande renouvelle la session enregistrée, sans action de ma part.

### Connexion requise

5. Une commande qui a besoin d'une session sort avec le code **4** quand :
   - aucune session n'est enregistrée ;
   - la session enregistrée est expirée ou révoquée ;
   - l'API rejette la session (HTTP 401).
6. Dans ces cas, le message d'erreur indique de lancer `wikimasters login`.
7. Les autres erreurs (réseau, indisponibilité de l'API, argument invalide…) sortent avec le code 1.

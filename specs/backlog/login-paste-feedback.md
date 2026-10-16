# Accuser réception de chaque morceau collé à la connexion

## Contexte

`wikimasters login` lit sans l'afficher un morceau du cookie `sb-cyrxjeppjqsxxjayfrur-auth-token` par ligne, et ne s'arrête qu'à une ligne vide ou à la fin de l'entrée ([Se connecter en collant la session](../login-paste-session.md)). Un testeur a trouvé l'absence de retour déroutante : rien ne lui confirmait qu'un collage était reçu, ni comment indiquer qu'il avait tout collé.

Les morceaux joints ne se décodent en une session portant un refresh token qu'une fois tous collés, dans l'ordre : la CLI peut donc reconnaître seule la fin de la saisie.

Dépend de : [Se connecter en collant la session](../login-paste-session.md).

## User story

En tant que développeur qui se connecte en collant sa session, je vois chaque collage reçu et la saisie se termine d'elle-même quand la session est complète.

## Critères d'acceptation

1. Après chaque ligne non vide, la commande affiche sur stderr le numéro du morceau reçu (`.0`, `.1`…) et sa longueur en caractères.
2. Dès que les morceaux reçus, joints dans l'ordre, contiennent un refresh token, la commande cesse de lire et poursuit la connexion, sans attendre de ligne vide.
3. Tant que les morceaux reçus ne contiennent pas de refresh token, la commande demande sur stderr le morceau suivant, ou une ligne vide pour terminer.
4. Une ligne vide ou la fin de l'entrée termine toujours la saisie ; si les morceaux reçus ne contiennent pas de refresh token, la commande échoue comme aujourd'hui, avec le code 1.
5. Ni la valeur collée ni le refresh token n'apparaissent sur stdout, sur stderr ou dans un message d'erreur.
6. Avec `--json`, stdout ne porte que le résultat, comme aujourd'hui.
7. Le commit qui implémente cette spec met à jour `specs/login-paste-session.md`.

## Hors périmètre

- La connexion par Firefox (`--firefox`).

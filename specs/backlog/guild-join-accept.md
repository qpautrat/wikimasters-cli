# Accepter de rejoindre une guilde

## Contexte

Une guilde peut m'inviter à la rejoindre, et accepter cette invitation demande aujourd'hui d'ouvrir la page « Guildes » du jeu.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une invitation à rejoindre une guilde que j'ai reçue, et la commande l'accepte.

## Critères d'acceptation

1. La commande prend l'identifiant de l'invitation, tel que le jeu le donne.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que l'invitation existe, qu'elle m'est adressée ou qu'elle est encore valable.
3. Une fois l'invitation acceptée, je suis membre de la guilde dans la page « Guildes » du jeu.
4. La commande affiche l'identifiant de l'invitation acceptée et le résultat renvoyé par le jeu.
5. Quand le jeu refuse l'acceptation, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte le résultat de l'acceptation renvoyé par le jeu.

## Hors périmètre

Lister mes invitations reçues et quitter une guilde : specs à part.

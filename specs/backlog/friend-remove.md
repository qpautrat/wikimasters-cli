# Retirer un ami

## Contexte

Retirer un joueur de mes amis demande aujourd'hui d'ouvrir la page « Amis » du jeu.

Dépend de : [Accepter une demande d'ami](friend-accept.md), [Lister mes amis et mes demandes en attente](friend-list.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'un de mes amis, et la commande le retire de mes amis.

## Critères d'acceptation

1. La commande prend l'identifiant qui désigne cet ami, tel que le donne la liste de mes amis et de mes demandes en attente.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que ce joueur est bien mon ami.
3. Une fois l'ami retiré, il n'apparaît plus parmi mes amis dans la page « Amis » du jeu, et je n'apparais plus parmi les siens.
4. La commande affiche l'identifiant donné et le résultat renvoyé par le jeu.
5. Quand le jeu refuse le retrait, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte le résultat du retrait renvoyé par le jeu.

# Refuser une demande d'ami

## Contexte

Un autre joueur peut m'envoyer une demande d'ami, et la refuser demande aujourd'hui d'ouvrir la page « Amis » du jeu.

Dépend de : [Lister mes amis et mes demandes en attente](friend-list.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une demande d'ami que j'ai reçue, et la commande la refuse.

## Critères d'acceptation

1. La commande prend l'identifiant de la demande, tel que le donne la liste de mes amis et de mes demandes en attente.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que la demande existe, qu'elle m'est adressée ou qu'elle est encore en attente.
3. Une fois la demande refusée, elle n'apparaît plus parmi mes demandes en attente dans la page « Amis » du jeu, et le joueur n'apparaît pas parmi mes amis.
4. La commande affiche l'identifiant de la demande refusée et le résultat renvoyé par le jeu.
5. Quand le jeu rejette le refus, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte le résultat du refus renvoyé par le jeu.

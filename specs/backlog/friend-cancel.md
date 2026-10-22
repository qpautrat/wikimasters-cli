# Annuler une demande d'ami que j'ai envoyée

## Contexte

Une demande d'ami que j'ai envoyée reste en attente tant que l'autre joueur n'y a pas répondu, et l'annuler demande aujourd'hui d'ouvrir la page « Amis » du jeu.

Dépend de : [Ajouter un ami](../friend-add.md), [Lister mes amis et mes demandes en attente](../friend-list.md), [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je donne l'identifiant d'une demande d'ami que j'ai envoyée, et la commande l'annule.

## Critères d'acceptation

1. La commande prend l'identifiant de la demande, tel que le donne la liste de mes amis et de mes demandes en attente.
2. La commande envoie une seule requête, avec l'identifiant tel quel, sans vérifier au préalable que la demande existe, que je l'ai envoyée ou qu'elle est encore en attente.
3. Une fois la demande annulée, elle n'apparaît plus en attente dans la page « Amis » du jeu, ni chez moi ni chez le joueur demandé.
4. La commande affiche l'identifiant de la demande annulée et le résultat renvoyé par le jeu.
5. Quand le jeu refuse l'annulation, la commande échoue en affichant le motif donné par le jeu.
6. Avec `--json`, stdout porte le résultat de l'annulation renvoyé par le jeu.

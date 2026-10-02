# Miser automatiquement sur une enchère dans un budget

## Contexte

Pour garder la tête d'une enchère, il faut remiser chaque fois qu'un autre joueur me dépasse. Je veux confier ces relances à l'agent sans qu'il puisse payer la carte plus cher que ce que j'accepte.

Dépend de : [Miser sur une enchère](../auction-bid.md).

## User story

En tant que joueur, je donne l'identifiant d'une enchère et un budget, et la commande surveille l'enchère et remise la mise minimale chaque fois que je ne suis plus le meilleur enchérisseur, sans jamais dépasser ce budget.

## Critères d'acceptation

1. `wikimasters auction autobid <auction-id> --budget <n>` prend l'identifiant unique de l'enchère et un budget en wikibidous, entier strictement positif : le montant maximal que j'accepte de payer pour cette carte.
2. Un budget qui n'est pas un entier strictement positif est refusé sans rien miser.
3. La commande échoue sans rien miser, avec un message explicite, quand l'enchère n'est plus en cours ou quand j'en suis le vendeur.
4. La commande reste active et vérifie l'enchère au plus 10 secondes après la vérification précédente.
5. Tant que je suis le meilleur enchérisseur, la commande ne mise pas.
6. Quand je ne suis pas le meilleur enchérisseur, y compris quand personne n'a encore misé, la commande place la mise minimale que le jeu accepte à ce moment, si elle ne dépasse pas le budget.
7. Aucune mise placée par la commande ne dépasse le budget.
8. Après une mise refusée ou une réponse en erreur, la commande relit l'enchère avant toute nouvelle mise, et ne mise de nouveau que si je ne suis pas le meilleur enchérisseur.
9. Chaque mise placée affiche son montant et mon nouveau solde de wikibidous.
10. La commande s'arrête sans miser et affiche le motif de l'arrêt :
    - l'enchère est terminée : elle indique si je suis le meilleur enchérisseur et sort avec le code 0 ;
    - la prochaine mise minimale dépasse le budget : elle donne cette mise et le budget, et sort avec le code 0 ;
    - le jeu demande une vérification humaine ou refuse la mise pour solde insuffisant : elle affiche le motif donné par le jeu et sort avec le code 1.

## Hors périmètre

- Surveiller plusieurs enchères avec un budget commun.
- Miser un autre montant que la mise minimale.
- Attendre les derniers instants de l'enchère pour miser.
- Continuer à surveiller après l'arrêt de la commande.

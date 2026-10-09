# Connaître mon solde de wikibidous

## Contexte

Pour décider sur quelles enchères miser et avec quel budget, je dois connaître mon solde de wikibidous. Aucune commande ne le donne avant une mise ou une défausse : `auction bid` et `collection discard` n'affichent le nouveau solde qu'après avoir dépensé ou gagné des wikibidous. Le site lit le solde en appelant la fonction RPC `get_my_profile`, qui renvoie mon profil avec le champ `wikibidous_balance`.

Dépend de : [Sortie JSON des commandes](../json-output.md).

## User story

En tant que joueur, je lis mon solde de wikibidous sans rien dépenser, pour savoir quelles enchères je peux me permettre.

## Critères d'acceptation

1. `wikimasters balance` envoie une seule requête et affiche mon solde de wikibidous.
2. Avec `--json`, stdout porte un objet avec le champ `balance`, le solde en wikibidous.

## Hors périmètre

- Les autres champs du profil.

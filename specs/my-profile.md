# Lire mon profil

## Contexte

Pour décider sur quelles enchères miser et avec quel budget, je dois connaître mon solde de wikibidous. Le site lit le profil du joueur en appelant la fonction RPC `get_my_profile`, qui renvoie un objet dont le champ `wikibidous_balance` porte ce solde. La CLI expose cet endpoint tel quel : l'agent lit le solde dans le profil.

Dépend de : [Sortie JSON des commandes](json-output.md).

## User story

En tant que joueur, je lis mon profil sans rien dépenser, pour savoir notamment quelles enchères mon solde de wikibidous me permet.

## Critères d'acceptation

1. `wikimasters profile me` envoie une seule requête, `POST rpc/get_my_profile`, et affiche chaque champ renvoyé, nom et valeur, tels que l'API les renvoie.
2. Avec `--json`, stdout porte l'objet renvoyé par l'API, tel quel.

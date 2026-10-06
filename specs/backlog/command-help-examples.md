# Exemples dans l'aide des commandes

## Contexte

`wikimasters --help` et `wikimasters <groupe> --help` listent les commandes et leurs options, sans aucun exemple d'appel. Pour comprendre ce qu'attend une commande (un UUID, un nom, un montant), il faut lire le code ou les specs.

## User story

En tant que développeur qui découvre la CLI, l'aide d'une commande me montre comment l'appeler.

## Critères d'acceptation

1. `wikimasters <commande> --help` affiche, après les options, au moins un exemple d'appel complet de cette commande, pour chaque commande qui n'a pas de sous-commande.
2. Chaque exemple utilise des valeurs à la forme valide (un UUID pour un identifiant, un entier pour un montant), et l'exemple d'une commande qui a des options en utilise au moins une.
3. Les exemples écrivent l'appel sous la forme `wikimasters …`.
4. Un test vérifie que chaque commande sans sous-commande a au moins un exemple dans son aide.

## Hors périmètre

- Des exemples dans l'aide d'un groupe de commandes (`wikimasters auction --help`).
- Les messages d'erreur des commandes.

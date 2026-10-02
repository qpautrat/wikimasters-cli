# Étiqueter une carte de ma collection

## Contexte

L'interface permet de poser sur une carte de ma collection des étiquettes que j'ai créées (`tags`, reliées aux cartes par `user_card_tags`). Une carte étiquetée est protégée : `wikimasters collection discard-commons` ne la défausse pas. Je veux poser et retirer une étiquette depuis le terminal.

Les écritures ne sont pas encore connues : elles demandent une capture HAR du parcours dans l'interface.

Dépend de : [Défausser toutes mes cartes communes](../discard-commons.md).

## User story

En tant que joueur, je pose une de mes étiquettes sur une carte de ma collection, ou je la retire, pour classer mes cartes et protéger celles que je garde.

## Critères d'acceptation

1. `wikimasters collection tag <card-id> <label>` pose l'étiquette nommée `<label>` sur la carte de ma collection qui porte cet identifiant de carte.
2. `wikimasters collection untag <card-id> <label>` retire cette étiquette de la carte.
3. Poser une étiquette déjà présente, ou retirer une étiquette absente, réussit sans rien modifier et le signale.
4. Une carte absente de ma collection est refusée sans rien modifier, avec un message qui le dit.
5. Un nom qui ne correspond à aucune de mes étiquettes est refusé sans rien modifier, avec un message qui liste mes étiquettes.
6. L'étiquette posée depuis la commande apparaît dans l'interface.

## Hors périmètre

- Créer, renommer ou supprimer une étiquette.
- Lister les cartes qui portent une étiquette.

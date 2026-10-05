# Étiqueter une carte de ma collection

## Contexte

L'interface permet de poser sur une carte de ma collection des étiquettes que j'ai créées (`tags`, reliées aux cartes par `user_card_tags`). Je veux poser une étiquette depuis le terminal.

## User story

En tant que joueur, je pose une de mes étiquettes sur une carte de ma collection, pour la classer et la protéger.

## Critères d'acceptation

1. `wikimasters collection tag <card-id> <label>` pose l'étiquette nommée `<label>` sur la carte de ma collection qui porte cet identifiant de carte.
2. Poser une étiquette déjà présente sur la carte réussit sans rien modifier et le signale.
3. Une carte absente de ma collection est refusée sans rien modifier, avec un message qui le dit.
4. Un nom qui ne correspond à aucune de mes étiquettes est refusé sans rien modifier, avec un message qui liste mes étiquettes.
5. L'étiquette posée depuis la commande apparaît dans l'interface.

## Hors périmètre

- Retirer une étiquette d'une carte.
- Créer, renommer ou supprimer une étiquette.
- Lister les cartes qui portent une étiquette.

# Lister mes notifications

## Contexte

Le jeu m'envoie des notifications sur le site : une carte de ma liste de souhaits mise en vente, une enchère où je suis dépassé, gagnée, vendue ou invendue, une demande d'ami, une offre d'échange. Aucune commande ne les donne aujourd'hui.

Le site lit `GET /api/notifications`, qui renvoie mes 50 dernières notifications sans filtre possible. La table `notifications` les porte toutes et se filtre sur leur type, leur état lu et leur date (observé le 2026-10-16). Chaque notification a un type (`type`), un état lu (`read`), une date (`created_at`) et des données propres à son type (`data`) : un titre, un message et, selon le type, les identifiants de l'enchère, de la carte, du joueur ou de l'échange concernés.

## User story

En tant que joueur, je lis les notifications que le jeu m'a envoyées, au besoin d'un type, non lues ou postérieures à une date, avec les données de chacune, pour agir sur ce qu'elles signalent.

## Critères d'acceptation

1. `wikimasters notifications list` envoie une seule requête et affiche la page demandée de mes notifications, la première par défaut, la plus récente en premier.
2. L'option `--type <type>` ne garde que les notifications de ce type, par exemple `marketplace_wishlist_listed` ; répétée, elle garde chacun des types donnés. La commande transmet les valeurs au jeu sans les vérifier.
3. L'option `--unread` ne garde que les notifications non lues.
4. L'option `--after <date>` ne garde que les notifications reçues strictement après cette date, transmise au jeu telle quelle ; un refus du jeu fait échouer la commande avec son motif.
5. Les options `--page <p>` et `--limit <n>` choisissent la page et le nombre de notifications par page, 50 par défaut comme dans l'interface. La page, un entier strictement positif, est convertie en position de départ ; une page qui n'en est pas un est refusée sans rien lire. La limite, un entier, est transmise au jeu telle quelle, nulle ou négative comprise ; une limite qui n'est pas un nombre entier est refusée sans rien lire, et un refus du jeu fait échouer la commande avec son motif.
6. Chaque ligne donne la date de la notification, son type, si elle est non lue, son message et chacune des autres données que le jeu lui associe, son titre excepté, sous la forme `<clé>=<valeur>`.
7. La commande signale quand la page est pleine, signe que d'autres pages peuvent suivre.
8. Une page vide n'est pas une erreur : la commande le signale et sort avec le code 0.
9. Avec `--json`, stdout porte la liste des notifications de la page, chacune avec son identifiant, son type, son état lu, sa date et ses données telles que le jeu les renvoie, et un champ `full`, vrai quand la page porte autant de notifications que demandé.
10. L'aide de la commande nomme chaque option et donne des exemples, dont la lecture des cartes de ma liste de souhaits mises en vente depuis une date.

## Hors périmètre

- Marquer des notifications comme lues.
- Recevoir les notifications au fil de l'eau, sans relire la liste.

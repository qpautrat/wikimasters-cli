# Licence du dépôt

## Contexte

Le dépôt GitHub est public mais ne déclare aucune licence (`gh repo view` : `licenseInfo: null`). Sans licence, personne n'a le droit de réutiliser, modifier ou redistribuer le code, ce qui freine ceux à qui je le partage.

## User story

En tant que développeur qui découvre le dépôt, je sais ce que j'ai le droit de faire du code.

## Critères d'acceptation

1. Un fichier `LICENSE` à la racine porte le texte de la licence MIT, au nom de Quentin Pautrat, pour l'année 2026.
2. `package.json` déclare `"license": "MIT"`.
3. GitHub reconnaît la licence : `gh repo view --json licenseInfo` renvoie MIT après le push.

## Hors périmètre

- Les conditions d'utilisation de WikiMasters, qui restent celles du site.

# Publier sur npm depuis GitHub Actions

## Contexte

La CLI est publiée sur npm sous le nom `wikimasters-cli` depuis le poste du mainteneur : `npm publish` demande une connexion à npm et une validation par clé de sécurité, et publie ce que contient le clone à ce moment, commité ou non. La publication depuis GitHub Actions est hors du périmètre de [Publier la CLI sur npm](npm-publish.md).

Le trusted publishing se déclare sur npmjs.com, dans les réglages du paquet, en y nommant le dépôt GitHub et le fichier du workflow : le mainteneur fait cette déclaration à la main.

Dépend de : [Publier la CLI sur npm](npm-publish.md), [Numéroter les versions publiées](versioning.md).

## User story

En tant que mainteneur, je pousse le tag d'une version sur GitHub et un workflow du dépôt la publie sur npm, sans publier depuis mon poste.

## Critères d'acceptation

1. Un workflow GitHub Actions du dépôt publie le paquet sur npm quand un tag `v<version>` est poussé, et seulement dans ce cas.
2. Le workflow refuse de publier, en échouant, quand la version de `package.json` du commit tagué diffère de celle du tag.
3. Le workflow installe Node à la version de `mise.toml` et lance le typecheck, le lint, la vérification du format et les tests avant de publier ; si l'un échoue, rien n'est publié.
4. Le workflow s'authentifie auprès de npm par la publication de confiance (trusted publishing), sans jeton npm dans les secrets du dépôt.
5. `scripts/release.sh` s'arrête après avoir poussé le commit de version et son tag, sans lancer `npm publish`.

# Se passer de renseigner la clé publique Supabase

## Contexte

Avant sa première commande, l'utilisateur doit trouver la clé publique Supabase du site (`WIKIMASTERS_SUPABASE_ANON_KEY`) dans son JavaScript et la copier dans `.env`. Cette clé est la même pour tous les joueurs et le site la publie : la demander à chacun ralentit la prise en main sans rien protéger.

Dépend de : [Présenter le dépôt dans un README](../readme.md).

## User story

En tant que développeur qui vient de cloner le dépôt, je lance `wikimasters login` sans avoir rien renseigné dans `.env`.

## Critères d'acceptation

1. Sans `.env` ni `WIKIMASTERS_SUPABASE_ANON_KEY` dans l'environnement, `wikimasters login` réussit avec la clé publique du site, connue du cœur, puis toute autre commande fonctionne.
2. Une valeur non vide de `WIKIMASTERS_SUPABASE_ANON_KEY` dans `.env` ou dans l'environnement remplace celle du cœur, avec la même priorité qu'aujourd'hui (le fichier l'emporte). Une valeur vide revient à la clé du cœur.
3. `.env.example`, le README et `CLAUDE.md` ne demandent plus de renseigner la clé et indiquent qu'elle peut être remplacée.

## Hors périmètre

- Relire la clé dans le JavaScript du site à chaque lancement.

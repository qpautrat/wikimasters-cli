# Résilience aux erreurs passagères de l'API

## Contexte

L'API de WikiMasters renvoie par intermittence des erreurs passagères (HTTP 525 de Cloudflare, constatée le 29 septembre et le 1er octobre 2026), y compris depuis le navigateur. La requête suivante réussit en général. Aujourd'hui, une seule requête en échec fait échouer la commande, avec le même code de sortie qu'un argument invalide et un message qui reproduit toute la page d'erreur HTML.

## User story

En tant qu'agent, une erreur passagère de l'API ne fait pas échouer ma commande. Si elle persiste, je sais qu'il faut réessayer plus tard, sans recevoir de page HTML.

## Critères d'acceptation

1. Sur une erreur HTTP 502, 503, 504 ou 520 à 526, la commande réessaie la requête jusqu'à 3 fois, en espaçant de plus en plus les tentatives.
2. Si toutes les tentatives échouent, la commande sort avec le code **75** (« échec temporaire, réessayer »), distinct du code 1.
3. Le message d'erreur tient sur une ligne, par exemple `WikiMasters API unavailable (HTTP 525: SSL handshake failed), retry later`. Aucune page HTML n'est reproduite.

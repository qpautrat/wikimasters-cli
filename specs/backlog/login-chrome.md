# Se connecter par Chrome sur macOS

## Contexte

Sur macOS, `wikimasters login --firefox` ouvre Firefox sur un profil temporaire, sans l'automatiser, et lit la session dans ses cookies ([Connexion](../login.md)). Un joueur qui n'a que Chrome doit copier le cookie à la main ([Se connecter en collant la session](../login-paste-session.md)).

Chrome chiffre la valeur de ses cookies sur macOS (sources Chromium lues le 2026-10-16) :

- un profil garde ses cookies dans la base SQLite `Network/Cookies`, table `cookies`, colonne `encrypted_value` (`chrome/browser/net/profile_network_context_service.cc`) ;
- la valeur commence par `v10`, suivie d'un chiffrement AES-128-CBC avec un IV de 16 espaces ; la clé est dérivée d'un mot de passe par PBKDF2-HMAC-SHA1, sel `saltysalt`, 1003 itérations, 16 octets (`components/os_crypt/async/browser/keychain_key_provider.mm`, `components/os_crypt/async/common/encryptor.cc`) ;
- ce mot de passe est l'entrée « Chrome Safe Storage » du trousseau macOS, unique pour tous les profils Chrome de l'utilisateur (`components/os_crypt/common/keychain_password_mac.mm`). La lire depuis la CLI ouvrirait une fenêtre du trousseau et donnerait à la CLI la clé des cookies du Chrome habituel ;
- lancé avec `--use-mock-keychain`, Chrome ne touche pas au trousseau et prend la constante `mock_password` comme mot de passe (`crypto/apple/fake_keychain_v2.mm`). Ce paramètre n'affiche pas l'avertissement « stability and security will suffer » (absent de `kBadFlags`, `chrome/browser/ui/startup/bad_flags_prompt.cc`) et n'automatise pas le navigateur ;
- le texte déchiffré commence par le SHA-256 du domaine du cookie, depuis la version 24 de la base (`net/extras/sqlite/sqlite_persistent_cookie_store.cc`) ;
- Chrome écrit un cookie modifié sur disque au plus 30 secondes après (même fichier, `kCommitInterval`).

Dépend de : [Connexion](../login.md), [Signaler la connexion par Firefox sur macOS](login-firefox-hint.md).

## User story

En tant que joueur sur macOS qui utilise Chrome, je me connecte en résolvant le captcha dans une fenêtre Chrome que la commande ouvre pour moi, sans rien copier.

## Critères d'acceptation

### `wikimasters login --chrome`

1. Sur macOS, la commande ouvre Google Chrome, installé dans `/Applications/Google Chrome.app`, sur la page de connexion, avec un profil temporaire distinct du Chrome habituel, que celui-ci soit ouvert ou non.
2. Aucun outil d'automatisation (Playwright, WebDriver, protocole DevTools) ne pilote Chrome : je résous le captcha moi-même.
3. Aucune fenêtre du trousseau macOS ne s'ouvre, et la commande ne lit rien dans le trousseau ni dans le profil Chrome habituel.
4. Dès que la session apparaît dans les cookies du profil temporaire, Chrome se ferme, le profil temporaire est supprimé et la session est enregistrée comme avec `--firefox`.
5. Si Chrome est fermé avant la connexion, ou après 5 minutes sans connexion, la commande échoue avec le code 1 et un message explicite, et supprime le profil temporaire.
6. Si Chrome ne se lance pas depuis `/Applications/Google Chrome.app`, la commande échoue avec le code 1 et un message qui nomme ce chemin.
7. Avec `--chrome` et `--firefox` ensemble, la commande échoue avec le code 1 sans ouvrir de navigateur.
8. Ni le refresh token ni la valeur déchiffrée d'un cookie n'apparaissent sur stdout, sur stderr ou dans un message d'erreur ; avec `--json`, stdout ne porte que le résultat.
9. La lecture des cookies de Chrome n'ajoute aucune dépendance npm.

### Comportements existants

10. `wikimasters login` sans option et `wikimasters login --firefox` restent inchangés.
11. Sur macOS, la ligne que `wikimasters login` affiche avant les instructions de copie nomme aussi `wikimasters login --chrome`.

### Documentation

12. Le commit qui implémente cette spec met à jour `specs/login.md`, `specs/login-paste-session.md`, `specs/login-firefox-hint.md`, la description de la connexion dans `CLAUDE.md`, `docs/api.md` et `README.md`.

## Hors périmètre

- Lancer Chrome ailleurs que sur macOS.
- Lire les cookies d'un autre navigateur Chromium (Edge, Brave, Arc) ou d'une autre édition de Chrome (Beta, Canary).
- Choisir le navigateur selon ceux qui sont installés.

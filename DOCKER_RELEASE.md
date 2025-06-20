# Docker Release avec Semantic Release

Ce projet utilise Semantic Release pour automatiser les releases et le tagging des images Docker avec un script personnalisé.

## Comment ça fonctionne

### 1. Semantic Release
- Analyse les commits selon la convention [Conventional Commits](https://www.conventionalcommits.org/)
- Génère automatiquement les versions selon [SemVer](https://semver.org/)
- Crée des tags Git (ex: `v1.2.3`)
- Publie sur GitHub

### 2. Docker Build Automatique
- Utilise le plugin `@semantic-release/exec` pour exécuter un script personnalisé
- Le script `scripts/docker-release.sh` build et tag automatiquement l'image Docker
- Push automatique sur Docker Hub avec les tags de version et `latest`

## Configuration

### Plugins Semantic Release utilisés
- `@semantic-release/commit-analyzer` : Analyse les commits
- `@semantic-release/release-notes-generator` : Génère les notes de release
- `@semantic-release/changelog` : Met à jour le CHANGELOG.md
- `@semantic-release/github` : Publie sur GitHub
- `@semantic-release/exec` : Exécute le script Docker personnalisé
- `@semantic-release/git` : Commit des changements

### Script Docker personnalisé
Le script `scripts/docker-release.sh` :
- Reçoit la version générée par semantic-release
- Login automatique sur Docker Hub
- Build l'image avec les build args appropriés
- Tag avec la version et `latest`
- Push sur Docker Hub

### Tags Docker générés
- `viasay/destygo-chat-performance-test:1.2.3` (version spécifique)
- `viasay/destygo-chat-performance-test:latest` (dernière version)

## Workflow CircleCI

1. **Test** : Exécute les tests de performance
2. **Release** : Lance semantic-release (seulement sur `master`)
   - Analyse les commits
   - Génère la nouvelle version
   - Exécute le script Docker personnalisé
   - Publie sur GitHub

## Variables d'environnement requises

### CircleCI
- `GITHUB_TOKEN` : Token GitHub pour semantic-release
- `DOCKERHUB_USERNAME` : Nom d'utilisateur Docker Hub
- `DOCKERHUB_PASS` : Mot de passe Docker Hub

### Scopes du GITHUB_TOKEN

Le `GITHUB_TOKEN` doit avoir les permissions suivantes :

#### Permissions Repository
- **Contents** : `Read and write` - Pour créer des releases et mettre à jour les fichiers
- **Issues** : `Read and write` - Pour commenter sur les issues lors des releases
- **Pull requests** : `Read and write` - Pour commenter sur les PR lors des releases
- **Workflows** : `Read and write` - Pour déclencher les workflows CircleCI

#### Permissions Metadata
- **Metadata** : `Read-only` - Pour accéder aux informations du repository

#### Comment créer le token
1. Aller sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquer "Generate new token (classic)"
3. Donner un nom descriptif (ex: "Semantic Release CI")
4. Sélectionner les scopes mentionnés ci-dessus
5. Copier le token et l'ajouter dans CircleCI comme variable d'environnement `GITHUB_TOKEN`

#### Alternative : GitHub App
Pour plus de sécurité, vous pouvez aussi utiliser une GitHub App avec les mêmes permissions.

## Utilisation

### Pour déclencher une release
1. Faire un commit avec un message conventionnel :
   ```bash
   git commit -m "feat: ajouter nouvelle fonctionnalité"
   git commit -m "fix: corriger bug important"
   git commit -m "BREAKING CHANGE: changement majeur"
   ```

2. Pousser sur la branche `master` :
   ```bash
   git push origin master
   ```

3. Semantic Release analysera automatiquement et créera une release si nécessaire

### Types de commits supportés
- `feat:` : Nouvelle fonctionnalité (patch)
- `fix:` : Correction de bug (patch)
- `docs:` : Documentation (pas de release)
- `style:` : Formatage (pas de release)
- `refactor:` : Refactoring (pas de release)
- `test:` : Tests (pas de release)
- `chore:` : Maintenance (pas de release)
- `BREAKING CHANGE:` : Changement majeur (major)

## Images Docker disponibles

```bash
# Dernière version
docker pull viasay/destygo-chat-performance-test:latest

# Version spécifique
docker pull viasay/destygo-chat-performance-test:1.2.3
```

## Avantages de cette approche

- **Contrôle total** : Script personnalisé pour le tagging Docker
- **Flexibilité** : Possibilité d'ajouter des étapes personnalisées
- **Simplicité** : Un seul job CircleCI pour tout le processus
- **Fiabilité** : Pas de dépendance à des packages tiers pour Docker
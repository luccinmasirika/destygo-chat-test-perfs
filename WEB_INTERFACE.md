# Interface Web de Test de Performance Destygo Chat

## 🚀 Vue d'ensemble

Cette interface web moderne permet d'exécuter facilement les tests de performance Destygo Chat via un navigateur web, sans avoir besoin de ligne de commande.

## 📋 Fonctionnalités

- **Interface utilisateur moderne** avec design responsive
- **Configuration facile** des paramètres de test
- **Logs en temps réel** avec coloration syntaxique
- **Statistiques visuelles** des résultats
- **Export des logs** au format texte
- **Gestion des tests** (démarrer/arrêter)
- **Validation des paramètres** en temps réel

## 🛠️ Installation et Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer le serveur web

```bash
npm start
# ou
npm run web
```

### 3. Accéder à l'interface

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

## 📝 Utilisation

### Configuration du Test

1. **URL de Test** : L'URL de votre widget Destygo Chat
   - Exemple : `http://iris-staging.in.viasay.io/widget/preview/production/index.html?environment=default&token=835fead4-8114-d280-d7f5-eb4970fa4b0f`

2. **Nombre d'Utilisateurs** : Nombre d'utilisateurs virtuels à simuler (1-100)

3. **Message de Test** : Message personnalisé à envoyer (optionnel)
   - Variables disponibles :
     - `${USER}` : Numéro de l'utilisateur
     - `${TESTID}` : ID unique du test
     - `${TIME}` : Timestamp du message

4. **Durée du Test** : Durée maximale du test en secondes

### Exécution du Test

1. Remplissez les champs de configuration
2. Cliquez sur **"🚀 Démarrer le Test"**
3. Suivez les logs en temps réel dans la section "📋 Logs en Temps Réel"
4. Consultez les statistiques dans les cartes de résultats

### Contrôles

- **🚀 Démarrer le Test** : Lance un nouveau test
- **⏹️ Arrêter le Test** : Interrompt le test en cours
- **🗑️ Effacer les Logs** : Vide la zone de logs
- **📥 Exporter les Logs** : Télécharge les logs au format texte

## 📊 Interprétation des Résultats

### Statistiques Affichées

- **Messages Totaux** : Nombre total de messages tentés
- **Succès** : Nombre de messages envoyés avec succès
- **Erreurs** : Nombre de messages qui ont échoué
- **Taux de Succès** : Pourcentage de succès

### Types de Logs

- **🔵 INFO** : Informations générales
- **🟡 WARN** : Avertissements
- **🔴 ERROR** : Erreurs
- **⚪ DEBUG** : Informations de débogage

## 🔧 API REST

L'interface web utilise une API REST pour communiquer avec le serveur :

### Endpoints Disponibles

- `GET /` - Interface web principale
- `POST /api/start-test` - Démarrer un test
- `POST /api/stop-test` - Arrêter le test en cours
- `GET /api/test-status` - Statut du test
- `GET /api/logs` - Logs en temps réel (SSE)
- `GET /api/test-info` - Informations sur les tests disponibles

### Exemple d'utilisation de l'API

```bash
# Démarrer un test
curl -X POST http://localhost:3000/api/start-test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://example.com/widget",
    "numberOfUsers": 10,
    "testMessage": "Test message",
    "testDuration": 60
  }'

# Obtenir le statut
curl http://localhost:3000/api/test-status

# Arrêter le test
curl -X POST http://localhost:3000/api/stop-test
```

## 🐳 Utilisation avec Docker

### Construire l'image

```bash
docker build -t destygo-web-test .
```

### Démarrer le conteneur

```bash
docker run -p 3000:3000 destygo-web-test
```

### Avec docker-compose

```bash
docker-compose up web
```

## 🔍 Dépannage

### Problèmes Courants

1. **Port déjà utilisé**
   ```bash
   # Changer le port
   PORT=3001 npm start
   ```

2. **Erreur de permissions**
   ```bash
   # Sur Linux/Mac
   sudo npm start
   ```

3. **Puppeteer ne démarre pas**
   ```bash
   # Installer les dépendances système
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   ```

### Logs du Serveur

Les logs du serveur sont affichés dans la console où vous avez lancé `npm start`. Ils incluent :
- Démarrage du serveur
- Requêtes API
- Logs des tests en cours
- Erreurs éventuelles

## 📱 Compatibilité

- **Navigateurs** : Chrome, Firefox, Safari, Edge (versions récentes)
- **Responsive** : Compatible mobile et tablette
- **Systèmes** : Windows, macOS, Linux

## 🔒 Sécurité

- L'interface web est destinée à un usage local/privé
- Aucune authentification n'est implémentée
- Les tests s'exécutent avec les permissions du processus Node.js

## 📈 Améliorations Futures

- [ ] Authentification utilisateur
- [ ] Historique des tests
- [ ] Graphiques de performance
- [ ] Tests programmés
- [ ] Notifications en temps réel
- [ ] Support de plusieurs types de tests
- [ ] Export des résultats en CSV/JSON
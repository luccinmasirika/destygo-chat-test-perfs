# Documentation Technique - ViaSay Chat Performance Test

## Vue d'ensemble

Le système de test de performance ViaSay est un outil complet permettant de tester la capacité et les performances du widget de chat Destygo dans différents scénarios de charge. Il combine une interface web moderne avec des tests automatisés utilisant Puppeteer.

## Architecture du système

### Composants principaux

1. **Interface Web** (`index.html`) - Interface utilisateur moderne avec l'identité visuelle ViaSay
2. **Serveur Backend** (`server.js`) - API REST et gestion des processus de test
3. **Tests de Performance** - Deux types de tests :
   - `send-messages-test.js` - Test d'envoi de messages simultanés
   - `connection-load-test.js` - Test de charge de connexions
4. **Configuration Docker** - Déploiement conteneurisé avec Nginx

## Fonctionnement détaillé

### 1. Interface Web (Frontend)

#### Technologies utilisées
- **HTML5** avec CSS moderne
- **JavaScript vanilla** (pas de framework)
- **Server-Sent Events (SSE)** pour les logs en temps réel
- **Design responsive** avec l'identité visuelle ViaSay

#### Fonctionnalités
- **Formulaire de configuration** avec valeurs par défaut
- **Contrôle des tests** (démarrer/arrêter)
- **Affichage des logs en temps réel** via SSE
- **Interface intuitive** avec feedback visuel

### 2. Serveur Backend (API)

#### Technologies utilisées
- **Node.js** avec Express.js
- **Child Process** pour exécuter les tests
- **Server-Sent Events** pour la communication temps réel

#### Endpoints API

```javascript
POST /api/start-test     // Démarrer un test
POST /api/stop-test      // Arrêter le test en cours
GET  /api/test-status    // Statut du test
GET  /api/logs           // Stream de logs (SSE)
GET  /api/test-info      // Informations sur les tests disponibles
```

#### Gestion des processus
- **Un seul test à la fois** pour éviter les conflits
- **Gestion automatique** de l'arrêt des processus
- **Redirection des logs** vers l'interface web

### 3. Test d'envoi de messages (`send-messages-test.js`)

#### Principe de fonctionnement
Ce test simule **N utilisateurs virtuels** qui se connectent simultanément au widget Destygo et envoient chacun **1 message** dans un délai contrôlé.

#### Étapes détaillées

##### Phase 1 : Préparation des sessions
```javascript
// Pour chaque utilisateur (1 à N)
for (let i = 1; i <= numberOfUsers; i += 1) {
    prepPromises.push(prepareSession(i, url));
}
```

**Fonction `prepareSession()` :**
1. **Lancement d'un navigateur Puppeteer** en mode headless
2. **Configuration optimisée** :
   - Désactivation des images, CSS, polices pour optimiser les performances
   - Arguments de sécurité et de performance
   - Cache désactivé
3. **Navigation vers l'URL** du widget Destygo
4. **Attente du chargement** du widget (`window.DestygoChat`)
5. **Ouverture du chat** si nécessaire
6. **Retour de la session** (browser, page, userId)

##### Phase 2 : Calcul des délais
```javascript
const totalDelay = 1000; // 1 seconde totale
const delayBetweenMessages = sessions.length > 1 ?
    totalDelay / (sessions.length - 1) : 0;
```

**Objectif :** Répartir l'envoi des messages sur exactement **1 seconde** pour simuler un envoi simultané.

**Exemple :** Pour 20 utilisateurs → délai de 52.63ms entre chaque message

##### Phase 3 : Envoi des messages
```javascript
const sendPromises = sessions.map((session, index) => {
    const delay = index * delayBetweenMessages;
    return new Promise((resolve) => {
        setTimeout(async () => {
            await sendMessage(session, testId, customMessage, stats);
            resolve();
        }, delay);
    });
});
```

**Fonction `sendMessage()` :**
1. **Génération du message** avec variables de substitution :
   - `${USER}` → User_01, User_02, etc.
   - `${TESTID}` → ID unique du test
   - `${TIME}` → Timestamp précis
2. **Envoi via l'API Destygo** : `window.DestygoChat.SendMessage(msg)`
3. **Fermeture du navigateur** pour libérer les ressources
4. **Mise à jour des statistiques**

##### Phase 4 : Génération du rapport
```javascript
log('INFO', 'load-test', 'test_report', '==================== TEST REPORT ====================');
log('INFO', 'load-test', 'test_report', `📈 Total messages attempted: ${total}`);
log('INFO', 'load-test', 'test_report', `✅ Success: ${stats.success}`);
log('INFO', 'load-test', 'test_report', `❌ Errors: ${stats.error}`);
log('INFO', 'load-test', 'test_report', `⏱️ Total duration: ${durationSec} seconds`);
log('INFO', 'load-test', 'test_report', `🚀 Message send duration: ${sendDurationSec} seconds`);
log('INFO', 'load-test', 'test_report', `📊 Success rate: ${successRate}%`);
```

**Métriques calculées :**
- **Taux de succès** : (succès / total) × 100
- **Durée totale** : temps de préparation + envoi
- **Durée d'envoi** : temps entre le premier et dernier message
- **Messages par seconde** : nombre de messages / durée d'envoi

### 4. Test de charge de connexions (`connection-load-test.js`)

#### Principe de fonctionnement
Ce test évalue la **capacité de connexion** du widget Destygo en établissant **N connexions simultanées** et les maintenant ouvertes pendant une durée définie.

#### Étapes détaillées

##### Phase 1 : Établissement des connexions
```javascript
const connectionPromises = [];
for (let i = 1; i <= numberOfUsers; i += 1) {
    connectionPromises.push(createConnection(i, url));
}
const connections = await Promise.all(connectionPromises);
```

**Fonction `createConnection()` :**
1. **Lancement d'un navigateur** (similaire au test de messages)
2. **Navigation vers l'URL** avec attente `networkidle2`
3. **Vérification de la connexion** réussie
4. **Retour de l'objet connexion**

##### Phase 2 : Maintien des connexions
```javascript
log('INFO', 'load-test', 'test_wait',
    `All connections established. Maintaining connections for ${testDuration} seconds...`);
await new Promise((resolve) => setTimeout(resolve, testDuration * 1000));
```

**Objectif :** Maintenir toutes les connexions ouvertes pendant la durée du test pour évaluer la stabilité.

##### Phase 3 : Nettoyage et rapport
```javascript
const closePromises = stats.connections.map(async (connection) => {
    try {
        await connection.browser.close();
    } catch (error) {
        log('ERROR', 'connection-manager', 'connection_close_failed',
            `Failed to close connection ${connection.userId}: ${error.message}`);
    }
});
```

**Métriques calculées :**
- **Connexions par seconde** : nombre de connexions / durée totale
- **Taux de succès** des connexions
- **Capacité de l'URL** en connexions simultanées

### 5. Système de logs structurés

#### Format des logs
```javascript
function log(level, service, action, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    console.log(`${timestamp} ${level} [${service}] ${action} - ${message}`);
}
```

**Structure :** `YYYY-MM-DD HH:MM:SS.XXX LEVEL [SERVICE] ACTION - MESSAGE`

**Exemples :**
```
2025-06-19 08:26:21.174 DEBUG [load-test] delay_calc - Calculated delay between messages: 52.63ms for 20 users
2025-06-19 08:26:21.229 DEBUG [message-sender] message_sent - User 1 sent message at 176
2025-06-19 08:26:22.201 INFO [load-test] test_report - 📈 Total messages attempted: 20
```

#### Niveaux de log
- **DEBUG** : Informations détaillées pour le débogage
- **INFO** : Informations générales sur le déroulement
- **WARN** : Avertissements (non critiques)
- **ERROR** : Erreurs et échecs

#### Services identifiés
- **load-test** : Orchestration générale des tests
- **session-manager** : Gestion des sessions utilisateur
- **message-sender** : Envoi des messages
- **connection-manager** : Gestion des connexions

### 6. Communication temps réel (SSE)

#### Principe
Les logs du serveur sont **interceptés** et **redirigés** vers l'interface web via Server-Sent Events.

#### Implémentation côté serveur
```javascript
app.get('/api/logs', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Interception des logs console
    const originalLog = console.log;
    console.log = (...args) => {
        originalLog.apply(console, args);
        sendLog('info', args.join(' '));
    };
});
```

#### Implémentation côté client
```javascript
const eventSource = new EventSource('/api/logs');
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'log') {
        appendLog(data.level, data.message);
    }
};
```

### 7. Configuration et variables d'environnement

#### Variables requises
```bash
DESTYGO_TEST_URL          # URL du widget Destygo à tester
DESTYGO_NUMBER_OF_USERS   # Nombre d'utilisateurs virtuels
DESTYGO_TEST_MESSAGE      # Message personnalisé (optionnel)
DESTYGO_TEST_DURATION     # Durée du test de connexion (optionnel)
```

#### Validation des paramètres
- **URL** : Doit être une URL valide
- **Nombre d'utilisateurs** : Entre 1 et 100
- **Message personnalisé** : Support des variables `${USER}`, `${TESTID}`, `${TIME}`

### 8. Optimisations et bonnes pratiques

#### Optimisations Puppeteer
```javascript
const browser = await puppeteer.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-images',        // Optimisation performance
        '--disable-extensions',    // Réduction mémoire
        '--disable-plugins'        // Réduction mémoire
    ],
});
```

#### Gestion des ressources
- **Fermeture automatique** des navigateurs après utilisation
- **Limitation** à un test à la fois
- **Nettoyage** des processus en cas d'arrêt

#### Gestion d'erreurs
- **Try-catch** sur toutes les opérations critiques
- **Logs d'erreur** détaillés
- **Arrêt gracieux** en cas d'erreur fatale

### 9. Déploiement Docker

#### Architecture
- **Image multi-stage** combinant Nginx et Node.js
- **Nginx** : Serveur web pour l'interface
- **Node.js** : Backend API et tests
- **Communication** via proxy Nginx

#### Optimisations Docker
- **Cache des dépendances** npm optimisé
- **Multi-stage build** pour réduire la taille
- **Configuration Nginx** optimisée pour les performances

## Cas d'usage typiques

### 1. Test de charge simple
- **Objectif** : Vérifier la capacité d'envoi de messages
- **Configuration** : 20-50 utilisateurs, message par défaut
- **Métrique clé** : Taux de succès et durée d'envoi

### 2. Test de stress
- **Objectif** : Identifier les limites du système
- **Configuration** : 100 utilisateurs, messages personnalisés
- **Métrique clé** : Point de rupture et comportement en erreur

### 3. Test de stabilité
- **Objectif** : Vérifier la stabilité sur la durée
- **Configuration** : Test de connexions sur 5-10 minutes
- **Métrique clé** : Maintien des connexions et déconnexions

### 4. Test de performance
- **Objectif** : Mesurer les performances optimales
- **Configuration** : Différents nombres d'utilisateurs
- **Métrique clé** : Messages par seconde et latence

## Interprétation des résultats

### Métriques de succès
- **Taux de succès > 95%** : Performance excellente
- **Taux de succès 80-95%** : Performance correcte
- **Taux de succès < 80%** : Problèmes de performance

### Métriques de performance
- **< 1 seconde** pour 20 messages : Très bon
- **1-2 secondes** pour 20 messages : Correct
- **> 2 secondes** pour 20 messages : À améliorer

### Signaux d'alerte
- **Erreurs de connexion** fréquentes
- **Timeouts** lors de la navigation
- **Échecs d'envoi** de messages
- **Déconnexions** inattendues

## Maintenance et évolution

### Ajout de nouveaux tests
1. Créer le script de test
2. Ajouter l'endpoint API correspondant
3. Mettre à jour l'interface web
4. Documenter le nouveau test

### Améliorations possibles
- **Tests de charge distribués** (multi-serveurs)
- **Métriques avancées** (latence, débit)
- **Tests de régression** automatisés
- **Intégration CI/CD**
- **Dashboard de monitoring** en temps réel
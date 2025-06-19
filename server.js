const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.static('.'));

// Variable pour stocker le processus de test en cours
let currentTestProcess = null;

// Route principale - sert la page HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API pour démarrer un test
app.post('/api/start-test', async (req, res) => {
    try {
        const { url, numberOfUsers, testMessage, testDuration } = req.body;

        // Validation des paramètres
        if (!url || !numberOfUsers) {
            return res.status(400).json({
                success: false,
                error: 'URL et nombre d\'utilisateurs sont requis'
            });
        }

        if (numberOfUsers < 1 || numberOfUsers > 100) {
            return res.status(400).json({
                success: false,
                error: 'Le nombre d\'utilisateurs doit être entre 1 et 100'
            });
        }

        // Arrêter le test en cours s'il y en a un
        if (currentTestProcess) {
            currentTestProcess.kill();
            currentTestProcess = null;
        }

        // Préparer les variables d'environnement
        const env = {
            ...process.env,
            DESTYGO_TEST_URL: url,
            DESTYGO_NUMBER_OF_USERS: numberOfUsers.toString(),
            DESTYGO_TEST_DURATION: (testDuration || 60).toString()
        };

        if (testMessage) {
            env.DESTYGO_TEST_MESSAGE = testMessage;
        }

        // Générer un ID de test unique
        const testId = `WEB_TEST_${Date.now()}`;

        console.log(`Démarrage du test ${testId} avec ${numberOfUsers} utilisateurs`);

        // Démarrer le processus de test
        currentTestProcess = spawn('node', ['send-messages-test.js'], {
            env,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Gérer les événements du processus
        currentTestProcess.on('error', (error) => {
            console.error('Erreur lors du démarrage du test:', error);
            currentTestProcess = null;
        });

        currentTestProcess.on('close', (code) => {
            console.log(`Test terminé avec le code: ${code}`);
            currentTestProcess = null;
        });

        // Rediriger les logs du processus vers la console
        currentTestProcess.stdout.on('data', (data) => {
            console.log(`[TEST] ${data.toString().trim()}`);
        });

        currentTestProcess.stderr.on('data', (data) => {
            console.error(`[TEST ERROR] ${data.toString().trim()}`);
        });

        res.json({
            success: true,
            testId,
            message: 'Test démarré avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du démarrage du test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API pour arrêter le test en cours
app.post('/api/stop-test', (req, res) => {
    try {
        if (currentTestProcess) {
            currentTestProcess.kill();
            currentTestProcess = null;
            console.log('Test arrêté par l\'utilisateur');
            res.json({
                success: true,
                message: 'Test arrêté avec succès'
            });
        } else {
            res.json({
                success: false,
                message: 'Aucun test en cours'
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'arrêt du test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API pour obtenir le statut du test
app.get('/api/test-status', (req, res) => {
    res.json({
        running: currentTestProcess !== null,
        pid: currentTestProcess ? currentTestProcess.pid : null
    });
});

// API pour obtenir les logs en temps réel (SSE)
app.get('/api/logs', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Envoyer un événement de connexion
    res.write('data: {"type": "connection", "message": "Connexion SSE établie"}\n\n');

    // Fonction pour envoyer des logs
    const sendLog = (level, message) => {
        const logData = {
            type: 'log',
            level,
            message,
            timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(logData)}\n\n`);
    };

    // Intercepter les logs de console pour les envoyer via SSE
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
        originalLog.apply(console, args);
        sendLog('info', args.join(' '));
    };

    console.error = (...args) => {
        originalError.apply(console, args);
        sendLog('error', args.join(' '));
    };

    console.warn = (...args) => {
        originalWarn.apply(console, args);
        sendLog('warn', args.join(' '));
    };

    // Nettoyer lors de la déconnexion
    req.on('close', () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
    });
});

// Route pour obtenir les informations sur les tests disponibles
app.get('/api/test-info', (req, res) => {
    res.json({
        availableTests: [
            {
                name: 'Test de Messages',
                description: 'Test de charge pour l\'envoi de messages',
                script: 'send-messages-test.js',
                parameters: ['DESTYGO_TEST_URL', 'DESTYGO_NUMBER_OF_USERS', 'DESTYGO_TEST_MESSAGE']
            },
            {
                name: 'Test de Connexion',
                description: 'Test de charge pour les connexions',
                script: 'connection-load-test.js',
                parameters: ['DESTYGO_TEST_URL', 'DESTYGO_NUMBER_OF_USERS', 'DESTYGO_TEST_DURATION']
            },
            {
                name: 'Test d\'Accès',
                description: 'Test d\'accès avec Puppeteer',
                script: 'test-puppeteer-access.js',
                parameters: ['DESTYGO_TEST_URL']
            }
        ],
        defaultValues: {
            url: 'http://iris-staging.in.viasay.io/widget/preview/production/index.html?environment=default&token=835fead4-8114-d280-d7f5-eb4970fa4b0f',
            numberOfUsers: 10,
            testDuration: 60,
            testMessage: '[${TESTID}] User_${USER} | Test Performance | ${TIME}'
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée'
    });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
    });
});

// Nettoyer les processus lors de l'arrêt du serveur
process.on('SIGINT', () => {
    console.log('\nArrêt du serveur...');
    if (currentTestProcess) {
        currentTestProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nArrêt du serveur...');
    if (currentTestProcess) {
        currentTestProcess.kill();
    }
    process.exit(0);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur de test de performance démarré sur http://localhost:${PORT}`);
    console.log(`📋 Interface web disponible sur http://localhost:${PORT}`);
    console.log(`🔧 API disponible sur http://localhost:${PORT}/api`);
});
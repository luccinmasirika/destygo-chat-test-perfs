// eslint-disable-next-line import/no-unresolved
require('dotenv').config();
// eslint-disable-next-line import/no-unresolved
const puppeteer = require('puppeteer');

// Filtrer les warnings de Puppeteer
const originalWarn = console.warn;
console.warn = function (...args) {
    if (
        typeof args[0] === 'string'
    && args[0].includes('Puppeteer old Headless deprecation warning')
    ) {
        return; // Ignorer ce warning
    }
    originalWarn.apply(console, args);
};

// Gestion globale des erreurs Node.js
process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('UNCAUGHT EXCEPTION:', err);
});

// Fonction utilitaire pour créer des logs structurés (utilisée dans les autres fichiers)
function log(level, service, action, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

    // eslint-disable-next-line no-console
    console.log(`${timestamp} ${level} [${service}] ${action} - ${message}`);
}

async function createConnection(userId, url) {
    log('DEBUG', 'connection-manager', 'connection_create', `Creating connection for user ${userId}`);
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
        ],
    });
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        // Utiliser la variable d'environnement pour le timeout de navigation, par défaut à 30000ms
        const navigationTimeout = parseInt(process.env.DESTYGO_NAVIGATION_TIMEOUT) || 30000;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: navigationTimeout });
        log('INFO', 'connection-manager', 'connection_ready', `Connection ${userId} ready`);
        return { userId, browser, page, success: true };
    } catch (error) {
        log('ERROR', 'connection-manager', 'connection_failed', `Connection ${userId} failed: ${error.message}`);
        await browser.close();
        return { userId, browser: null, page: null, success: false };
    }
}

async function main() {
    log('INFO', 'load-test', 'test_start', '==================== DESTYGO CHAT CONNECTION LOAD TEST ====================');
    const url = process.env.DESTYGO_TEST_URL;
    const numberOfUsers = parseInt(process.env.DESTYGO_NUMBER_OF_USERS);
    const testDuration = parseInt(process.env.DESTYGO_TEST_DURATION) || 60; // 60 secondes par défaut

    // Vérifier les variables d'environnement requises
    if (!url) {
        log('ERROR', 'load-test', 'config_error', 'DESTYGO_TEST_URL environment variable is required');
        process.exit(1);
    }

    if (!numberOfUsers || isNaN(numberOfUsers) || numberOfUsers <= 0) {
        log('ERROR', 'load-test', 'config_error', 'DESTYGO_NUMBER_OF_USERS environment variable is required and must be a positive number');
        process.exit(1);
    }

    log('DEBUG', 'load-test', 'test_config', `Connection Load Test: Testing URL capacity for ${numberOfUsers} concurrent connections over ${testDuration} seconds`);
    log('DEBUG', 'load-test', 'test_config', `Target URL: ${url}`);
    log('DEBUG', 'load-test', 'test_config', `Number of virtual users: ${numberOfUsers}`);
    log('DEBUG', 'load-test', 'test_config', `Test duration: ${testDuration} seconds`);

    const startTime = Date.now();
    const stats = { success: 0, error: 0, connections: [] };

    log('WARN', 'load-test', 'test_wait', 'Starting connection load test...');

    // Créer toutes les connexions en parallèle
    const connectionPromises = [];
    for (let i = 1; i <= numberOfUsers; i += 1) {
        connectionPromises.push(createConnection(i, url));
    }

    const connections = await Promise.all(connectionPromises);

    // Compter les succès et les échecs
    connections.forEach((connection) => {
        if (connection.success) {
            stats.success += 1;
            stats.connections.push(connection);
        } else {
            stats.error += 1;
        }
    });

    // Attendre la durée du test (en secondes)
    log('INFO', 'load-test', 'test_wait', `All connections established. Maintaining connections for ${testDuration} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, testDuration * 1000));

    // Fermer toutes les connexions (en parallèle)
    log('INFO', 'load-test', 'test_cleanup', 'Closing all connections...');
    const closePromises = stats.connections.map(async (connection) => {
        try {
            await connection.browser.close();
            log('DEBUG', 'connection-manager', 'connection_closed', `Connection ${connection.userId} closed`);
        } catch (error) {
            log('ERROR', 'connection-manager', 'connection_close_failed', `Failed to close connection ${connection.userId}: ${error.message}`);
        }
    });
    await Promise.all(closePromises);

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    const connectionsPerSecond = (stats.success / durationSec).toFixed(2);

    const total = stats.success + stats.error;
    const successRate = total > 0 ? ((stats.success / total) * 100).toFixed(2) : '0.00';

    // Rapport final avec des emojis
    log('INFO', 'load-test', 'test_report', '📊 ==================== CONNECTION LOAD TEST REPORT ==================== 📊');
    log('INFO', 'load-test', 'test_report', `📈 Total connections attempted: ${total}`);
    log('INFO', 'load-test', 'test_report', `✅ Successful connections: ${stats.success}`);
    log('INFO', 'load-test', 'test_report', `❌ Failed connections: ${stats.error}`);
    log('INFO', 'load-test', 'test_report', `⏱️ Total test duration: ${durationSec} seconds`);
    log('INFO', 'load-test', 'test_report', `🚀 Connections per second: ${connectionsPerSecond}`);
    log('INFO', 'load-test', 'test_report', `📊 Connection success rate: ${successRate}%`);
    log('INFO', 'load-test', 'test_report', `🎯 URL capacity: ${connectionsPerSecond} connections/second`);
    log('INFO', 'load-test', 'test_report', '🎉 Connection load test completed');
}

main().catch((error) => {
    log('ERROR', 'load-test', 'test_failed', `Test failed: ${error.message}`);
    process.exit(1);
});
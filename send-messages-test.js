// eslint-disable-next-line import/no-unresolved
require('events').EventEmitter.defaultMaxListeners = 100;
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

// Fonction utilitaire pour créer des logs structurés
function log(level, service, action, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

    // eslint-disable-next-line no-console
    console.log(`${timestamp} ${level} [${service}] ${action} - ${message}`);
}

async function prepareSession(userId, url) {
    log('DEBUG', 'session-manager', 'session_create', `Creating session for user ${userId}`);
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
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
    try {
        // Use environment variable for navigation timeout, default to 30000ms
        const navigationTimeout = parseInt(process.env.DESTYGO_NAVIGATION_TIMEOUT) || 30000;
        const chatTimeout = parseInt(process.env.DESTYGO_CHAT_TIMEOUT) || 15000;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeout });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.waitForFunction(() => typeof window.DestygoChat !== 'undefined', { timeout: chatTimeout });
        await page.evaluate(() => {
            if (!window.DestygoChat.isOpen()) {
                window.DestygoChat.ToggleChat({ open: true });
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        log('INFO', 'session-manager', 'session_ready', `Session ready for user ${userId}`);
        return { browser, page, userId };
    } catch (error) {
        log('ERROR', 'session-manager', 'session_failed', `Session preparation failed for user ${userId}: ${error.message}`);
        await browser.close();
        return null;
    }
}

async function sendMessage(session, testId, customMessage, stats) {
    try {
        const currentTime = new Date().toLocaleTimeString('fr-FR', { hour12: false, fractionalSecondDigits: 3 });
        let message;
        if (customMessage) {
            message = customMessage
                .replace(/\$\{USER\}/g, `User_${String(session.userId).padStart(2, '0')}`)
                .replace(/\$\{TESTID\}/g, testId)
                .replace(/\$\{TIME\}/g, currentTime);
        } else {
            message = `[${testId}] User_${String(session.userId).padStart(2, '0')} | #001/001 | ${currentTime} | Test_Multi_Utilisateur`;
        }
        await session.page.evaluate((msg) => {
            window.DestygoChat.SendMessage(msg);
        }, message);
        log('DEBUG', 'message-sender', 'message_sent', `User ${session.userId} sent message at ${currentTime}`);
        stats.success += 1;
    } catch (error) {
        log('ERROR', 'message-sender', 'message_failed', `User ${session.userId} failed to send message: ${error.message}`);
        stats.error += 1;
    } finally {
        await session.browser.close();
    }
}

async function main() {
    log('INFO', 'load-test', 'test_start', 'DESTYGO CHAT LOAD TEST');
    const url = process.env.DESTYGO_TEST_URL;
    const numberOfUsers = parseInt(process.env.DESTYGO_NUMBER_OF_USERS);
    const testId = `MULTIUSERTEST_${Date.now()}`;
    const customMessage = process.env.DESTYGO_TEST_MESSAGE;

    // Vérification des variables d'environnement requises
    if (!url) {
        log('ERROR', 'load-test', 'config_error', 'DESTYGO_TEST_URL environment variable is required');
        process.exit(1);
    }

    if (!numberOfUsers || isNaN(numberOfUsers) || numberOfUsers <= 0) {
        log('ERROR', 'load-test', 'config_error', 'DESTYGO_NUMBER_OF_USERS environment variable is required and must be a positive number');
        process.exit(1);
    }

    log('DEBUG', 'load-test', 'test_config', 'Main Load Test: 1 virtual user = 1 session = 1 conversation = 1 message (simultaneous send)');
    log('DEBUG', 'load-test', 'test_config', `Target URL: ${url}`);
    log('DEBUG', 'load-test', 'test_config', `Number of virtual users simulated: ${numberOfUsers}`);
    log('DEBUG', 'load-test', 'test_config', `Test ID: ${testId}`);
    if (customMessage) {
        log('DEBUG', 'load-test', 'test_config', `Custom message: ${customMessage}`);
    }
    const stats = { success: 0, error: 0 };
    const startTime = Date.now();
    log('WARN', 'session-manager', 'sessions_prepare', 'Preparing all sessions...');
    const prepPromises = [];
    for (let i = 1; i <= numberOfUsers; i += 1) {
        prepPromises.push(prepareSession(i, url));
    }
    const sessions = (await Promise.all(prepPromises)).filter(Boolean);
    log('INFO', 'session-manager', 'sessions_ready', `Session preparation complete. ${sessions.length}/${numberOfUsers} sessions ready.`);
    if (sessions.length === 0) {
        log('ERROR', 'load-test', 'test_failed', 'No session ready.');
        return;
    }
    log('WARN', 'load-test', 'test_wait', 'All sessions are ready. Sending messages with calculated delays...');

    // Calculer le délai entre chaque message pour avoir exactement 1 seconde au total
    const totalDelay = 1000; // 1 seconde en millisecondes
    const delayBetweenMessages = sessions.length > 1 ? totalDelay / (sessions.length - 1) : 0;

    log('DEBUG', 'load-test', 'delay_calc', `Calculated delay between messages: ${delayBetweenMessages.toFixed(2)}ms for ${sessions.length} users`);

    // Variables pour mesurer le temps précis
    let firstMessageStartTime = null;
    let lastMessageStartTime = null;
    const messageTimestamps = [];

    // Créer des promesses avec des délais calculés pour un envoi parallèle échelonné
    const sendPromises = sessions.map((session, index) => {
        const delay = index * delayBetweenMessages;
        return new Promise((resolve) => {
            setTimeout(async () => {
                const messageStartTime = Date.now();

                // Mettre à jour le premier et dernier message (seulement le début)
                if (firstMessageStartTime === null) {
                    firstMessageStartTime = messageStartTime;
                }
                lastMessageStartTime = messageStartTime;

                await sendMessage(session, testId, customMessage, stats);
                const messageEndTime = Date.now();

                // Enregistrer le timestamp de ce message
                messageTimestamps.push({
                    userId: session.userId,
                    startTime: messageStartTime,
                    endTime: messageEndTime,
                });

                resolve();
            }, delay);
        });
    });

    // Attendre que tous les messages soient envoyés
    await Promise.all(sendPromises);

    // Calculer la durée précise entre le début du premier et du dernier message
    const actualSendDuration = lastMessageStartTime - firstMessageStartTime;
    const sendDurationSec = (actualSendDuration / 1000).toFixed(2);

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    const total = stats.success + stats.error;
    const successRate = total > 0 ? ((stats.success / total) * 100).toFixed(2) : '0.00';
    log('INFO', 'load-test', 'test_report', '==================== TEST REPORT ====================');
    log('INFO', 'load-test', 'test_report', `📈 Total messages attempted: ${total}`);
    log('INFO', 'load-test', 'test_report', `✅ Success: ${stats.success}`);
    log('INFO', 'load-test', 'test_report', `❌ Errors: ${stats.error}`);
    log('INFO', 'load-test', 'test_report', `⏱️ Total duration: ${durationSec} seconds`);
    log('INFO', 'load-test', 'test_report', `🚀 Message send duration: ${sendDurationSec} seconds`);
    log('INFO', 'load-test', 'test_report', `📊 Success rate: ${successRate}%`);
    log('INFO', 'load-test', 'test_report', '====================================================');
    log('INFO', 'load-test', 'test_complete', '🎉 Test completed. 1 message per user, 1 conversation per user, all sent at the same time.');
}

main().catch((e) => { log('ERROR', 'load-test', 'test_fatal', `Fatal error: ${e}`); process.exit(1); });

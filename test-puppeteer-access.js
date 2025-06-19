// eslint-disable-next-line import/no-unresolved
require('dotenv').config();
// eslint-disable-next-line import/no-unresolved
const puppeteer = require('puppeteer');

// Filter Puppeteer old Headless warning
const originalWarn = console.warn;
console.warn = function (...args) {
    if (
        typeof args[0] === 'string'
    && args[0].includes('Puppeteer old Headless deprecation warning')
    ) {
        return; // Ignore this warning
    }
    originalWarn.apply(console, args);
};

// Global Node.js error handling
process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('UNCAUGHT EXCEPTION:', err);
});

(async () => {
    const url = process.env.DESTYGO_TEST_URL || 'http://iris-staging.in.viasay.io/widget/preview/production/index.html?environment=default&token=835fead4-8114-d280-d7f5-eb4970fa4b0f';
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
        ],
    });
    const page = await browser.newPage();

    // Log all page errors
    page.on('pageerror', (error) => {
        // eslint-disable-next-line no-console
        console.error('[PAGE ERROR]', error);
    });
    // Log all request failures
    page.on('requestfailed', (request) => {
        // eslint-disable-next-line no-console
        console.error('[REQUEST FAILED]', request.url(), request.failure());
    });
    // Log all navigation errors
    page.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('[BROWSER ERROR]', error);
    });
    // Log browser console messages
    page.on('console', (msg) => {
        // eslint-disable-next-line no-console
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        // eslint-disable-next-line no-console
        console.log('✅ Page opened successfully');
        await page.screenshot({ path: 'test-access.png' });
        // eslint-disable-next-line no-console
        console.log('📸 Screenshot saved as test-access.png');
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('❌ Error accessing the page:', err);
    }
    await browser.close();
})();

#!/usr/bin/env node

// eslint-disable-next-line import/no-unresolved
const fs = require('fs');
// eslint-disable-next-line import/no-unresolved
const path = require('path');
// eslint-disable-next-line import/no-unresolved
const readline = require('readline');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function printStatus(message) {
    console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
}

function printError(message) {
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function printHeader(message) {
    console.log(`${colors.blue}================================${colors.reset}`);
    console.log(`${colors.blue}  ${message}${colors.reset}`);
    console.log(`${colors.blue}================================${colors.reset}`);
}

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, question, defaultValue = '') {
    return new Promise((resolve) => {
        const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
        rl.question(`${question}${defaultText}: `, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validateNumber(value, min = 1, max = 1000) {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
}

function readEnvFile() {
    const envPath = path.join(process.cwd(), '.env');
    const env = {};

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }

    return env;
}

function writeEnvFile(env) {
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), 'env.example');

    let content = '';

    if (fs.existsSync(envExamplePath)) {
        const template = fs.readFileSync(envExamplePath, 'utf8');
        const lines = template.split('\n');

        lines.forEach((line) => {
            if (line.trim() && !line.trim().startsWith('#')) {
                const [key] = line.split('=');
                if (key && env[key.trim()]) {
                    content += `${key.trim()}=${env[key.trim()]}\n`;
                } else {
                    content += line + '\n';
                }
            } else {
                content += line + '\n';
            }
        });
    } else {
        Object.entries(env).forEach(([key, value]) => {
            content += `${key}=${value}\n`;
        });
    }

    fs.writeFileSync(envPath, content);
}

async function setupEnv() {
    printHeader('Destygo Chat Load Test - Environment Setup');

    const rl = createInterface();
    const existingEnv = readEnvFile();

    try {
        printStatus('Welcome! Let\'s configure your load testing environment.');
        console.log('');

        let testUrl = await askQuestion(
            rl,
            'Enter your target application URL',
            existingEnv.DESTYGO_TEST_URL || 'http://iris-staging.in.viasay.io/widget/preview/production/index.html?environment=default&token=835fead4-8114-d280-d7f5-eb4970fa4b0f'
        );

        while (!validateUrl(testUrl)) {
            printError('Invalid URL format. Please enter a valid URL (e.g., http://example.com/widget)');
            testUrl = await askQuestion(rl, 'Enter your target application URL');
        }

        let numberOfUsers = await askQuestion(
            rl,
            'Enter number of virtual users (1-1000)',
            existingEnv.DESTYGO_NUMBER_OF_USERS || '40'
        );

        while (!validateNumber(numberOfUsers, 1, 1000)) {
            printError('Invalid number. Please enter a number between 1 and 1000');
            numberOfUsers = await askQuestion(rl, 'Enter number of virtual users (1-1000)');
        }

        let testDuration = await askQuestion(
            rl,
            'Enter test duration in seconds (10-3600)',
            existingEnv.DESTYGO_TEST_DURATION || '60'
        );

        while (!validateNumber(testDuration, 10, 3600)) {
            printError('Invalid duration. Please enter a number between 10 and 3600 seconds');
            testDuration = await askQuestion(rl, 'Enter test duration in seconds (10-3600)');
        }

        const testMessage = await askQuestion(
            rl,
            'Enter custom message template (optional, press Enter to skip)',
            existingEnv.DESTYGO_TEST_MESSAGE || ''
        );

        console.log('');
        printStatus('Advanced Configuration (optional):');

        const navigationTimeout = await askQuestion(
            rl,
            'Enter navigation timeout in milliseconds (5000-120000)',
            existingEnv.DESTYGO_NAVIGATION_TIMEOUT || '30000'
        );

        const chatTimeout = await askQuestion(
            rl,
            'Enter DestygoChat wait timeout in milliseconds (5000-60000)',
            existingEnv.DESTYGO_CHAT_TIMEOUT || '15000'
        );

        const newEnv = {
            DESTYGO_TEST_URL: testUrl,
            DESTYGO_NUMBER_OF_USERS: numberOfUsers,
            DESTYGO_TEST_DURATION: testDuration,
            DESTYGO_NAVIGATION_TIMEOUT: navigationTimeout,
            DESTYGO_CHAT_TIMEOUT: chatTimeout
        };

        if (testMessage) {
            newEnv.DESTYGO_TEST_MESSAGE = testMessage;
        }

        console.log('');
        printHeader('Configuration Summary');
        console.log(`Target URL: ${colors.cyan}${testUrl}${colors.reset}`);
        console.log(`Virtual Users: ${colors.cyan}${numberOfUsers}${colors.reset}`);
        console.log(`Test Duration: ${colors.cyan}${testDuration} seconds${colors.reset}`);
        if (testMessage) {
            console.log(`Custom Message: ${colors.cyan}${testMessage}${colors.reset}`);
        }
        console.log(`Navigation Timeout: ${colors.cyan}${navigationTimeout}ms${colors.reset}`);
        console.log(`Chat Timeout: ${colors.cyan}${chatTimeout}ms${colors.reset}`);

        const confirm = await askQuestion(rl, 'Do you want to save this configuration? (y/N)', 'y');

        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            writeEnvFile(newEnv);
            printStatus('Configuration saved to .env file!');
            console.log('');
            printStatus('You can now run your load tests:');
            console.log(`  ${colors.cyan}npm run test:quick${colors.reset} - Quick test (5 users)`);
            console.log(`  ${colors.cyan}npm run test:connection:quick${colors.reset} - Quick connection test`);
            console.log(`  ${colors.cyan}./start-performance-test.sh quick${colors.reset} - Using shell script`);
            console.log(`  ${colors.cyan}docker-compose --profile quick up --build${colors.reset} - Using Docker`);
        } else {
            printWarning('Configuration not saved. You can run this setup again anytime.');
        }

    } catch (error) {
        printError(`Setup failed: ${error.message}`);
        process.exit(1);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    setupEnv();
}

module.exports = { setupEnv, readEnvFile, writeEnvFile };
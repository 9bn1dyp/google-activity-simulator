import fs from 'fs';

export function logToFile(account=null, message) {
    // timestamp
    const timestamp = new Date().toISOString();

    // format
    const logMessage = account
    ? `[${timestamp}] [${account}] ${message}\n`
    : `[${timestamp}] ${message}\n`;

    // append to log.txt
    fs.appendFileSync('log.txt', logMessage, 'utf8');
}

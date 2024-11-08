import { chromium } from 'playwright';
import UserAgent from 'user-agents';
import fs from 'fs';
import path from 'path';
import { logToFile } from './log.js';

export async function initializeBrowser(cookieFilePath = null, isHeadless = true) {
    // start chromium
    const browser = await chromium.launch({
        headless: isHeadless,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-web-security',
            '--disable-infobars',
            '--disable-extensions',
            '--start-maximized',
            '--window-size=1280,720'
        ]
    });

    // new user agent instance
    const userAgent = new UserAgent({
        platform: 'Win32',
        deviceCategory: 'desktop',
    });
    // new context with vp and ua
    const contextOptions = {
        userAgent: userAgent.toString(),
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        mute : true
    };

    // check if cookie and load
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
        const cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf-8'));
        contextOptions.storageState = cookies;
        logToFile(path.basename(cookieFilePath),`Loaded ${cookieFilePath}`);
    }

    // create new browser
    const context = await browser.newContext(contextOptions);

    // open page
    const page = await context.newPage();

    return { browser, context, page };
}

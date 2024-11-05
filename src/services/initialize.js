import { chromium } from 'playwright';
import UserAgent from 'user-agents';

export async function initializeBrowser() {
    // start chromium
    const browser = await chromium.launch({
        headless: false,
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

    // // add ua to new context
    const context = await browser.newContext({
        userAgent: userAgent.toString(),
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
    });

    // open new page
    const page = await context.newPage();
    return { browser, context, page };
}

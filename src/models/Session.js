import { initializeBrowser } from '../services/initialize.js';
import path from 'path';
import { logToFile } from '../services/log.js';

class Session {
    constructor(cookieFilePath = null) {
        this.cookieFilePath = cookieFilePath;
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    // init browser
    async init() {
        const { browser, context, page } = await initializeBrowser(this.cookieFilePath);
        this.browser = browser;
        this.context = context;
        this.page = page;

        // load google, accept cookies if needed
        await this.page.goto('https://www.google.com');
        await this.acceptCookies();
    }

    // error log, send account name if cookies not null
    logger(message) {
        if (this.cookieFilePath) {
            logToFile(path.basename(this.cookieFilePath), message);
        } else {
            logToFile(null, message);
        };
    }

    // accept cookies 
    async acceptCookies() {
        // accept cookies if needed
        try {
            const buttonLocator = this.page.locator('/html/body/div[2]/div[2]/div[3]/span/div/div/div/div[3]/div[1]/button[2]');
            await buttonLocator.waitFor({ state: 'visible', timeout: 50000 });
            await buttonLocator.click();
        } catch (error) {
            this.logger('Cannot locate cookie button')
        }
    }

    // search query
    async search(query) {
        if (!this.page) {
            this.logger('Session not initialized. Call init() first.')
            throw new Error("Session not initialized. Call init() first.");
        }

        try {
            // go to search query
            await this.page.goto(`https://www.google.com/search?q=${query}`);

            // log search
            this.logger(`Browsing, query:${query}`)

        } catch (error) {
            this.logger(`Error performing search: ${error}`)
            return [];
        }
    }

    // close broswer session
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.logger("Browser session closed");
        }
    }
}

export default Session;

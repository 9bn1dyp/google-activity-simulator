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

    // error log, send account name if cookies not null
    logger(message) {
        if (this.cookieFilePath) {
            logToFile(path.basename(this.cookieFilePath), message);
        } else {
            logToFile(null, message);
        };
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
            this.logger('Session not initialized, call init() first')
            throw new Error("Session not initialized, call init() first");
        }

        try {
            /* go to search query, &start=10 param leads to page 2,
            prevents an errors from formatting on first page */
            await this.page.goto(`https://www.google.com/search?q=${query}&start=10`);

            // log search
            this.logger(`Browsing ${query}`)

        } catch (error) {
            this.logger(`Error performing search: ${error}`)
            return [];
        }
    }

    // click on tab
    async clickTab(tabName) {
        if (!this.page) {
            this.logger('Session not initialized, call init() first');
            throw new Error("Session not initialized, call init() first");
        }
    
        let tabSelector;
        // fallback for manual redirect
        let fallbackUrl;

        // current search query from the URL
        const currentUrl = await this.page.url();
        const urlParams = new URLSearchParams(new URL(currentUrl).search);
        const query = urlParams.get('q');

        // return if no query
        if (!query) {
            this.logger('No query found in the current URL');
            return;
        }
        
        // specific selectors
        switch (tabName) {
            case "Shopping":
                tabSelector = this.page.locator('a[role="link"][href*="tbm=shop"]');
                fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
                break;
            case "Images":
                tabSelector = this.page.locator('a[role="link"][href*="tbm=isch"]');
                fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
                break;
            case "News":
                tabSelector = this.page.locator('a[role="link"][href*="tbm=nws"]');
                fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`;
                break;
            case "Videos":
                tabSelector = this.page.locator('a[role="link"][href*="tbm=vid"]');
                fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=vid`;
                break;
            default:
                tabSelector = this.page.locator(`text=${tabName}`).first();
                fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(tabName)}`;
                break;
        }
    
        try {

            // timeout until visible
            await tabSelector.waitFor({ state: 'visible', timeout: 10000 });
            await tabSelector.click();
            await this.page.mouse.wheel(0, 200);
    
            this.logger(`Clicked on ${tabName} tab`);

        } catch (error) {

            this.logger(`Error clicking ${tabName} tab: ${error}. Attempting fallback URL.`);
            try {
                // direct to fallback if error
                await this.page.goto(fallbackUrl);
                this.logger(`Navigated directly to ${tabName} tab URL`);
            } catch (navError) {
                this.logger(`Failed to navigate directly to ${tabName} tab URL: ${navError}`);
            }

        }
    }
    
    // click first result
    async interactWithResults() {
        if (!this.page) {
            this.logger('Session not initialized, call init() first');
            throw new Error("Session not initialized, call init() first");
        }
    
        try {
            // results with links have jsname="UWckNb" or jsname="hspDDf" if an advert link
            const firstResultLink = this.page.locator('a[jsname="UWckNb"], a[jsname="hspDDf"]').first();
    
            // scroll into view
            await firstResultLink.scrollIntoViewIfNeeded();
    
            // click the link
            await firstResultLink.click({ force: true });
    
            this.logger("Clicked on the link of the first search result");
        } catch (error) {
            this.logger(`Error interacting with results: ${error}`);
        }
    }
    
    // click first video
    async clickVideo() {
        if (!this.page) {
            this.logger('Session not initialized, call init() first')
            throw new Error("Session not initialized, call init() first");
        }

        try {
            // go video tab
            this.clickTab("Videos")
    
            // wait for the videos to load on the page
            await this.page.waitForSelector('a[href*="youtube.com"]', { timeout: 5000 });
    
            // select the video link
            const firstVideo = this.page.locator('a[href*="youtube.com"]').first();
            await firstVideo.click();
            
            this.logger("Clicked on the first video result");

            // wait for video to load, focus iframe, play video
            await this.page.waitForSelector('video, iframe', { timeout: 5000 });
            const videoFrame = this.page.frameLocator('iframe[src*="youtube.com"]');

            
        } catch (error) {
            this.logger(`Error clicking the first video result: ${error}`);
        }
    }

    // randomize interactions, can only be used after .search()
    async randomInteraction() {
        const actions = [
            () => this.clickTab("Shopping"),
            () => this.clickTab("Images"),
            () => this.clickTab("News"),
            () => this.interactWithResults(),
            () => this.clickVideo()
        ];

        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        try {
            // execute the selected random action
            await randomAction();
            this.logger("Performed a random interaction");
        } catch (error) {
            this.logger(`Error during random interaction: ${error}.`);
        }
    }

    // close browser session
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.logger("Browser session closed");
        }
    }
}

export default Session;
import fs from 'fs';
import path from 'path';
import { initializeBrowser } from './initialize.js';

// email/pass from args
const email = process.argv[2];
const password = process.argv[3];

(async () => {

    // start chromium
    const { browser, context, page } = await initializeBrowser();

    // open sign in page
    try {
        // Go to Google sign-in page and wait for it to load
        await page.goto('https://accounts.google.com/signin', { waitUntil: 'load', timeout: 30000 });
    } catch (error) {
        console.error("Error loading sign-in page:", error.message);
        await browser.close();
        return;
    }

    // email field
    try {
        // wait for email input visibility
        const emailInputLocator = page.locator('xpath=/html/body/div[1]/div[1]/div[2]/c-wiz/div/div[2]/div/div/div[1]/form/span/section/div/div/div[1]/div/div[1]/div/div[1]/input');
        await emailInputLocator.fill(email, { timeout: 30000 });
        
        // email button field
        const buttonLocator = page.locator('xpath=/html/body/div[1]/div[1]/div[2]/c-wiz/div/div[3]/div/div[1]/div/div/button');
        await buttonLocator.waitFor({ state: 'visible', timeout: 30000 });
        await buttonLocator.click();
    } catch (error) {
        console.error("Error during email input process:", error.message);
        await browser.close();
        return; 
    }
    
    await page.waitForTimeout(5000); 

    // password field
    try {
        // wait for password input visibility
        const passwordInputLocator = page.locator('xpath=/html/body/div[1]/div[1]/div[2]/c-wiz/div/div[2]/div/div/div/form/span/section[2]/div/div/div[1]/div[1]/div/div/div/div/div[1]/div/div[1]/input');
        await passwordInputLocator.waitFor({ state: 'visible', timeout: 30000 });
        await passwordInputLocator.fill(password, { timeout: 30000 });

        // password button field
        const passwordButtonLocator = page.locator('xpath=/html/body/div[1]/div[1]/div[2]/c-wiz/div/div[3]/div/div[1]/div/div/button');
        await passwordButtonLocator.waitFor({ state: 'visible', timeout: 30000 });
        await passwordButtonLocator.click();
    } catch (error) {
        console.error("Error during password input process:", error.message);
        await browser.close();
        return; 
    }

    // check if redirected after signin, timeout 3 min
    const startTime = Date.now();
    const timeoutDuration = 180000; // 3min
    const checkInterval = 2000; // 2s

    const intervalId = setInterval(async () => {
        const currentUrl = page.url();
        
        if (currentUrl.includes('myaccount.google.com') || currentUrl.includes('gmail.com')) {
            console.log('Login successful: Redirected to account page.');

            // save cookies if logged in
            const folderPath = path.resolve('cookies');
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true }); // create cookies folder if null
            }

            const filename = path.join(folderPath, `${email.split('@')[0]}.json`);
            const storageState = await context.storageState();
            fs.writeFileSync(filename, JSON.stringify(storageState, null, 2));

            clearInterval(intervalId);
            await browser.close();
            return;
        }

        // if timeout reached throw error
        if (Date.now() - startTime > timeoutDuration) {
            console.log('Login failed: Timeout reached without redirection to account page.');
            clearInterval(intervalId);
            await browser.close();
        }
    }, checkInterval); // check every interval

})();
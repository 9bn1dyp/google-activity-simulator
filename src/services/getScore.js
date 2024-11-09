import { initializeBrowser } from './initialize.js';
import { logToFile } from './log.js';
import fs from 'fs';
import path from 'path';

export async function getScore(cookieFilePath) {
    const { browser, context, page } = await initializeBrowser(cookieFilePath, false);

    try {
        // reCAPTCHA demo page
        await page.goto('https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php');
        await page.reload();
        
        let score = null;
        const maxRetries = 5;
        let retries = 0;

        // 5 retries or score available
        while (score === null && retries < maxRetries) {

            // timeout allow score to load
            await page.waitForTimeout(2000);
            retries += 1;

            // retrieve score element
            const scoreElement = await page.locator('pre.response').textContent();

            // parse check score 
            try {
                const scoreData = JSON.parse(scoreElement);
                if (scoreData && typeof scoreData.score === 'number') {
                    score = scoreData.score;
                }
            } catch (parseError) {
                logToFile(account, `Error parsing: ${parseError}`);
                logToFile(account, `Retrying`);
            }
        }

        // log if score was found
        const account = path.basename(cookieFilePath, '.json');
        if (score !== null) {
            const message = `Score for ${account}@gmail.com: ${score}`;
            console.log(message);
            logToFile(account, message);
        } else {
            console.error(`Failed to retrieve score for ${account}: Score was not found after ${maxRetries} attempts`);
            logToFile(account, `Error fetching score: Score was not found`);
        }

    } catch (error) {
        const account = path.basename(cookieFilePath, '.json');
        console.error(`Failed to retrieve score for ${account}:`, error.message);
        logToFile(account, `Error fetching score: ${error.message}`);
    } finally {
        await browser.close();
    }
}

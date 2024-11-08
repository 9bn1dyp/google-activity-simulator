import { workerData } from 'worker_threads';
import Session from './src/models/Session.js';
import randomWord from './src/services/randomWord.js'

/*
this is the automate script that will be ran in index.js  

order to call
init() -> search() -> any method or randomInteraction()

.logger(message)
calls log.js, writes log into log.txt, if logged in the logs user as well

.init() 
initializes browser w/o cookies, returns browser, context, page

.acceptCookies()
accept cookies popup if available, ran by default calling init()

.search(query)
searches any query in param, not nullable

.clickTab(tabName)
clicks specified tab name e.g Shopping, Images etc

.interactWithResults()
clicks first link on result page

.clickVideo()
calls .clickTab("Videos") then clicks first video and plays

.randomInteraction()
selects a random interaction to do

.close()
closes browser, not process
*/

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// simple script to perform random interaction every 10 minutes, until user stops it
(async () => {

    const session = new Session(workerData.cookieFilePath);
    await session.init();

    // loop until user quits
    while (true) {
        try {
            
            // search -> random interaction
            await session.search(await randomWord());
            await session.randomInteraction();
            
            // sleep for 10 minutes
            await sleep(600000);

        } catch (error) {
            console.error("Error during session loop:", error);
            break;
        }
    }

})();

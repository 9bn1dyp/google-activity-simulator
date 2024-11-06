import { workerData } from 'worker_threads';
import Session from './src/models/Session.js';

(async () => {
    const session = new Session(workerData.cookieFilePath);
    await session.init();
    await session.search("phone")
    await session.close()
})();

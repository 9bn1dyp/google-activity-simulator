import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import Session from './src/models/Session.js';
import { logToFile } from './src/services/log.js';
import readline from 'readline';

console.log(chalk.blue('Google Activity Simulator'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workers = [];

// start CLI
async function startCLI() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select an option:',
            choices: [
                'Automate',
                'Login',
                'Exit'
            ]
        }
    ]);

    process.stdout.write('\x1Bc');

    switch (answers.action) {
        case 'Automate':
            await automationMenu();
            break;
        case 'Login':
            await loginMenu();
            break;
        case 'Exit':
            logToFile(null, 'Terminated process')
            process.exit();
    }

    await startCLI();
}

// key press detection func used for 'press any key'
function waitForKeyPress() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        // once key press, resolve and exit
        rl.question('Press any key to stop all processes: ', () => {
            rl.close();
            resolve();
        });
    });
}

// automation menu
async function automationMenu() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'automationAction',
            message: 'Select an automation option:',
            choices: [
                'All Accounts',
                'Selected Accounts',
                'Return to Main Menu'
            ]
        }
    ]);

    process.stdout.write('\x1Bc');

    const cookiesPath = path.resolve(__dirname, 'cookies');
    let cookieFiles = [];

    // check if cookie files exist
    try {
        cookieFiles = fs.readdirSync(cookiesPath).filter(file => file.endsWith('.json'));
    } catch (error) {
        logToFile(null, `Error reading cookies folder: ${error.message}`)
        return startCLI();
    }

    if (cookieFiles.length === 0) {
        console.log(chalk.red('No cookies available. Please login with an account to get started.'));
        logToFile(null, 'No cookies available')
        return startCLI();
    }

    switch (answers.automationAction) {
        case 'All Accounts':
            await startSessions(cookieFiles);
            break;
        case 'Selected Accounts':
            await selectAccountsAndStartSessions(cookieFiles);
            break;
        case 'Return to Main Menu':
            return;
    }

    await startCLI();
}

// start a sessions for all selected accounts
async function startSessions(cookieFiles) {

    console.log(chalk.green('Starting sessions for all accounts.'));

    for (const file of cookieFiles) {
        const cookieFilePath = path.resolve(__dirname, 'cookies', file);
        const session = new Session(cookieFilePath);

        // create worker threads for each session
        const worker = new Worker(new URL('./worker.js', import.meta.url), {
            workerData: { cookieFilePath }
        });
        workers.push(worker);
    }

    await waitForKeyPress();
    workers.forEach(worker => worker.terminate());
    console.log(chalk.red('All processes have been terminated.'));
}

// select specific accounts and start sessions
async function selectAccountsAndStartSessions(cookieFiles) {
    const { selectedAccounts } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedAccounts',
            message: 'Select accounts to use:',
            choices: cookieFiles.map(file => ({ name: file.replace('.json', '@gmail.com'), value: file }))
        }
    ]);

    if (selectedAccounts.length === 0) {
        console.log(chalk.red('No accounts selected.'));
        return;
    }

    console.log(chalk.green('Starting sessions for selected accounts.'));

    for (const file of selectedAccounts) {
        const cookieFilePath = path.resolve(__dirname, 'cookies', file);
        const session = new Session(cookieFilePath);

        // create worker threads for each session
        const worker = new Worker(new URL('./worker.js', import.meta.url), {
            workerData: { cookieFilePath }
        });
        workers.push(worker);
    }

    await waitForKeyPress();
    workers.forEach(worker => worker.terminate());
    console.log(chalk.red('All processes have been terminated.'));
}

// login menu CLI
async function loginMenu() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'loginAction',
            message: 'Select an option:',
            choices: [
                'Add Gmail',
                'View Saved Gmails',
                'Return'
            ]
        }
    ]);

    // clear CLI
    process.stdout.write('\x1Bc');

    switch (answers.loginAction) {
        case 'Add Gmail':
            await addGmail();
            break;
        case 'View Saved Gmails':
            await viewSavedGmails();
            break;
        case 'Return':
            return;
    }

    await startCLI();
}

// add Gmail function (existing code)
async function addGmail() {
    const { emailPassword } = await inquirer.prompt([
        {
            type: 'input',
            name: 'emailPassword',
            message: 'Enter email and password in the format email:password:',
            validate: input => {
                const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}:[^\s]+$/;
                return regex.test(input) ? true : 'Please enter in the format email:password';
            }
        }
    ]);

    const [email, password] = emailPassword.split(':');
    const signInPath = path.resolve(__dirname, 'src', 'services', 'signIn.js');

    console.log(chalk.blue('Opening browser.'));
    logToFile(null, 'Opening browser.')

    await new Promise((resolve, reject) => {
        exec(`node ${signInPath} "${email}" "${password}"`, (error, stdout, stderr) => {
            if (error) {
                logToFile(null, `Error: ${error.message}`)
                reject(error);
                return;
            }
            if (stderr) {
                logToFile(null, `stderr: ${stderr}`)
                reject(stderr);
                return;
            }
            logToFile(null, stdout)
            resolve();
        });
    });

    process.stdout.write('\x1Bc');
}

// view saved gmails with pagination
async function viewSavedGmails() {
    const cookiesPath = path.resolve(__dirname, 'cookies');
    let files = [];

    try {
        files = fs.readdirSync(cookiesPath).map(file => path.basename(file, '.json'));
    } catch (error) {
        logToFile(null, `Error reading cookies folder: ${error.message}`)
        console.error(chalk.red('Error reading cookies folder:'), error.message);
        return;
    }

    // max 10 displayed on one page
    let pageIndex = 0;
    const pageSize = 10;
    let hasMorePages = files.length > 0;

    // iterate until no more left
    while (hasMorePages) {
        const pageFiles = files.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
        console.log(chalk.yellow(`\nSaved Gmails - Page ${pageIndex + 1}`));
        pageFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file}@gmail.com`);
        });

        const choices = ['Next Page', 'Exit'];
        const isLastPage = (pageIndex + 1) * pageSize >= files.length;
        // if last page display return to menu option
        if (isLastPage) {
            hasMorePages = false;
            choices[0] = 'Back to Main Menu';
        }

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select an action:',
                choices
            }
        ]);

        if (action === 'Next Page') {
            pageIndex++;
        } else {
            hasMorePages = false;
        }

        // Clear CLI
        process.stdout.write('\x1Bc');
    }
}

// ctrc c handlee
process.on('SIGINT', async () => {
    console.log(chalk.red('\nShutting down...'));

    if (workers.length > 0) {
        workers.forEach(worker => worker.terminate());
    }

    await logToFile(null, 'Process terminated by user (SIGINT)');
    console.log(chalk.red('All processes have been terminated.'));
    process.exit(0);
});

// start
startCLI();

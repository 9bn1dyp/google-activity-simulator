import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log(chalk.blue('Google Activity Simulator'));

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// start the CLI
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

    // clear CLI
    process.stdout.write('\x1Bc');

    switch (answers.action) {
        case 'Automate':
            console.log(chalk.green('Automate selected'));
            break;
        case 'Login':
            await loginMenu();
            break;
        case 'Exit':
            console.log(chalk.red('Goodbye!'));
            process.exit();
    }

    await startCLI();
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

    console.log(chalk.blue('Opening browser...'));

    await new Promise((resolve, reject) => {
        exec(`node ${signInPath} "${email}" "${password}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red(`Error: ${error.message}`));
                reject(error);
                return;
            }
            if (stderr) {
                console.error(chalk.red(`stderr: ${stderr}`));
                reject(stderr);
                return;
            }
            console.log(chalk.green(stdout));
            resolve();
        });
    });

    process.stdout.write('\x1Bc');
}

// function to view saved gmails with pagination
async function viewSavedGmails() {
    const cookiesPath = path.resolve(__dirname, 'cookies');
    let files = [];

    try {
        files = fs.readdirSync(cookiesPath).map(file => path.basename(file, '.json'));
    } catch (error) {
        console.error(chalk.red('Error reading cookies folder:'), error.message);
        return;
    }

    let pageIndex = 0;
    const pageSize = 10;
    let hasMorePages = files.length > 0;

    while (hasMorePages) {
        const pageFiles = files.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
        console.log(chalk.yellow(`\nSaved Gmails - Page ${pageIndex + 1}`));
        pageFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file}@gmail.com`);
        });

        const choices = ['Next Page', 'Exit'];
        const isLastPage = (pageIndex + 1) * pageSize >= files.length;
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
startCLI();

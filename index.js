import inquirer from 'inquirer';
import chalk from 'chalk';
import { exec } from 'child_process';
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
            break;  // no need to restart CLI here unless you have specific code to handle this
        case 'Login':
            await loginMenu();
            break;
        case 'Exit':
            console.log(chalk.red('Goodbye!'));
            process.exit();
    }

    // only restart CLI if Automate or Login complete
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
            console.log(chalk.yellow('You selected: View Saved Gmails'));
            break;
        case 'Return':
            return; // go back to main CLI without starting loginMenu again
    }

    // return to main menu after login tasks are done
    await startCLI();
}

// email:password input into signIn.js
async function addGmail() {
    const { emailPassword } = await inquirer.prompt([
        {
            type: 'input',
            name: 'emailPassword',
            message: 'Enter email and password in the format email:password:',
            validate: input => {
                const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}:[^\s]+$/; // regex match email:password format
                return regex.test(input) ? true : 'Please enter in the format email:password';
            }
        }
    ]);

    const [email, password] = emailPassword.split(':');

    // path to the signIn.js
    const signInPath = path.resolve(__dirname, 'src', 'services', 'signIn.js');

    console.log(chalk.blue('Opening browser...'));

    // run signIn.js with email and password and wait for it to finish
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

    // clear CLI
    process.stdout.write('\x1Bc');
}

// start CLI
startCLI();

import inquirer from 'inquirer';
import chalk from 'chalk';
import { deleteConfig, configExists } from '../services/config';

export async function resetCommand(): Promise<void> {
  if (!configExists()) {
    console.log('No configuration file found. Nothing to reset.');
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete your Linearize configuration?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('Reset cancelled.');
    return;
  }

  deleteConfig();
  console.log(chalk.green('✔ Configuration removed successfully.\n'));
}

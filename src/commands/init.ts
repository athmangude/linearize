import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveConfig, configExists } from '../services/config';
import { LinearApiClient } from '../services/linear-client';
import { formatError } from '../utils/errors';
import { Config } from '../types';

export async function initCommand(): Promise<void> {
  if (configExists()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration already exists. Overwrite?',
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log('Init cancelled.');
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Linear API key:',
      mask: '*',
      validate: (input: string) => (input.length > 0 ? true : 'API key is required.'),
    },
    {
      type: 'input',
      name: 'teamId',
      message: 'Enter your Linear Team ID:',
      validate: (input: string) => (input.length > 0 ? true : 'Team ID is required.'),
    },
    {
      type: 'input',
      name: 'defaultStateId',
      message: 'Enter a default State ID (optional, press Enter to skip):',
    },
  ]);

  const config: Config = {
    apiKey: answers.apiKey,
    teamId: answers.teamId,
  };
  if (answers.defaultStateId) {
    config.defaultStateId = answers.defaultStateId;
  }

  console.log('\nVerifying credentials...');

  try {
    const client = new LinearApiClient(config);
    await client.verifyConnection();
    const team = await client.getTeam(config.teamId);
    console.log(chalk.green(`\n✔ Connected successfully! Team: ${team.name}`));

    saveConfig(config);
    console.log(chalk.green('✔ Configuration saved.\n'));
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

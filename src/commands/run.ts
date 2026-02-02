import fs from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, configExists } from '../services/config';
import { validateInput } from '../services/schema-validator';
import { renderTree } from '../services/tree-renderer';
import { LinearApiClient } from '../services/linear-client';
import { createProgressTracker } from '../utils/progress';
import { ConfigError, ValidationError, formatError } from '../utils/errors';

export async function runCommand(filePath: string): Promise<void> {
  try {
    if (!configExists()) {
      throw new ConfigError("No configuration found. Please run 'linear-sync init' first.");
    }

    const config = loadConfig()!;

    let rawData: unknown;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      rawData = JSON.parse(fileContent);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ValidationError(`Failed to read or parse file: ${message}`);
    }

    const data = validateInput(rawData);

    const { parentTitle } = await inquirer.prompt([
      {
        type: 'input',
        name: 'parentTitle',
        message: 'What is the title of the main parent ticket?',
        validate: (input: string) => (input.length > 0 ? true : 'Title is required.'),
      },
    ]);

    console.log('\nPreview of ticket hierarchy:\n');
    console.log(renderTree(parentTitle, data));
    console.log('');

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with creating these tickets in Linear?',
        default: true,
      },
    ]);

    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }

    const client = new LinearApiClient(config);
    const totalStories = data.scenarios.reduce((sum, s) => sum + s.userStories.length, 0);
    const progress = createProgressTracker(totalStories);
    const startTime = Date.now();

    let storiesCreated = 0;

    console.log('\nCreating parent ticket...');
    const parentIssue = await client.createIssue({ title: parentTitle });

    for (const scenario of data.scenarios) {
      const scenarioIssue = await client.createIssue({
        title: scenario.name,
        parentId: parentIssue.id,
      });

      for (const story of scenario.userStories) {
        progress.update(scenario.name, story.title, storiesCreated);

        const description = [
          `**User Story:** ${story.description}`,
          '',
          '**Acceptance Criteria:**',
          story.acceptanceCriteria,
        ].join('\n');

        await client.createIssue({
          title: story.title,
          description,
          parentId: scenarioIssue.id,
        });

        storiesCreated++;
      }
    }

    progress.update('Done', 'Done', totalStories);
    progress.stop();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log(chalk.green.bold('✔ Success! Task hierarchy successfully synchronized to Linear.'));
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  Parent Ticket:      ${parentTitle}`);
    console.log(`  Total Scenarios:    ${data.scenarios.length}`);
    console.log(`  Total User Stories: ${totalStories}`);
    console.log(`  Time Elapsed:       ${elapsed} seconds`);
    console.log(`  View Parent Ticket: ${parentIssue.url}`);
    console.log('');
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

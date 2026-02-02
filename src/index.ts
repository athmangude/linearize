#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { resetCommand } from './commands/reset';
import { runCommand } from './commands/run';

const program = new Command();

program
  .name('linear-sync')
  .description('CLI tool to create Linear ticket hierarchies from structured JSON files')
  .version('1.0.0');

program
  .command('init')
  .description('Configure Linear API credentials')
  .action(async () => {
    await initCommand();
  });

program
  .command('reset')
  .description('Remove stored configuration')
  .action(async () => {
    await resetCommand();
  });

program
  .command('run')
  .description('Create ticket hierarchy in Linear from a JSON file')
  .requiredOption('--file <path>', 'Path to the JSON file containing scenarios and user stories')
  .action(async (options: { file: string }) => {
    await runCommand(options.file);
  });

program.parse(process.argv);

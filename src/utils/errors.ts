import chalk from 'chalk';

export class LinearSyncError extends Error {
  constructor(
    message: string,
    public errorType: string,
    public details: string,
    public troubleshooting: string
  ) {
    super(message);
    this.name = 'LinearSyncError';
  }
}

export class AuthenticationError extends LinearSyncError {
  constructor(details: string) {
    super(
      'The stored API key is invalid or has expired.',
      'AuthenticationError',
      details,
      "Run 'linear-sync reset' and then 'linear-sync init' to re-enter your credentials."
    );
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends LinearSyncError {
  constructor(details: string) {
    super(
      'The provided JSON file does not match the expected schema.',
      'ValidationError',
      details,
      'Check that your JSON file matches the required schema. See the documentation for the expected format.'
    );
    this.name = 'ValidationError';
  }
}

export class NetworkError extends LinearSyncError {
  constructor(details: string) {
    super(
      'A network error occurred while communicating with the Linear API.',
      'NetworkError',
      details,
      'Check your internet connection and try again.'
    );
    this.name = 'NetworkError';
  }
}

export class ConfigError extends LinearSyncError {
  constructor(details: string) {
    super(
      'Configuration is missing or invalid.',
      'ConfigError',
      details,
      "Run 'linear-sync init' to set up your configuration."
    );
    this.name = 'ConfigError';
  }
}

export function formatError(error: unknown): string {
  if (error instanceof LinearSyncError) {
    const lines = [
      '',
      chalk.bold.red('✖ Error! The synchronization process was interrupted.'),
      '',
      `${chalk.bold('Error Type:')}  ${error.errorType}`,
      `${chalk.bold('Description:')} ${error.message}`,
      `${chalk.bold('Details:')}     ${error.details}`,
      '',
      `${chalk.bold('Troubleshooting:')} ${error.troubleshooting}`,
      '',
    ];
    return lines.join('\n');
  }

  if (error instanceof Error) {
    return `\n${chalk.bold.red('✖ Error!')} ${error.message}\n`;
  }

  return `\n${chalk.bold.red('✖ Error!')} An unknown error occurred.\n`;
}

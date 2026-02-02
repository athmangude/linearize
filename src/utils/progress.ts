import cliProgress from 'cli-progress';
import chalk from 'chalk';

export interface ProgressTracker {
  update(currentScenario: string, currentStory: string, value: number): void;
  stop(): void;
}

export function createProgressTracker(totalStories: number): ProgressTracker {
  const bar = new cliProgress.SingleBar({
    format: `${chalk.bold('{scenario}')}\n${chalk.dim('{story}')}\n[{bar}] {percentage}%\nEstimated time remaining: {eta_formatted}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: true,
    etaBuffer: 5,
  });

  bar.start(totalStories, 0, {
    scenario: '',
    story: '',
  });

  return {
    update(currentScenario: string, currentStory: string, value: number) {
      bar.update(value, {
        scenario: `Current Scenario: ${currentScenario}`,
        story: `Current Story: ${currentStory}`,
      });
    },
    stop() {
      bar.stop();
    },
  };
}

import { InputData } from '../types';

export function renderTree(parentTitle: string, data: InputData): string {
  const lines: string[] = [];

  lines.push(`├── Parent: ${parentTitle}`);

  const scenarios = data.scenarios;
  scenarios.forEach((scenario, sIdx) => {
    const isLastScenario = sIdx === scenarios.length - 1;
    const scenarioPrefix = isLastScenario ? '│   └── ' : '│   ├── ';
    const childPrefix = isLastScenario ? '│       ' : '│   │   ';

    lines.push(`${scenarioPrefix}Scenario: ${scenario.name}`);

    const stories = scenario.userStories;
    stories.forEach((story, uIdx) => {
      const isLastStory = uIdx === stories.length - 1;
      const storyConnector = isLastStory ? '└── ' : '├── ';
      lines.push(`${childPrefix}${storyConnector}${story.title}`);
    });
  });

  return lines.join('\n');
}

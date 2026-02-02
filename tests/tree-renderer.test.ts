import { renderTree } from '../src/services/tree-renderer';
import { InputData } from '../src/types';

describe('Tree Renderer', () => {
  test('renders single scenario with two stories', () => {
    const data: InputData = {
      scenarios: [
        {
          name: '7.1 Limit Increase',
          userStories: [
            { title: 'US-7.1.1 Real-time Sync', description: '', acceptanceCriteria: '' },
            { title: 'US-7.1.2 Cache Invalidation', description: '', acceptanceCriteria: '' },
          ],
        },
      ],
    };
    const output = renderTree('Credit Limit Management', data);
    expect(output).toContain('Parent: Credit Limit Management');
    expect(output).toContain('Scenario: 7.1 Limit Increase');
    expect(output).toContain('US-7.1.1 Real-time Sync');
    expect(output).toContain('US-7.1.2 Cache Invalidation');
  });

  test('renders multiple scenarios', () => {
    const data: InputData = {
      scenarios: [
        {
          name: '7.1 Limit Increase',
          userStories: [
            { title: 'US-7.1.1 Sync', description: '', acceptanceCriteria: '' },
          ],
        },
        {
          name: '7.2 Audit Trail',
          userStories: [
            { title: 'US-7.2.1 Logging', description: '', acceptanceCriteria: '' },
          ],
        },
      ],
    };
    const output = renderTree('Parent', data);
    expect(output).toContain('Scenario: 7.1 Limit Increase');
    expect(output).toContain('Scenario: 7.2 Audit Trail');
  });

  test('snapshot test', () => {
    const data: InputData = {
      scenarios: [
        {
          name: '7.1 Limit Increase in < 2s',
          userStories: [
            { title: 'US-7.1.1 Real-time Sync', description: '', acceptanceCriteria: '' },
            { title: 'US-7.1.2 Cache Invalidation', description: '', acceptanceCriteria: '' },
          ],
        },
        {
          name: '7.2 Audit Trail',
          userStories: [
            { title: 'US-7.2.1 Logging', description: '', acceptanceCriteria: '' },
          ],
        },
      ],
    };
    const output = renderTree('Credit Limit Management', data);
    expect(output).toMatchSnapshot();
  });

  test('uses correct tree connectors for last items', () => {
    const data: InputData = {
      scenarios: [
        {
          name: 'Only Scenario',
          userStories: [
            { title: 'Only Story', description: '', acceptanceCriteria: '' },
          ],
        },
      ],
    };
    const output = renderTree('Parent', data);
    // Last scenario uses └──, last story uses └──
    expect(output).toContain('└── Scenario: Only Scenario');
    expect(output).toContain('└── Only Story');
  });
});

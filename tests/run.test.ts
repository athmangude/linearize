import fs from 'fs';
import path from 'path';

// Mock dependencies before importing the module
jest.mock('../src/services/config');
jest.mock('../src/services/linear-client');
jest.mock('../src/utils/progress');
jest.mock('inquirer');

import { runCommand } from '../src/commands/run';
import { configExists, loadConfig } from '../src/services/config';
import { LinearApiClient } from '../src/services/linear-client';
import { createProgressTracker } from '../src/utils/progress';
import inquirer from 'inquirer';
import { Config } from '../src/types';

const mockConfigExists = configExists as jest.MockedFunction<typeof configExists>;
const mockLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;
const mockCreateProgressTracker = createProgressTracker as jest.MockedFunction<typeof createProgressTracker>;

const sampleFile = path.join(__dirname, '..', 'samples', 'stories-basic.json');

const testConfig: Config = {
  apiKey: 'lin_api_test',
  teamId: 'team-123',
};

let mockCreateIssue: jest.Mock;
let mockProgressUpdate: jest.Mock;
let mockProgressStop: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.exitCode = undefined;

  mockConfigExists.mockReturnValue(true);
  mockLoadConfig.mockReturnValue(testConfig);

  mockCreateIssue = jest.fn();
  (LinearApiClient as jest.Mock).mockImplementation(() => ({
    createIssue: mockCreateIssue,
  }));

  let callCount = 0;
  mockCreateIssue.mockImplementation(async () => {
    callCount++;
    return {
      id: `issue-${callCount}`,
      identifier: `ENG-${callCount}`,
      url: `https://linear.app/team/issue/ENG-${callCount}`,
    };
  });

  mockProgressUpdate = jest.fn();
  mockProgressStop = jest.fn();
  mockCreateProgressTracker.mockReturnValue({
    update: mockProgressUpdate,
    stop: mockProgressStop,
  });

  (inquirer as any).prompt = jest.fn()
    .mockResolvedValueOnce({ parentTitle: 'Test Parent' })
    .mockResolvedValueOnce({ confirmed: true });
});

describe('run command', () => {
  test('creates parent, scenario, and story issues in correct hierarchy', async () => {
    await runCommand(sampleFile);

    // Parent + 1 scenario + 2 stories = 4 issues
    expect(mockCreateIssue).toHaveBeenCalledTimes(4);

    // First call: parent (no parentId)
    expect(mockCreateIssue.mock.calls[0][0]).toEqual(
      expect.objectContaining({ title: 'Test Parent' })
    );
    expect(mockCreateIssue.mock.calls[0][0].parentId).toBeUndefined();

    // Second call: scenario (parent is issue-1)
    expect(mockCreateIssue.mock.calls[1][0]).toEqual(
      expect.objectContaining({ parentId: 'issue-1' })
    );

    // Third call: first story (parent is scenario issue-2)
    expect(mockCreateIssue.mock.calls[2][0]).toEqual(
      expect.objectContaining({ parentId: 'issue-2' })
    );

    // Fourth call: second story (parent is scenario issue-2)
    expect(mockCreateIssue.mock.calls[3][0]).toEqual(
      expect.objectContaining({ parentId: 'issue-2' })
    );
  });

  test('formats user story description correctly', async () => {
    await runCommand(sampleFile);

    const storyCall = mockCreateIssue.mock.calls[2][0];
    expect(storyCall.description).toContain('**User Story:**');
    expect(storyCall.description).toContain('**Acceptance Criteria:**');
  });

  test('shows error when config is missing', async () => {
    mockConfigExists.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await runCommand(sampleFile);

    expect(process.exitCode).toBe(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('aborts when user declines confirmation', async () => {
    (inquirer as any).prompt = jest.fn()
      .mockResolvedValueOnce({ parentTitle: 'Test Parent' })
      .mockResolvedValueOnce({ confirmed: false });

    await runCommand(sampleFile);

    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  test('tracks progress correctly', async () => {
    await runCommand(sampleFile);

    expect(mockCreateProgressTracker).toHaveBeenCalledWith(2); // 2 stories
    expect(mockProgressUpdate).toHaveBeenCalled();
    expect(mockProgressStop).toHaveBeenCalled();
  });

  test('shows error for invalid file path', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await runCommand('/nonexistent/file.json');

    expect(process.exitCode).toBe(1);
    consoleSpy.mockRestore();
  });

  test('shows error for invalid JSON schema', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const invalidFile = path.join(__dirname, '..', 'samples', 'stories-invalid.json');

    await runCommand(invalidFile);

    expect(process.exitCode).toBe(1);
    consoleSpy.mockRestore();
  });
});

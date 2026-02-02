import { LinearApiClient } from '../src/services/linear-client';
import { AuthenticationError, NetworkError } from '../src/utils/errors';
import { Config } from '../src/types';

// Mock @linear/sdk
jest.mock('@linear/sdk', () => {
  const mockCreateIssue = jest.fn();
  const mockViewer = jest.fn();
  const mockTeam = jest.fn();

  return {
    LinearClient: jest.fn().mockImplementation(() => ({
      get viewer() {
        return mockViewer();
      },
      team: mockTeam,
      createIssue: mockCreateIssue,
    })),
    __mockCreateIssue: mockCreateIssue,
    __mockViewer: mockViewer,
    __mockTeam: mockTeam,
  };
});

const { __mockCreateIssue, __mockViewer, __mockTeam } = require('@linear/sdk');

const testConfig: Config = {
  apiKey: 'lin_api_test',
  teamId: 'team-123',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LinearApiClient', () => {
  describe('verifyConnection', () => {
    test('succeeds with valid viewer', async () => {
      __mockViewer.mockResolvedValue({ id: 'user-1', name: 'Test User' });
      const client = new LinearApiClient(testConfig);
      await expect(client.verifyConnection()).resolves.toBeUndefined();
    });

    test('throws AuthenticationError on 401', async () => {
      __mockViewer.mockRejectedValue(new Error('401 Unauthorized'));
      const client = new LinearApiClient(testConfig);
      await expect(client.verifyConnection()).rejects.toThrow(AuthenticationError);
    });

    test('throws NetworkError on generic failure', async () => {
      __mockViewer.mockRejectedValue(new Error('ECONNREFUSED'));
      const client = new LinearApiClient(testConfig);
      await expect(client.verifyConnection()).rejects.toThrow(NetworkError);
    });
  });

  describe('getTeam', () => {
    test('returns team info', async () => {
      __mockTeam.mockResolvedValue({ id: 'team-123', name: 'Engineering' });
      const client = new LinearApiClient(testConfig);
      const team = await client.getTeam('team-123');
      expect(team).toEqual({ id: 'team-123', name: 'Engineering' });
    });

    test('throws NetworkError on failure', async () => {
      __mockTeam.mockRejectedValue(new Error('Not found'));
      const client = new LinearApiClient(testConfig);
      await expect(client.getTeam('bad-id')).rejects.toThrow(NetworkError);
    });
  });

  describe('createIssue', () => {
    test('creates issue and returns result', async () => {
      __mockCreateIssue.mockResolvedValue({
        issue: Promise.resolve({
          id: 'issue-1',
          identifier: 'ENG-1',
          url: 'https://linear.app/team/issue/ENG-1',
        }),
      });
      const client = new LinearApiClient(testConfig);
      const result = await client.createIssue({ title: 'Test Issue' });
      expect(result.id).toBe('issue-1');
      expect(result.identifier).toBe('ENG-1');
      expect(__mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: 'team-123', title: 'Test Issue' })
      );
    });

    test('passes parentId when provided', async () => {
      __mockCreateIssue.mockResolvedValue({
        issue: Promise.resolve({
          id: 'issue-2',
          identifier: 'ENG-2',
          url: 'https://linear.app/team/issue/ENG-2',
        }),
      });
      const client = new LinearApiClient(testConfig);
      await client.createIssue({ title: 'Child', parentId: 'parent-1' });
      expect(__mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 'parent-1' })
      );
    });

    test('retries on rate limit (429)', async () => {
      __mockCreateIssue
        .mockRejectedValueOnce(new Error('429 Too Many Requests'))
        .mockResolvedValueOnce({
          issue: Promise.resolve({
            id: 'issue-3',
            identifier: 'ENG-3',
            url: 'https://linear.app/team/issue/ENG-3',
          }),
        });
      const client = new LinearApiClient(testConfig);
      const result = await client.createIssue({ title: 'Retry Test' });
      expect(result.id).toBe('issue-3');
      expect(__mockCreateIssue).toHaveBeenCalledTimes(2);
    });

    test('includes defaultStateId when configured', async () => {
      const configWithState: Config = { ...testConfig, defaultStateId: 'state-todo' };
      __mockCreateIssue.mockResolvedValue({
        issue: Promise.resolve({
          id: 'issue-4',
          identifier: 'ENG-4',
          url: 'https://linear.app/team/issue/ENG-4',
        }),
      });
      const client = new LinearApiClient(configWithState);
      await client.createIssue({ title: 'With State' });
      expect(__mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({ stateId: 'state-todo' })
      );
    });
  });
});

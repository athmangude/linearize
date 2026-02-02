import { LinearClient as SDKClient } from '@linear/sdk';
import { Config, CreatedIssue } from '../types';
import { AuthenticationError, NetworkError } from '../utils/errors';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export class LinearApiClient {
  private client: SDKClient;
  private teamId: string;
  private defaultStateId?: string;

  constructor(config: Config) {
    this.client = new SDKClient({ apiKey: config.apiKey });
    this.teamId = config.teamId;
    this.defaultStateId = config.defaultStateId;
  }

  async verifyConnection(): Promise<void> {
    try {
      const viewer = await this.client.viewer;
      if (!viewer.id) {
        throw new AuthenticationError('Unable to verify API key.');
      }
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('401') || message.includes('authentication') || message.includes('Unauthorized')) {
        throw new AuthenticationError(message);
      }
      throw new NetworkError(message);
    }
  }

  async getTeam(teamId: string): Promise<{ id: string; name: string }> {
    try {
      const team = await this.client.team(teamId);
      return { id: team.id, name: team.name };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new NetworkError(`Failed to fetch team: ${message}`);
    }
  }

  async createIssue(params: {
    title: string;
    description?: string;
    parentId?: string;
  }): Promise<CreatedIssue> {
    const input: {
      teamId: string;
      title: string;
      description?: string;
      parentId?: string;
      stateId?: string;
    } = {
      teamId: this.teamId,
      title: params.title,
      description: params.description,
      parentId: params.parentId,
    };

    if (this.defaultStateId) {
      input.stateId = this.defaultStateId;
    }

    return this.withRetry(async () => {
      const response = await this.client.createIssue(input as any);
      const issue = await response.issue;
      if (!issue) {
        throw new NetworkError('Failed to create issue — no issue returned.');
      }
      return {
        id: issue.id,
        identifier: issue.identifier,
        url: issue.url,
      };
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate limit');
        if (!isRateLimit || attempt === MAX_RETRIES - 1) {
          throw error;
        }
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
}

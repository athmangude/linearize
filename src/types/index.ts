export interface UserStory {
  title: string;
  description: string;
  acceptanceCriteria: string;
}

export interface Scenario {
  name: string;
  userStories: UserStory[];
}

export interface InputData {
  scenarios: Scenario[];
}

export interface Config {
  apiKey: string;
  teamId: string;
  defaultStateId?: string;
}

export interface CreatedIssue {
  id: string;
  identifier: string;
  url: string;
}

# Product Specification: Linear Task Hierarchy CLI Tool

## 1. Problem Statement

Product Managers often face significant overhead when transitioning from structured product requirement documents (PRDs) or user story tables to execution platforms like Linear. Manually creating parent issues, scenario sub-tasks, and individual user stories is a repetitive, error-prone process that leads to inconsistent formatting and lost metadata. There is currently no streamlined way to take a nested set of requirements (Scenario > User Story > Acceptance Criteria) and replicate that exact hierarchy in Linear with a single command, leading to "administrative fatigue" for PMs.

## 2. The Solution

The **Linear Sync CLI** is a terminal-based utility designed to automate the ingestion of structured requirement data. It allows PMs to map a single JSON file to a sophisticated multi-level hierarchy in Linear. The tool handles authentication, persistent configuration, visual confirmation of the hierarchy, and real-time progress tracking, ensuring that every user story is uploaded with its full context, including scenario descriptions and specific acceptance criteria.

## 3. Technical Requirements & Configuration

### 3.1 Connection Requirements

To interface with the Linear API, the tool requires the following credentials (requested on first run):

* **Linear API Key:** A personal access token generated in Linear settings.

* **Team ID:** The specific team where the tickets should be created.

* **Default State ID:** (Optional) The initial status (e.g., "Todo" or "Backlog").

### 3.2 Persistent Storage

Config data is stored locally (e.g., in `~/.linear-sync-config.json`).

* **`linear sync init`**: Prompt for API key and Team ID.

* **`linear sync reset`**: Wipe local configuration to allow re-entry of credentials.

## 4. User Workflow

1. **Ingestion**: User runs `linear sync run --file ./stories.json`.

2. **Naming**: CLI asks: *"What is the title of the main parent ticket?"*

3. **Visualization**: CLI generates a monochrome tree view showing the Parent, Scenarios, and User Stories.

4. **Confirmation**: User confirms with `Y/N`.

5. **Execution**: The tool creates the Parent, then iterates through Scenarios (assigning them as children of the Parent), and finally User Stories (assigning them as children of the Scenarios).

6. **Completion**: Once the last ticket is created, the tool displays a summary report including the total time elapsed and the URL to the parent ticket.

## 5. Execution UI (Monochrome)

### 5.1 Progress View

During the creation process, the terminal displays:

Current Scenario: 7.1 Limit Increase in < 2s

Current Story: US-7.1.1 Real-time Sync

[████████████████░░░░░░░░░░] 64%

Estimated time remaining: 12s


### 5.2 Completion View

Upon successful completion, the tool transitions to a success state:

✔ Success! Task hierarchy successfully synchronized to Linear.

Summary:

Parent Ticket: [Project Name or Provided Title]

Total Scenarios: 6

Total User Stories: 24

Time Elapsed: 48.5 seconds

View Parent Ticket: https://linear.app/team-slug/issue/ABC-123



## 6. Data Schema

The tool expects a JSON file following this structure:

```json
{
  "$schema": "[http://json-schema.org/draft-07/schema#](http://json-schema.org/draft-07/schema#)",
  "title": "LinearSyncData",
  "description": "Schema for the Linear Sync CLI tool input data.",
  "type": "object",
  "properties": {
    "scenarios": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "The title or description of the scenario group."
          },
          "userStories": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string",
                  "description": "The specific user story ID and title."
                },
                "description": {
                  "type": "string",
                  "description": "The 'As a... I want... so that...' content."
                },
                "acceptanceCriteria": {
                  "type": "string",
                  "description": "The specific criteria for success for this story."
                }
              },
              "required": ["title", "description", "acceptanceCriteria"]
            }
          }
        },
        "required": ["name", "userStories"]
      }
    }
  },
  "required": ["scenarios"]
}

```
## 7. Error Handling

In the event of a failure (e.g., network timeout, invalid schema, or unauthorized API key), the tool will display a structured error message to assist the user in troubleshooting.

### 7.1 Error UI Format

The error message follows a standard structure:


```

✖ Error! The synchronization process was interrupted.

Error Type:  [e.g., ValidationError, AuthenticationError, NetworkError]
Description: [A human-readable explanation of what went wrong]
Details:     [The raw error message or status code thrown by the system]

Troubleshooting: [Suggested action, e.g., "Check your internet connection" or "Run 'linear sync reset'"]

```

### 7.2 Specific Error States

* **Authentication Failure**: Occurs when the stored API key is invalid or has expired.

* **JSON Validation Failure**: Occurs when the provided file does not match the defined schema in Section 6.

* **API Rate Limiting**: Occurs if Linear limits the frequency of requests during batch creation.

* **Missing Configuration**: Occurs if the user attempts to run the tool without first running the `init` command.

```
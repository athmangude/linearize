# Linearizer

A command-line tool that reads a structured JSON file of scenarios and user stories and creates a complete ticket hierarchy in [Linear](https://linear.app) — automatically.

## The Problem

Product Managers spend significant time manually translating structured requirement documents into Linear tickets. A single PRD with 6 scenarios and 24 user stories means creating 31 individual tickets (1 parent + 6 scenarios + 24 stories), assigning each one to the correct parent, and formatting descriptions consistently. This repetitive process leads to:

- **Administrative fatigue** — hours spent on ticket creation instead of product thinking
- **Inconsistent formatting** — acceptance criteria and descriptions drift across tickets
- **Lost hierarchy** — the parent-child relationships from the PRD don't always survive manual entry
- **Human error** — missed stories, duplicated entries, or incorrect nesting

## What Linearizer Does

Linearizer takes a single JSON file containing your scenarios and user stories and creates a **3-level ticket hierarchy** in Linear:

```
Parent Ticket (you name it)
├── Scenario A
│   ├── User Story A.1
│   └── User Story A.2
└── Scenario B
    ├── User Story B.1
    ├── User Story B.2
    └── User Story B.3
```

The tool handles:

1. **Authentication** — stores your Linear API key and team ID locally
2. **Validation** — checks your JSON file against the expected schema before making any API calls
3. **Preview** — renders a tree view of the hierarchy in your terminal for confirmation
4. **Batch creation** — creates all tickets with correct parent-child relationships
5. **Progress tracking** — shows a progress bar with ETA during creation
6. **Error recovery** — retries on rate limits, gives structured error messages on failure

## Impact

| Without Linearizer | With Linearizer |
|---|---|
| ~2 minutes per ticket, manually | ~2 seconds per ticket, automated |
| Formatting varies across tickets | Every story has consistent formatting |
| Hierarchy mistakes go unnoticed | Parent-child relationships enforced |
| Context switching between PRD and Linear | Single command from your terminal |

A PRD with 6 scenarios and 24 user stories that would take 30+ minutes of manual entry is uploaded in under a minute.

## Installation

```bash
npm install -g linearizer
```

Or run directly with npx:

```bash
npx linearizer init
```

## Prerequisites

You need two things from Linear:

1. **API Key** — Click your account menu (top-left) > Settings > Security & Access > Personal API Keys
2. **Team ID** — Go to Linear > Settings > Teams > select your team. The Team ID is in the URL: `https://linear.app/<workspace>/settings/teams/<team-id>`
3. **State ID** (optional) — The ID of the default workflow state (e.g., "Backlog" or "Todo") to assign to new tickets

## Usage

### 1. Configure credentials

```bash
linearizer init
```

The tool will prompt you for:

```
? Enter your Linear API key: ************************************
? Enter your Linear Team ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
? Enter a default State ID (optional, press Enter to skip):

Verifying credentials...

✔ Connected successfully! Team: Engineering
✔ Configuration saved.
```

Your credentials are stored in `~/.linearizer-config.json`. They persist across sessions.

### 2. Create tickets from a JSON file

```bash
linearizer run --file ./stories.json
```

The tool walks you through the process:

```
? What is the title of the main parent ticket? Credit Limit Management

Preview of ticket hierarchy:

├── Parent: Credit Limit Management
│   ├── Scenario: 7.1 Credit Limit Increase in < 2s
│   │   ├── US-7.1.1 Real-time Sync
│   │   ├── US-7.1.2 Cache Invalidation
│   │   └── US-7.1.3 Rollback on Failure
│   └── Scenario: 7.2 Audit Trail
│       ├── US-7.2.1 Change Logging
│       └── US-7.2.2 Audit Report Generation

? Proceed with creating these tickets in Linear? Yes

Creating parent ticket...
Current Scenario: 7.1 Credit Limit Increase in < 2s
Current Story: US-7.1.2 Cache Invalidation
[████████████████░░░░░░░░░░] 40%
Estimated time remaining: 8s
```

On completion:

```
✔ Success! Task hierarchy successfully synchronized to Linear.

Summary:
  Parent Ticket:      Credit Limit Management
  Total Scenarios:    2
  Total User Stories: 5
  Time Elapsed:       12.3 seconds
  View Parent Ticket: https://linear.app/your-team/issue/ENG-123
```

### 3. Reset credentials

```bash
linearizer reset
```

```
? Are you sure you want to delete your Linearizer configuration? Yes
✔ Configuration removed successfully.
```

### 4. Re-initialize with different credentials

If you need to switch teams or API keys, reset first, then init again:

```bash
linearizer reset
linearizer init
```

Or simply run `init` again and choose to overwrite:

```bash
linearizer init
```

```
? Configuration already exists. Overwrite? Yes
```

### 5. Running without prior setup

If you try to run before configuring:

```bash
linearizer run --file ./stories.json
```

```
✖ Error! The synchronization process was interrupted.

Error Type:  ConfigError
Description: Configuration is missing or invalid.
Details:     No configuration found. Please run 'linearizer init' first.

Troubleshooting: Run 'linearizer init' to set up your configuration.
```

### 6. Running with an invalid JSON file

```bash
linearizer run --file ./bad-data.json
```

```
✖ Error! The synchronization process was interrupted.

Error Type:  ValidationError
Description: The provided JSON file does not match the expected schema.
Details:     /scenarios/0 must have required property 'userStories'

Troubleshooting: Check that your JSON file matches the required schema. See the documentation for the expected format.
```

### 7. Missing the `--file` flag

```bash
linearizer run
```

```
error: required option '--file <path>' not specified
```

## Input Data Schema

The tool expects a JSON file with the following structure:

```json
{
  "scenarios": [
    {
      "name": "Scenario group title",
      "userStories": [
        {
          "title": "US-1.1 Short identifier",
          "description": "As a <role>, I want <goal> so that <benefit>.",
          "acceptanceCriteria": "- Criterion one\n- Criterion two\n- Criterion three"
        }
      ]
    }
  ]
}
```

### JSON Schema (Draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LinearizerData",
  "type": "object",
  "properties": {
    "scenarios": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "description": "The title or description of the scenario group."
          },
          "userStories": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The specific user story ID and title."
                },
                "description": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The 'As a... I want... so that...' content."
                },
                "acceptanceCriteria": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The specific criteria for success for this story."
                }
              },
              "required": ["title", "description", "acceptanceCriteria"],
              "additionalProperties": false
            }
          }
        },
        "required": ["name", "userStories"],
        "additionalProperties": false
      }
    }
  },
  "required": ["scenarios"],
  "additionalProperties": false
}
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `scenarios` | array | Yes | Top-level array of scenario groups. Must contain at least one entry. |
| `scenarios[].name` | string | Yes | The title of the scenario. Becomes the ticket title for the scenario-level issue in Linear. |
| `scenarios[].userStories` | array | Yes | Array of user stories under this scenario. Must contain at least one entry. |
| `scenarios[].userStories[].title` | string | Yes | Short identifier and title for the user story (e.g., `"US-7.1.1 Real-time Sync"`). Becomes the ticket title. |
| `scenarios[].userStories[].description` | string | Yes | The full user story text, typically in "As a... I want... so that..." format. |
| `scenarios[].userStories[].acceptanceCriteria` | string | Yes | Success criteria for the story. Use `\n` for line breaks within the string. |

### How fields map to Linear tickets

Each **user story** is created as a Linear issue with this description format:

```markdown
**User Story:** As a user, I want to log in with my email...

**Acceptance Criteria:**
- User can enter email and password
- System validates credentials
- User is redirected to dashboard on success
```

**Scenarios** are created as parent issues under the top-level parent, with their `name` as the ticket title.

## Sample File

Below is a complete sample input file (`samples/stories-basic.json`):

```json
{
  "scenarios": [
    {
      "name": "7.1 User Login",
      "userStories": [
        {
          "title": "US-7.1.1 Email Login",
          "description": "As a user, I want to log in with my email and password so that I can access my account.",
          "acceptanceCriteria": "- User can enter email and password\n- System validates credentials\n- User is redirected to dashboard on success\n- Error message shown on invalid credentials"
        },
        {
          "title": "US-7.1.2 Password Reset",
          "description": "As a user, I want to reset my password so that I can regain access if I forget it.",
          "acceptanceCriteria": "- User can request a password reset via email\n- Reset link expires after 24 hours\n- New password must meet complexity requirements"
        }
      ]
    }
  ]
}
```

A larger sample with 4 scenarios and 11 user stories is available at `samples/stories-full.json`.

## Error Handling

All errors follow a structured format:

```
✖ Error! The synchronization process was interrupted.

Error Type:  [AuthenticationError | ValidationError | NetworkError | ConfigError]
Description: [Human-readable explanation]
Details:     [Raw error message or status code]

Troubleshooting: [Suggested next step]
```

| Error Type | Cause | Suggested Fix |
|---|---|---|
| `AuthenticationError` | Invalid or expired API key | Run `linearizer reset` then `linearizer init` |
| `ValidationError` | JSON file doesn't match the schema | Check file against the schema above |
| `NetworkError` | Connection failure or API issue | Check internet connection, try again |
| `ConfigError` | No config file found | Run `linearizer init` |

Rate limiting (HTTP 429) is handled automatically with exponential backoff and up to 3 retries.

## Development

```bash
# Run in development mode (without building)
npm run dev -- run --file ./samples/stories-basic.json

# Run tests
npm test

# Build
npm run build
```

## License

MIT

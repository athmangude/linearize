import { validateInput } from '../src/services/schema-validator';
import { ValidationError } from '../src/utils/errors';

describe('Schema Validator', () => {
  test('accepts valid input', () => {
    const data = {
      scenarios: [
        {
          name: 'Scenario 1',
          userStories: [
            {
              title: 'US-1',
              description: 'As a user...',
              acceptanceCriteria: '- Criteria 1',
            },
          ],
        },
      ],
    };
    expect(() => validateInput(data)).not.toThrow();
    const result = validateInput(data);
    expect(result.scenarios).toHaveLength(1);
  });

  test('rejects missing scenarios field', () => {
    expect(() => validateInput({})).toThrow(ValidationError);
  });

  test('rejects empty scenarios array', () => {
    expect(() => validateInput({ scenarios: [] })).toThrow(ValidationError);
  });

  test('rejects scenario without name', () => {
    const data = {
      scenarios: [
        {
          userStories: [
            {
              title: 'US-1',
              description: 'desc',
              acceptanceCriteria: 'ac',
            },
          ],
        },
      ],
    };
    expect(() => validateInput(data)).toThrow(ValidationError);
  });

  test('rejects scenario without userStories', () => {
    const data = {
      scenarios: [{ name: 'Scenario 1' }],
    };
    expect(() => validateInput(data)).toThrow(ValidationError);
  });

  test('rejects empty userStories array', () => {
    const data = {
      scenarios: [{ name: 'Scenario 1', userStories: [] }],
    };
    expect(() => validateInput(data)).toThrow(ValidationError);
  });

  test('rejects user story missing acceptanceCriteria', () => {
    const data = {
      scenarios: [
        {
          name: 'Scenario 1',
          userStories: [
            {
              title: 'US-1',
              description: 'desc',
            },
          ],
        },
      ],
    };
    expect(() => validateInput(data)).toThrow(ValidationError);
  });

  test('rejects extra properties', () => {
    const data = {
      scenarios: [
        {
          name: 'Scenario 1',
          userStories: [
            {
              title: 'US-1',
              description: 'desc',
              acceptanceCriteria: 'ac',
              extra: 'bad',
            },
          ],
        },
      ],
    };
    expect(() => validateInput(data)).toThrow(ValidationError);
  });

  test('provides error details', () => {
    try {
      validateInput({ scenarios: [] });
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).details).toBeTruthy();
    }
  });
});

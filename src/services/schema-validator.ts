import Ajv from 'ajv';
import { InputData } from '../types';
import { ValidationError } from '../utils/errors';

const inputSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'LinearizerData',
  description: 'Schema for the Linearizer CLI tool input data.',
  type: 'object',
  properties: {
    scenarios: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'The title or description of the scenario group.',
          },
          userStories: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  minLength: 1,
                  description: 'The specific user story ID and title.',
                },
                description: {
                  type: 'string',
                  minLength: 1,
                  description: "The 'As a... I want... so that...' content.",
                },
                acceptanceCriteria: {
                  type: 'string',
                  minLength: 1,
                  description: 'The specific criteria for success for this story.',
                },
              },
              required: ['title', 'description', 'acceptanceCriteria'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'userStories'],
        additionalProperties: false,
      },
    },
  },
  required: ['scenarios'],
  additionalProperties: false,
};

export function validateInput(data: unknown): InputData {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(inputSchema);

  if (!validate(data)) {
    const errors = validate.errors
      ?.map((e) => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new ValidationError(errors || 'Unknown validation error');
  }

  return data as unknown as InputData;
}

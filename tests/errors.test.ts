import { AuthenticationError, ValidationError, NetworkError, ConfigError, formatError, LinearizeError } from '../src/utils/errors';

describe('Error Classes', () => {
  test('AuthenticationError has correct properties', () => {
    const err = new AuthenticationError('Invalid token');
    expect(err.errorType).toBe('AuthenticationError');
    expect(err.details).toBe('Invalid token');
    expect(err.troubleshooting).toContain('linearize reset');
    expect(err).toBeInstanceOf(LinearizeError);
    expect(err).toBeInstanceOf(Error);
  });

  test('ValidationError has correct properties', () => {
    const err = new ValidationError('Missing field: name');
    expect(err.errorType).toBe('ValidationError');
    expect(err.details).toBe('Missing field: name');
    expect(err.troubleshooting).toContain('schema');
  });

  test('NetworkError has correct properties', () => {
    const err = new NetworkError('Connection timeout');
    expect(err.errorType).toBe('NetworkError');
    expect(err.details).toBe('Connection timeout');
    expect(err.troubleshooting).toContain('internet');
  });

  test('ConfigError has correct properties', () => {
    const err = new ConfigError('File not found');
    expect(err.errorType).toBe('ConfigError');
    expect(err.details).toBe('File not found');
    expect(err.troubleshooting).toContain('linearize init');
  });
});

describe('formatError', () => {
  test('formats LinearizeError with structured output', () => {
    const err = new AuthenticationError('401 Unauthorized');
    const output = formatError(err);
    expect(output).toContain('Error!');
    expect(output).toContain('Error Type:');
    expect(output).toContain('AuthenticationError');
    expect(output).toContain('Description:');
    expect(output).toContain('Details:');
    expect(output).toContain('401 Unauthorized');
    expect(output).toContain('Troubleshooting:');
  });

  test('formats generic Error', () => {
    const err = new Error('Something went wrong');
    const output = formatError(err);
    expect(output).toContain('Error!');
    expect(output).toContain('Something went wrong');
  });

  test('formats unknown error', () => {
    const output = formatError('string error');
    expect(output).toContain('Error!');
    expect(output).toContain('unknown error');
  });
});

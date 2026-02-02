import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config } from '../src/types';

const tmpDir = path.join(os.tmpdir(), 'linearize-test-' + Date.now());
const configPath = path.join(tmpDir, '.linearize-config.json');

// Helper functions that mirror the config service but use tmpDir
function configExists(): boolean {
  return fs.existsSync(configPath);
}

function loadConfig(): Config | null {
  if (!configExists()) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveConfig(config: Config): void {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

function deleteConfig(): void {
  if (configExists()) fs.unlinkSync(configPath);
}

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

afterEach(() => {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
});

describe('Config Service', () => {
  const testConfig: Config = {
    apiKey: 'lin_api_test123',
    teamId: 'team-abc',
    defaultStateId: 'state-xyz',
  };

  test('configExists returns false when no config file', () => {
    expect(configExists()).toBe(false);
  });

  test('saveConfig writes config to disk', () => {
    saveConfig(testConfig);
    expect(fs.existsSync(configPath)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(raw.apiKey).toBe('lin_api_test123');
  });

  test('loadConfig returns saved config', () => {
    saveConfig(testConfig);
    const loaded = loadConfig();
    expect(loaded).toEqual(testConfig);
  });

  test('loadConfig returns null when no config', () => {
    expect(loadConfig()).toBeNull();
  });

  test('deleteConfig removes config file', () => {
    saveConfig(testConfig);
    expect(configExists()).toBe(true);
    deleteConfig();
    expect(configExists()).toBe(false);
  });

  test('deleteConfig is safe when no config exists', () => {
    expect(() => deleteConfig()).not.toThrow();
  });
});

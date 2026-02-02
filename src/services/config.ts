import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config } from '../types';

const CONFIG_PATH = path.join(os.homedir(), '.linearizer-config.json');

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH);
}

export function loadConfig(): Config | null {
  if (!configExists()) {
    return null;
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function deleteConfig(): void {
  if (configExists()) {
    fs.unlinkSync(CONFIG_PATH);
  }
}

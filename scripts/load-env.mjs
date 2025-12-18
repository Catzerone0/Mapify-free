import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseEnvFile(contents) {
  const env = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('export ')) {
      line = line.slice('export '.length).trim();
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith("'") && value.endsWith("'");

    if (isDoubleQuoted) {
      value = value
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (isSingleQuoted) {
      value = value.slice(1, -1);
    } else {
      const hashIndex = value.indexOf('#');
      if (hashIndex !== -1) {
        value = value.slice(0, hashIndex).trim();
      }
    }

    if (key) env[key] = value;
  }

  return env;
}

function resolveProjectRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function getEnvFileLoadOrder(nodeEnv) {
  const files = [];

  if (nodeEnv) files.push(`.env.${nodeEnv}.local`);

  if (nodeEnv !== 'test') {
    files.push('.env.local');
  }

  if (nodeEnv) files.push(`.env.${nodeEnv}`);
  files.push('.env');

  return files;
}

/**
 * Loads environment variables into process.env from common Next.js-style env files.
 *
 * Rules:
 * - Does not override values already set in the shell/process
 * - Prefers NODE_ENV-specific + local files first
 * - Skips .env.local when NODE_ENV === 'test' (Next.js behavior)
 */
export function loadProjectEnv({ rootDir = resolveProjectRoot(), nodeEnv = process.env.NODE_ENV } = {}) {
  const files = getEnvFileLoadOrder(nodeEnv);
  const loadedFiles = [];

  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    const parsed = parseEnvFile(fs.readFileSync(fullPath, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    loadedFiles.push(file);
  }

  return { rootDir, loadedFiles };
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MAX_RECORDS = 200;

const registrationsFileUrl = new URL('../data/registrations.json', import.meta.url);
const primaryFilePath = fileURLToPath(registrationsFileUrl);
const primaryDir = path.dirname(primaryFilePath);
const fileName = path.basename(primaryFilePath);

const fallbackDirEnv = process.env.REGISTRO_STORAGE_FALLBACK_DIR || process.env.REGISTRO_STORAGE_DIR;
const fallbackFilePath = fallbackDirEnv ? path.join(fallbackDirEnv, fileName) : null;

const storageCandidates = [
  { dir: primaryDir, path: primaryFilePath },
  fallbackFilePath ? { dir: path.dirname(fallbackFilePath), path: fallbackFilePath } : null
].filter(Boolean);

let activeStorage = storageCandidates[0];

const READ_ONLY_ERROR_CODES = new Set(['EACCES', 'EROFS']);

function getMaxRecords() {
  const envValue = process.env.REGISTRO_MAX_RECORDS;
  if (!envValue) {
    return DEFAULT_MAX_RECORDS;
  }
  const parsed = Number.parseInt(envValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_RECORDS;
}

async function readFromStorageCandidate(candidate) {
  const content = await readFile(candidate.path, 'utf8');
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeToStorage(candidate, records) {
  await mkdir(candidate.dir, { recursive: true });
  await writeFile(candidate.path, JSON.stringify(records, null, 2), 'utf8');
}

export async function readRegistrations() {
  for (const candidate of [activeStorage, ...storageCandidates]) {
    if (!candidate) continue;
    try {
      const records = await readFromStorageCandidate(candidate);
      activeStorage = candidate;
      return records;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        if (candidate !== storageCandidates[0]) {
          activeStorage = candidate;
        }
        continue;
      }
      if (READ_ONLY_ERROR_CODES.has(error?.code)) {
        if (candidate !== storageCandidates[storageCandidates.length - 1]) {
          continue;
        }
        activeStorage = candidate;
        return [];
      }
    }
  }
  activeStorage = storageCandidates[storageCandidates.length - 1] || activeStorage;
  return [];
}

export async function saveRegistration(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid registration record.');
  }

  const existing = await readRegistrations();
  const maxRecords = getMaxRecords();
  const filtered = existing.filter((entry) => entry?.id && entry.id !== record.id);
  filtered.unshift(record);

  if (filtered.length > maxRecords) {
    filtered.length = maxRecords;
  }

  const attempted = new Set();
  let lastError = null;

  for (const candidate of [activeStorage, ...storageCandidates]) {
    if (!candidate) continue;
    const key = candidate.path;
    if (attempted.has(key)) {
      continue;
    }
    attempted.add(key);
    try {
      await writeToStorage(candidate, filtered);
      activeStorage = candidate;
      return record;
    } catch (error) {
      lastError = error;
      if (!READ_ONLY_ERROR_CODES.has(error?.code)) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return record;
}

export function __setActiveStorageForTests(storage) {
  if (storage) {
    activeStorage = storage;
  }
}


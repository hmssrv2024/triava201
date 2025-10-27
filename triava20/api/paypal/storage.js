import { mkdir as nodeMkdir, readFile as nodeReadFile, writeFile as nodeWriteFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const captureFileUrl = new URL('../../data/paypal-captures.json', import.meta.url);
const primaryCaptureFilePath = fileURLToPath(captureFileUrl);
const captureDir = path.dirname(primaryCaptureFilePath);
const captureFileName = path.basename(primaryCaptureFilePath);

const fallbackDir = process.env.PAYPAL_CAPTURE_FALLBACK_DIR || '/tmp';
const fallbackCaptureFilePath = path.join(fallbackDir, captureFileName);

const primaryStorage = { dir: captureDir, path: primaryCaptureFilePath };
const fallbackStorage = fallbackDir ? { dir: fallbackDir, path: fallbackCaptureFilePath } : null;

let activeStorage = primaryStorage;

const READ_ONLY_ERROR_CODES = new Set(['EACCES', 'EROFS']);

function isReadOnlyError(error) {
  return Boolean(error && READ_ONLY_ERROR_CODES.has(error.code));
}

const defaultFs = {
  mkdir: nodeMkdir,
  readFile: nodeReadFile,
  writeFile: nodeWriteFile
};

let fsPromises = { ...defaultFs };

function getFs() {
  return fsPromises;
}

function getStorageCandidates() {
  const candidates = [activeStorage, primaryStorage];
  if (fallbackStorage) {
    candidates.push(fallbackStorage);
  }

  const seen = new Set();
  return candidates.filter((storage) => {
    if (!storage) {
      return false;
    }
    const key = storage.path;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function readExistingCaptures() {
  const candidates = getStorageCandidates();

  for (const storage of candidates) {
    try {
      const raw = await getFs().readFile(storage.path, 'utf8');
      const parsed = JSON.parse(raw);
      activeStorage = storage;
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error?.code === 'ENOENT') {
        if (storage === fallbackStorage) {
          activeStorage = storage;
          return [];
        }
        continue;
      }

      if (isReadOnlyError(error)) {
        if (storage !== fallbackStorage && fallbackStorage) {
          console.warn(
            `[paypal-storage] ${error.code} al acceder a ${storage.path}. Guardando capturas en ${fallbackStorage.path}.`
          );
          activeStorage = fallbackStorage;
          continue;
        }

        console.warn(
          `[paypal-storage] ${error.code} al acceder a ${storage.path}. Se omite la lectura de capturas persistidas.`
        );
        activeStorage = fallbackStorage ?? storage;
        return [];
      }

      throw error;
    }
  }

  activeStorage = fallbackStorage ?? primaryStorage;
  return [];
}

async function persistToStorage(storage, records) {
  const fs = getFs();
  await fs.mkdir(storage.dir, { recursive: true });
  await fs.writeFile(storage.path, JSON.stringify(records, null, 2), 'utf8');
}

export async function saveCaptureResult(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid capture record.');
  }

  const enrichedRecord = {
    ...record,
    storedAt: record.storedAt || new Date().toISOString()
  };

  let existing = await readExistingCaptures();
  existing.push(enrichedRecord);

  const initialStorage = activeStorage;

  try {
    await persistToStorage(initialStorage, existing);
  } catch (error) {
    if (isReadOnlyError(error) && fallbackStorage && initialStorage !== fallbackStorage) {
      console.warn(
        `[paypal-storage] ${error.code} al escribir en ${initialStorage.path}. Redirigiendo a ${fallbackStorage.path}.`
      );
      activeStorage = fallbackStorage;
      const fallbackExisting = await readExistingCaptures();
      const existingSet = new Set(fallbackExisting.map((entry) => JSON.stringify(entry)));
      for (const entry of existing) {
        const serialized = JSON.stringify(entry);
        if (!existingSet.has(serialized)) {
          fallbackExisting.push(entry);
          existingSet.add(serialized);
        }
      }
      await persistToStorage(activeStorage, fallbackExisting);
    } else {
      throw error;
    }
  }

  return enrichedRecord;
}

export { readExistingCaptures };

export function __setFsPromises(overrides) {
  fsPromises = { ...fsPromises, ...overrides };
}

export function __resetFsPromises() {
  fsPromises = { ...defaultFs };
}

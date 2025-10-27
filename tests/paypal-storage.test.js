import { jest } from '@jest/globals';

const createReadonlyError = (code) => {
  const error = new Error('read-only filesystem');
  error.code = code;
  return error;
};

describe('paypal storage fallback handling', () => {
  let mkdirMock;
  let readFileMock;
  let writeFileMock;
  let consoleWarnSpy;
  let storageModule;

  beforeEach(async () => {
    jest.resetModules();
    mkdirMock = jest.fn(async () => {});
    readFileMock = jest.fn();
    writeFileMock = jest.fn(async () => {});

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    storageModule = await import('../api/paypal/storage.js');
    storageModule.__setFsPromises({
      mkdir: mkdirMock,
      readFile: readFileMock,
      writeFile: writeFileMock
    });
  });

  afterEach(() => {
    storageModule.__resetFsPromises();
    consoleWarnSpy.mockRestore();
  });

  test('redirects capture persistence to /tmp when primary storage is read-only', async () => {
    readFileMock.mockImplementation(async (filePath) => {
      if (filePath.startsWith('/tmp/')) {
        return '[]';
      }
      return '[]';
    });

    writeFileMock.mockImplementation(async (filePath) => {
      if (!filePath.startsWith('/tmp/')) {
        throw createReadonlyError('EROFS');
      }
    });

    const { saveCaptureResult } = storageModule;

    const result = await saveCaptureResult({ id: 'PAYPAL-123' });

    expect(result).toEqual(expect.objectContaining({ id: 'PAYPAL-123', storedAt: expect.any(String) }));
    expect(writeFileMock).toHaveBeenCalledTimes(2);
    expect(writeFileMock.mock.calls[0][0]).not.toContain('/tmp/');
    expect(writeFileMock.mock.calls[1][0]).toBe('/tmp/paypal-captures.json');
    expect(mkdirMock.mock.calls.some(([dir]) => dir.startsWith('/tmp'))).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  test('returns empty list when neither storage is accessible', async () => {
    readFileMock.mockImplementation(async (filePath) => {
      if (filePath.startsWith('/tmp/')) {
        const error = new Error('missing');
        error.code = 'ENOENT';
        throw error;
      }
      throw createReadonlyError('EACCES');
    });

    const { readExistingCaptures } = storageModule;

    const captures = await readExistingCaptures();

    expect(captures).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});

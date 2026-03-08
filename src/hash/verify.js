import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from '../fs/errorMessage.js';

const calculateFileHash = async (filePath) => {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
};

const verify = async () => {
  const checksumsPath = path.resolve(process.cwd(), 'checksums.json');

  try {
    await access(checksumsPath);

    const checksumsRaw = await readFile(checksumsPath, 'utf8');
    const checksums = JSON.parse(checksumsRaw);

    if (!checksums || typeof checksums !== 'object' || Array.isArray(checksums)) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    for (const [fileName, expectedHash] of Object.entries(checksums)) {
      const filePath = path.resolve(process.cwd(), fileName);

      let actualHash = null;
      try {
        actualHash = await calculateFileHash(filePath);
      } catch {
        actualHash = null;
      }

      const isMatch = typeof expectedHash === 'string' && actualHash === expectedHash;
      console.log(`${fileName} — ${isMatch ? 'OK' : 'FAIL'}`);
    }
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await verify();

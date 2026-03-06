import { mkdir, readFile, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from './errorMessage.js';

const restore = async () => {
  const snapshotPath = path.resolve(process.cwd(), 'snapshot.json');
  const restoreRoot = path.resolve(process.cwd(), 'workspace_restored');

  try {
    await access(snapshotPath);

    let restoreExists = false;
    try {
      await access(restoreRoot);
      restoreExists = true;
    } catch {
      restoreExists = false;
    }

    if (restoreExists) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    const snapshotRaw = await readFile(snapshotPath, 'utf8');
    const snapshot = JSON.parse(snapshotRaw);

    if (!snapshot || !Array.isArray(snapshot.entries)) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    await mkdir(restoreRoot, { recursive: false });

    for (const entry of snapshot.entries) {
      if (!entry || typeof entry.path !== 'string' || typeof entry.type !== 'string') {
        throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
      }

      const targetPath = path.join(restoreRoot, entry.path);

      if (entry.type === 'directory') {
        await mkdir(targetPath, { recursive: true });
        continue;
      }

      if (entry.type === 'file') {
        if (typeof entry.content !== 'string') {
          throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
        }

        await mkdir(path.dirname(targetPath), { recursive: true });
        await writeFile(targetPath, Buffer.from(entry.content, 'base64'));
        continue;
      }

      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }

};

await restore();

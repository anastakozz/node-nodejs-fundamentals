import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from './errorMessage.js';

const toPosixPath = (value) => value.split(path.sep).join('/');

const collectEntries = async (rootPath, currentPath, entries) => {
  const dirEntries = await readdir(currentPath, { withFileTypes: true });

  for (const dirEntry of dirEntries) {
    const absoluteEntryPath = path.join(currentPath, dirEntry.name);
    const relativeEntryPath = toPosixPath(path.relative(rootPath, absoluteEntryPath));

    if (dirEntry.isDirectory()) {
      entries.push({ path: relativeEntryPath, type: 'directory' });
      await collectEntries(rootPath, absoluteEntryPath, entries);
      continue;
    }

    if (dirEntry.isFile()) {
      const fileStats = await stat(absoluteEntryPath);
      const fileContent = await readFile(absoluteEntryPath);

      entries.push({
        path: relativeEntryPath,
        type: 'file',
        size: fileStats.size,
        content: fileContent.toString('base64'),
      });
    }
  }
};

const snapshot = async () => {
  const workspacePath = path.resolve(process.cwd(), 'workspace');
  const snapshotPath = path.join(path.dirname(workspacePath), 'snapshot.json');

  try {
    const workspaceStats = await stat(workspacePath);
    if (!workspaceStats.isDirectory()) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    const entries = [];
    await collectEntries(workspacePath, workspacePath, entries);

    const data = {
      rootPath: workspacePath,
      entries,
    };

    await writeFile(snapshotPath, JSON.stringify(data, null, 2));
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await snapshot();

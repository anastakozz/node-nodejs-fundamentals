import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from './errorMessage.js';

const toPosixPath = (value) => value.split(path.sep).join('/');

const normalizeExtension = (value) => {
  if (!value) {
    return '.txt';
  }

  return value.startsWith('.') ? value : `.${value}`;
};

const getExtensionFromCli = () => {
  const extArgIndex = process.argv.indexOf('--ext');

  if (extArgIndex === -1) {
    return '.txt';
  }

  return normalizeExtension(process.argv[extArgIndex + 1]);
};

const findEntries = async (extension, rootPath, currentPath, entries) => {
  const dirEntries = await readdir(currentPath, { withFileTypes: true });

  for (const dirEntry of dirEntries) {
    const absoluteEntryPath = path.join(currentPath, dirEntry.name);
    const relativeEntryPath = toPosixPath(path.relative(rootPath, absoluteEntryPath));

    if (dirEntry.isDirectory()) {
      await findEntries(extension, rootPath, absoluteEntryPath, entries);
      continue;
    }

    if (dirEntry.isFile()) {
      if (path.extname(dirEntry.name) === extension) {
        entries.push(relativeEntryPath);
      }
    }
  }
};

const printToConsole = (entries) => {
  for (const entry of entries) {
    console.log(entry);
  }
};

const findByExt = async () => {
  const workspacePath = path.resolve(process.cwd(), 'workspace');
  const extension = getExtensionFromCli();

  try {
    const workspaceStats = await stat(workspacePath);
    if (!workspaceStats.isDirectory()) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    const entries = [];
    await findEntries(extension, workspacePath, workspacePath, entries);
    entries.sort((a, b) => a.localeCompare(b));
    printToConsole(entries);
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await findByExt();

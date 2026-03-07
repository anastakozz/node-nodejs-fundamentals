import { stat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from './errorMessage.js';

const getRequestedFilesFromCli = () => {
  const filesArgIndex = process.argv.indexOf('--files');

  if (filesArgIndex === -1) {
    return null;
  }

  const rawValue = process.argv[filesArgIndex + 1];
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const collectTxtFiles = async (currentPath, entries) => {
  const dirEntries = await readdir(currentPath, { withFileTypes: true });

  for (const dirEntry of dirEntries) {
    const absoluteEntryPath = path.join(currentPath, dirEntry.name);

    if (dirEntry.isDirectory()) {
      await collectTxtFiles(absoluteEntryPath, entries);
      continue;
    }

    if (dirEntry.isFile() && path.extname(dirEntry.name) === '.txt') {
      entries.push(absoluteEntryPath);
    }
  }
};

const writeMerged = async (mergedPath, entries) => {

  let mergedContent = '';

  for (const entry of entries) {
    const fileContent = await readFile(entry, 'utf8');
    mergedContent += fileContent;
  }

  await writeFile(mergedPath, mergedContent);
};

const merge = async () => {
  const workspacePath = path.resolve(process.cwd(), 'workspace');
  const partsPath = path.join(workspacePath, 'parts');
  const mergeFilePath = path.join(workspacePath, 'merged.txt');

  try {
    const partsStats = await stat(partsPath);
    if (!partsStats.isDirectory()) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    const requestedFiles = getRequestedFilesFromCli();
    let filesToMerge = [];

    if (requestedFiles !== null) {
      if (requestedFiles.length === 0) {
        throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
      }

      filesToMerge = requestedFiles.map((fileName) => path.join(partsPath, fileName));

      for (const filePath of filesToMerge) {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) {
          throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
        }
      }
    } else {
      const txtFiles = [];
      await collectTxtFiles(partsPath, txtFiles);
      txtFiles.sort((a, b) => {
        const byName = path.basename(a).localeCompare(path.basename(b));
        return byName !== 0 ? byName : a.localeCompare(b);
      });

      if (txtFiles.length === 0) {
        throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
      }

      filesToMerge = txtFiles;
    }

    await writeMerged(mergeFilePath, filesToMerge);
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await merge();

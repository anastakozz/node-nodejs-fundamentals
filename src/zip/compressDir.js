import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createBrotliCompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from '../fs/errorMessage.js';

const toPosixPath = (value) => value.split(path.sep).join('/');

const readFileAsBase64FromStream = async (filePath) => {
  const stream = createReadStream(filePath);
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('base64');
};

const collectEntries = async (rootPath, currentPath, entries) => {
  const dirEntries = await readdir(currentPath, { withFileTypes: true });
  dirEntries.sort((a, b) => a.name.localeCompare(b.name));

  for (const dirEntry of dirEntries) {
    const absoluteEntryPath = path.join(currentPath, dirEntry.name);
    const relativeEntryPath = toPosixPath(path.relative(rootPath, absoluteEntryPath));

    if (dirEntry.isDirectory()) {
      entries.push({ path: relativeEntryPath, type: 'directory' });
      await collectEntries(rootPath, absoluteEntryPath, entries);
      continue;
    }

    if (dirEntry.isFile()) {
      const content = await readFileAsBase64FromStream(absoluteEntryPath);
      entries.push({ path: relativeEntryPath, type: 'file', content });
    }
  }
};

const compressDir = async () => {
  const workspacePath = path.resolve(process.cwd(), 'workspace');
  const sourceDirPath = path.join(workspacePath, 'toCompress');
  const compressedDirPath = path.join(workspacePath, 'compressed');
  const archivePath = path.join(compressedDirPath, 'archive.br');

  try {
    const sourceStats = await stat(sourceDirPath);
    if (!sourceStats.isDirectory()) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    await mkdir(compressedDirPath, { recursive: true });

    const entries = [];
    await collectEntries(sourceDirPath, sourceDirPath, entries);

    const payload = JSON.stringify({ entries });

    await pipeline(
      Readable.from(payload),
      createBrotliCompress(),
      createWriteStream(archivePath),
    );
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await compressDir();

import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createBrotliDecompress } from 'node:zlib';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { FS_OPERATION_FAILED_ERROR_MESSAGE } from '../fs/errorMessage.js';

const collectTextFromStream = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const decompressDir = async () => {
  const workspacePath = path.resolve(process.cwd(), 'workspace');
  const compressedDirPath = path.join(workspacePath, 'compressed');
  const archivePath = path.join(compressedDirPath, 'archive.br');
  const decompressedDirPath = path.join(workspacePath, 'decompressed');

  try {
    const compressedStats = await stat(compressedDirPath);
    if (!compressedStats.isDirectory()) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    await access(archivePath);
    await mkdir(decompressedDirPath, { recursive: true });

    const decompressedStream = createReadStream(archivePath).pipe(createBrotliDecompress());
    const payloadText = await collectTextFromStream(decompressedStream);
    const payload = JSON.parse(payloadText);

    if (!payload || !Array.isArray(payload.entries)) {
      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }

    for (const entry of payload.entries) {
      if (!entry || typeof entry.path !== 'string' || typeof entry.type !== 'string') {
        throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
      }

      const targetPath = path.join(decompressedDirPath, entry.path);

      if (entry.type === 'directory') {
        await mkdir(targetPath, { recursive: true });
        continue;
      }

      if (entry.type === 'file') {
        if (typeof entry.content !== 'string') {
          throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
        }

        await mkdir(path.dirname(targetPath), { recursive: true });
        const fileData = Buffer.from(entry.content, 'base64');

        await pipeline(
          Readable.from(fileData),
          createWriteStream(targetPath),
        );
        continue;
      }

      throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
    }
  } catch {
    throw new Error(FS_OPERATION_FAILED_ERROR_MESSAGE);
  }
};

await decompressDir();

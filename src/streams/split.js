import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';

const DEFAULT_MAX_LINES = 10;

const getMaxLines = () => {
  const linesArgIndex = process.argv.indexOf('--lines');
  if (linesArgIndex === -1) {
    return DEFAULT_MAX_LINES;
  }

  const value = Number(process.argv[linesArgIndex + 1]);
  if (!Number.isInteger(value) || value <= 0) {
    return DEFAULT_MAX_LINES;
  }

  return value;
};

const split = async () => {
  const sourcePath = path.resolve(process.cwd(), 'source.txt');
  const maxLines = getMaxLines();

  let chunkIndex = 0;
  let chunkLineCount = 0;
  let buffered = '';
  let currentChunkStream = null;

  const closeChunkStream = async () => {
    if (!currentChunkStream) {
      return;
    }

    currentChunkStream.end();
    await once(currentChunkStream, 'finish');
    currentChunkStream = null;
  };

  const openChunkStream = () => {
    chunkIndex += 1;
    chunkLineCount = 0;
    const chunkPath = path.resolve(process.cwd(), `chunk_${chunkIndex}.txt`);
    currentChunkStream = createWriteStream(chunkPath, { encoding: 'utf8' });
  };

  const writeToChunk = async (text, countsAsLine) => {
    if (!currentChunkStream || chunkLineCount >= maxLines) {
      await closeChunkStream();
      openChunkStream();
    }

    if (!currentChunkStream.write(text)) {
      await once(currentChunkStream, 'drain');
    }

    if (countsAsLine) {
      chunkLineCount += 1;
    }
  };

  const sourceStream = createReadStream(sourcePath, { encoding: 'utf8' });

  for await (const chunk of sourceStream) {
    buffered += chunk;
    const parts = buffered.split('\n');
    buffered = parts.pop();

    for (const line of parts) {
      await writeToChunk(`${line}\n`, true);
    }
  }

  if (buffered.length > 0) {
    await writeToChunk(buffered, true);
  }

  await closeChunkStream();
};

await split();

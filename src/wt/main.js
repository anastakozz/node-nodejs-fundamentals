import { readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Worker } from 'node:worker_threads';

const splitIntoChunks = (items, chunkCount) => {
  const chunks = Array.from({ length: chunkCount }, () => []);

  for (let index = 0; index < items.length; index += 1) {
    const chunkIndex = index % chunkCount;
    chunks[chunkIndex].push(items[index]);
  }

  return chunks;
};

const runWorker = (chunk) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('./worker.js', import.meta.url));

  worker.once('message', (sortedChunk) => {
    resolve(sortedChunk);
    worker.terminate();
  });

  worker.once('error', reject);

  worker.once('exit', (code) => {
    if (code !== 0) {
      reject(new Error(`Worker stopped with exit code ${code}`));
    }
  });

  worker.postMessage(chunk);
});

const pushHeap = (heap, node) => {
  heap.push(node);

  let index = heap.length - 1;
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    if (heap[parentIndex].value <= heap[index].value) {
      break;
    }

    [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
    index = parentIndex;
  }
};

const popHeap = (heap) => {
  if (heap.length === 0) {
    return null;
  }

  const root = heap[0];
  const tail = heap.pop();

  if (heap.length > 0) {
    heap[0] = tail;

    let index = 0;
    while (true) {
      const left = (2 * index) + 1;
      const right = left + 1;
      let smallest = index;

      if (left < heap.length && heap[left].value < heap[smallest].value) {
        smallest = left;
      }

      if (right < heap.length && heap[right].value < heap[smallest].value) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
      index = smallest;
    }
  }

  return root;
};

const mergeSortedChunks = (sortedChunks) => {
  const result = [];
  const heap = [];

  for (let chunkIndex = 0; chunkIndex < sortedChunks.length; chunkIndex += 1) {
    if (sortedChunks[chunkIndex].length > 0) {
      pushHeap(heap, {
        value: sortedChunks[chunkIndex][0],
        chunkIndex,
        itemIndex: 0,
      });
    }
  }

  while (heap.length > 0) {
    const minNode = popHeap(heap);
    result.push(minNode.value);

    const nextItemIndex = minNode.itemIndex + 1;
    const chunk = sortedChunks[minNode.chunkIndex];

    if (nextItemIndex < chunk.length) {
      pushHeap(heap, {
        value: chunk[nextItemIndex],
        chunkIndex: minNode.chunkIndex,
        itemIndex: nextItemIndex,
      });
    }
  }

  return result;
};

const main = async () => {
  const dataPath = path.resolve(process.cwd(), 'data.json');
  const cpuCount = os.cpus().length;

  const dataRaw = await readFile(dataPath, 'utf8');
  const numbers = JSON.parse(dataRaw);

  const chunks = splitIntoChunks(numbers, cpuCount);
  const sortedChunks = await Promise.all(chunks.map((chunk) => runWorker(chunk)));
  const sorted = mergeSortedChunks(sortedChunks);

  console.log(sorted);
};

await main();

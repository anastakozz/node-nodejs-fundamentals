import { Transform } from 'node:stream';

const lineNumberer = () => {
  let lineNumber = 1;
  let buffered = '';

  const numberingTransform = new Transform({
    transform(chunk, encoding, callback) {
      buffered += chunk.toString();

      const parts = buffered.split('\n');
      buffered = parts.pop();

      const numberedLines = parts.map((line) => `${lineNumber++} | ${line}`);

      if (numberedLines.length === 0) {
        callback();
        return;
      }

      callback(null, `${numberedLines.join('\n')}\n`);
    },
    flush(callback) {
      if (buffered.length > 0) {
        callback(null, `${lineNumber} | ${buffered}`);
        return;
      }

      callback();
    },
  });

  process.stdin.pipe(numberingTransform).pipe(process.stdout);
};

lineNumberer();

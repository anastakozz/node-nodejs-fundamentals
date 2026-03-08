import { Transform } from 'node:stream';

const getPattern = () => {
  const patternArgIndex = process.argv.indexOf('--pattern');
  if (patternArgIndex === -1) {
    return '';
  }

  return process.argv[patternArgIndex + 1] ?? '';
};

const filter = () => {
  const pattern = getPattern();
  let buffered = '';

  const filterTransform = new Transform({
    transform(chunk, encoding, callback) {
      buffered += chunk.toString();

      const parts = buffered.split('\n');
      buffered = parts.pop();

      const matchedLines = parts.filter((line) => line.includes(pattern));
      if (matchedLines.length === 0) {
        callback();
        return;
      }

      callback(null, `${matchedLines.join('\n')}\n`);
    },
    flush(callback) {
      if (buffered.length > 0 && buffered.includes(pattern)) {
        callback(null, buffered);
        return;
      }

      callback();
    },
  });

  process.stdin.pipe(filterTransform).pipe(process.stdout);
};

filter();

const DEFAULT_DURATION = 5000;
const DEFAULT_INTERVAL = 100;
const DEFAULT_LENGTH = 30;
const RESET = '\x1b[0m';

const getOptionValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
};

const parsePositiveNumber = (value, fallback, isInteger = false) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  if (isInteger) {
    return Math.floor(numericValue);
  }

  return numericValue;
};

const parseColor = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || !/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return `\x1b[38;2;${red};${green};${blue}m`;
};

const progress = () => {
  const duration = parsePositiveNumber(getOptionValue('--duration'), DEFAULT_DURATION);
  const interval = parsePositiveNumber(getOptionValue('--interval'), DEFAULT_INTERVAL);
  const length = parsePositiveNumber(getOptionValue('--length'), DEFAULT_LENGTH, true);
  const colorStart = parseColor(getOptionValue('--color'));

  const render = (percent) => {
    const filledLength = Math.min(length, Math.floor((percent / 100) * length));
    const filled = '█'.repeat(filledLength);
    const empty = ' '.repeat(length - filledLength);
    const coloredFilled = colorStart ? `${colorStart}${filled}${RESET}` : filled;

    process.stdout.write(`\r[${coloredFilled}${empty}] ${percent}%`);
  };

  const startedAt = Date.now();
  render(0);

  const timer = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const progressRatio = Math.min(elapsed / duration, 1);
    const percent = Math.round(progressRatio * 100);

    render(percent);

    if (progressRatio >= 1) {
      clearInterval(timer);
      const doneMessage = colorStart ? `${colorStart}Done!${RESET}` : 'Done!';
      process.stdout.write(`\n${doneMessage}\n`);
    }
  }, interval);
};

progress();

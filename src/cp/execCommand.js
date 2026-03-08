import { spawn } from 'node:child_process';

const execCommand = () => {
  const command = process.argv.slice(2).join(' ').trim();

  const child = spawn(command, {
    shell: true,
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('close', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
};

execCommand();

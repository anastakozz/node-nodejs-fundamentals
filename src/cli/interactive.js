import readline from 'node:readline';

const interactive = () => {
  const GREEN = '\x1b[32m';
  const RESET = '\x1b[0m';

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  let goodbyePrinted = false;

  const sayGoodbyeOnce = () => {
    if (!goodbyePrinted) {
      console.log(`${GREEN}Goodbye!${RESET}`);
      goodbyePrinted = true;
    }
  };

  rl.on('line', (input) => {
    const command = input.trim();

    if (command === 'uptime') {
      console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
      rl.prompt();
      return;
    }

    if (command === 'cwd') {
      console.log(process.cwd());
      rl.prompt();
      return;
    }

    if (command === 'date') {
      console.log(new Date().toISOString());
      rl.prompt();
      return;
    }

    if (command === 'exit') {
      sayGoodbyeOnce();
      rl.close();
      return;
    }

    console.log('Unknown command');
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    sayGoodbyeOnce();
    rl.close();
  });

  rl.on('close', () => {
    sayGoodbyeOnce();
    process.exit(0);
  });

  rl.prompt();
};

interactive();

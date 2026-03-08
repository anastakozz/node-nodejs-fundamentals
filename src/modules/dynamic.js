

const dynamic = async () => {

  const arg = process.argv[2];

  if (!arg) {
    console.log('Plugin not found');
    process.exit(1);
  }

  const name = arg.endsWith('.js')
  ? arg.slice(0, -3)
  : arg;

  try {
    const plugin = await import(`./plugins/${name}.js`);

    if (typeof plugin.run !== 'function') {
      throw new Error('Invalid plugin');
    }

    console.log(plugin.run());
  } catch {
    console.log('Plugin not found');
    process.exit(1);
  }
};

await dynamic();

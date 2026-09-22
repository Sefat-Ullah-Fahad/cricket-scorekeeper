const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

let port = 3000;
let hostname = '0.0.0.0';

// Parse arguments gracefully
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1] || '3000', 10);
    i++;
  } else if (args[i] === '--host' || args[i] === '-H' || args[i] === '--hostname') {
    hostname = args[i + 1] || '0.0.0.0';
    i++;
  }
}

if (process.env.PORT) {
  port = parseInt(process.env.PORT, 10);
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('[SERVER ERROR]', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, () => {
    const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname;
    console.log(`[READY] Cricket Scorekeeper running on http://${displayHost}:${port} (dev: ${dev})`);
  });
}).catch((err) => {
  console.error('[SERVER STARTUP ERROR]', err);
  process.exit(1);
});

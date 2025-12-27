import express from 'express';
import { Parser, formatLinks } from 'links-notation';
import { readLinoEnv } from 'lino-env';

// Load configuration from Links Notation env file
// If missing, defaults are used
const env = readLinoEnv('.lenv');
const PORT = Number(env.get('server.port')) || Number(process.env.PORT) || 3000;
const HOST = env.get('server.host') || process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.text({ type: ['text/plain', '*/*'] }));

// Health endpoint using Links Notation text instead of JSON
app.get('/health', (_req, res) => {
  res.type('text/plain');
  // Return a minimal LN line: (status: ok)
  res.send('(status: ok)\n');
});

// Echo/parse endpoint: accepts Links Notation text and echoes it back formatted
app.post('/parse', (req, res) => {
  const input = typeof req.body === 'string' ? req.body : '';
  const parser = new Parser();
  res.type('text/plain');
  try {
    const links = parser.parse(input);
    const formatted = formatLinks(links, false);
    res.status(200).send(formatted + (formatted.endsWith('\n') ? '' : '\n'));
  } catch (e) {
    res.status(400).send(`(error: '${String(e.message)}')\n`);
  }
});

// Placeholder route for future link-cli integration
// This will later connect to link-cli process via child_process spawn
app.get('/links-cli', (_req, res) => {
  res.type('text/plain');
  res.send("(todo: 'integrate link-cli process')\n");
});

// Export app for testing
export { app };
export default app;

// Start server only when run directly
const isMainModule =
  typeof import.meta.main !== 'undefined'
    ? import.meta.main
    : import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

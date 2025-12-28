import express from 'express';
import { Parser, formatLinks } from 'links-notation';
import { readLinoEnv } from 'lino-env';
import { LinkDBService, ILinks } from '@link-foundation/links-client';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory of current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from Links Notation env file
// If missing, defaults are used
const env = readLinoEnv('.lenv');
const PORT = Number(env.get('server.port')) || Number(process.env.PORT) || 3000;
const HOST = env.get('server.host') || process.env.HOST || '0.0.0.0';
const DB_PATH =
  env.get('db.path') ||
  process.env.DB_PATH ||
  path.join(__dirname, '../data/linkdb.links');

// Initialize LinkDB service
const linkdb = new LinkDBService(DB_PATH);
const ilinks = new ILinks(DB_PATH);

const app = express();
app.use(express.text({ type: ['text/plain', '*/*'] }));
app.use(express.json());

// Helper function to format links as Links Notation
function formatLinksAsLN(links) {
  if (!Array.isArray(links)) {
    links = [links];
  }
  return links
    .map((link) => `(${link.id}: ${link.source} ${link.target})`)
    .join('\n');
}

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

// ============================================================================
// Links CRUD API - REST-like endpoints using Links Notation
// ============================================================================

// GET /links - Read all links
app.get('/links', async (_req, res) => {
  res.type('text/plain');
  try {
    const links = await linkdb.readAllLinks();
    if (links.length === 0) {
      res.send('()\n');
    } else {
      res.send(`${formatLinksAsLN(links)}\n`);
    }
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// GET /links/:id - Read a specific link by ID
app.get('/links/:id', async (req, res) => {
  res.type('text/plain');
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).send("(error: 'invalid link id')\n");
    return;
  }

  try {
    const link = await linkdb.readLink(id);
    if (link) {
      res.send(`${formatLinksAsLN(link)}\n`);
    } else {
      res.status(404).send("(error: 'link not found')\n");
    }
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// POST /links - Create a new link
// Accepts Links Notation: (source target) or JSON: { "source": n, "target": m }
app.post('/links', async (req, res) => {
  res.type('text/plain');

  let source, target;

  try {
    // Try to parse as Links Notation first
    if (typeof req.body === 'string') {
      const parser = new Parser();
      const parsed = parser.parse(req.body);
      if (
        parsed.length > 0 &&
        parsed[0].values &&
        parsed[0].values.length >= 2
      ) {
        // links-notation returns objects with .id property for each value
        source = parseInt(parsed[0].values[0].id, 10);
        target = parseInt(parsed[0].values[1].id, 10);
      }
    } else if (typeof req.body === 'object' && req.body !== null) {
      // JSON format
      source = parseInt(req.body.source, 10);
      target = parseInt(req.body.target, 10);
    }

    if (isNaN(source) || isNaN(target)) {
      res
        .status(400)
        .send("(error: 'source and target required as integers')\n");
      return;
    }

    const link = await linkdb.createLink(source, target);
    res.status(201).send(`${formatLinksAsLN(link)}\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// PUT /links/:id - Update a link
// Accepts Links Notation: (source target) or JSON: { "source": n, "target": m }
app.put('/links/:id', async (req, res) => {
  res.type('text/plain');
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).send("(error: 'invalid link id')\n");
    return;
  }

  let source, target;

  try {
    // Try to parse as Links Notation first
    if (typeof req.body === 'string') {
      const parser = new Parser();
      const parsed = parser.parse(req.body);
      if (
        parsed.length > 0 &&
        parsed[0].values &&
        parsed[0].values.length >= 2
      ) {
        // links-notation returns objects with .id property for each value
        source = parseInt(parsed[0].values[0].id, 10);
        target = parseInt(parsed[0].values[1].id, 10);
      }
    } else if (typeof req.body === 'object' && req.body !== null) {
      // JSON format
      source = parseInt(req.body.source, 10);
      target = parseInt(req.body.target, 10);
    }

    if (isNaN(source) || isNaN(target)) {
      res
        .status(400)
        .send("(error: 'source and target required as integers')\n");
      return;
    }

    const link = await linkdb.updateLink(id, source, target);
    res.send(`${formatLinksAsLN(link)}\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// DELETE /links/:id - Delete a link
app.delete('/links/:id', async (req, res) => {
  res.type('text/plain');
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).send("(error: 'invalid link id')\n");
    return;
  }

  try {
    await linkdb.deleteLink(id);
    res.send('(deleted: ok)\n');
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// ============================================================================
// ILinks API - Universal flat API compatible with Platform.Data ILinks interface
// ============================================================================

// POST /ilinks/count - Count links matching restriction
app.post('/ilinks/count', async (req, res) => {
  res.type('text/plain');

  try {
    const restriction = req.body?.restriction || null;
    const count = await ilinks.count(restriction);
    res.send(`(count: ${count})\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// POST /ilinks/each - Iterate through links (returns all matching as array)
app.post('/ilinks/each', async (req, res) => {
  res.type('text/plain');

  try {
    const restriction = req.body?.restriction || null;
    const links = [];
    await ilinks.each(restriction, (link) => {
      links.push(link);
      return ilinks.getConstants().Continue;
    });

    if (links.length === 0) {
      res.send('()\n');
    } else {
      res.send(`${formatLinksAsLN(links)}\n`);
    }
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// POST /ilinks/create - Create a link using ILinks API
app.post('/ilinks/create', async (req, res) => {
  res.type('text/plain');

  try {
    const substitution = req.body?.substitution;
    if (
      !substitution ||
      !Array.isArray(substitution) ||
      substitution.length < 2
    ) {
      res
        .status(400)
        .send("(error: 'substitution must be array [source, target]')\n");
      return;
    }

    const id = await ilinks.create(substitution);
    const link = await linkdb.readLink(id);
    res.status(201).send(`${formatLinksAsLN(link)}\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// POST /ilinks/update - Update links matching restriction
app.post('/ilinks/update', async (req, res) => {
  res.type('text/plain');

  try {
    const { restriction, substitution } = req.body || {};

    if (!restriction || !Array.isArray(restriction)) {
      res.status(400).send("(error: 'restriction must be array')\n");
      return;
    }
    if (
      !substitution ||
      !Array.isArray(substitution) ||
      substitution.length < 2
    ) {
      res
        .status(400)
        .send("(error: 'substitution must be array [source, target]')\n");
      return;
    }

    const id = await ilinks.update(restriction, substitution);
    const link = await linkdb.readLink(id);
    res.send(`${formatLinksAsLN(link)}\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// POST /ilinks/delete - Delete links matching restriction
app.post('/ilinks/delete', async (req, res) => {
  res.type('text/plain');

  try {
    const restriction = req.body?.restriction;

    if (!restriction || !Array.isArray(restriction)) {
      res.status(400).send("(error: 'restriction must be array')\n");
      return;
    }

    const id = await ilinks.delete(restriction);
    res.send(`(deleted: ${id})\n`);
  } catch (e) {
    if (e.message.includes('clink command not found')) {
      res.status(503).send("(error: 'link-cli (clink) not installed')\n");
    } else {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  }
});

// ============================================================================
// Legacy endpoint for backward compatibility
// ============================================================================

// Deprecated - kept for backward compatibility
app.get('/links-cli', (_req, res) => {
  res.type('text/plain');
  res.send(
    "(notice: 'This endpoint is deprecated. Use /links for REST API or /ilinks for ILinks API.')\n"
  );
});

// Export app for testing
export { app, linkdb, ilinks };
export default app;

// Start server only when run directly
const isMainModule =
  typeof import.meta.main !== 'undefined'
    ? import.meta.main
    : import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`LinkDB path: ${DB_PATH}`);
  });
}

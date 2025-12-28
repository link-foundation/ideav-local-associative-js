/**
 * RecursiveLinks API Routes
 *
 * Provides endpoints for working with nested/recursive data structures
 * using the RecursiveLinks class from @link-foundation/links-client.
 *
 * This enables operations on nested arrays and objects with references,
 * converting between programming data structures and Links notation.
 */
import { Router } from 'express';
import { RecursiveLinks } from '@link-foundation/links-client';

/**
 * Create recursive links router
 * @param {string} dbPath - Path to the links database
 * @returns {Router} Express router for recursive links API
 */
export function createRecursiveLinksRouter(dbPath) {
  const router = Router();
  const recursiveLinks = new RecursiveLinks(dbPath);

  /**
   * POST /recursive/from-array
   * Create links from a nested array structure
   * Body: { "data": [[1, 2], [3, 4]] }
   * Returns: { "ids": [...] } or Links Notation format
   */
  router.post('/from-array', async (req, res) => {
    res.type('text/plain');

    try {
      const data = req.body?.data;
      if (!data || !Array.isArray(data)) {
        res
          .status(400)
          .send("(error: 'data must be a nested array structure')\n");
        return;
      }

      const ids = await recursiveLinks.createFromNestedArray(data);
      res.status(201).send(`(created: ${JSON.stringify(ids)})\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * POST /recursive/from-object
   * Create links from a nested object with references
   * Body: { "data": {"1": [1, 2], "2": [3, 4]} }
   * Returns: { "refMap": {...} }
   */
  router.post('/from-object', async (req, res) => {
    res.type('text/plain');

    try {
      const data = req.body?.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        res
          .status(400)
          .send("(error: 'data must be an object with references')\n");
        return;
      }

      const refMap = await recursiveLinks.createFromNestedObject(data);
      res.status(201).send(`(created: ${JSON.stringify(refMap)})\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * POST /recursive/to-array
   * Read links and return as nested array structure
   * Body: { "restriction": null | [id, source, target] }
   * Returns: Nested array structure
   */
  router.post('/to-array', async (req, res) => {
    res.type('text/plain');

    try {
      const restriction = req.body?.restriction || null;
      const result = await recursiveLinks.readAsNestedArray(restriction);
      res.send(`(data: ${JSON.stringify(result)})\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * POST /recursive/to-notation
   * Convert data structure to Links Notation string
   * Body: { "data": [[1, 2], [3, 4]] } or { "data": {"1": [1, 2]} }
   * Returns: Links notation string
   */
  router.post('/to-notation', async (req, res) => {
    res.type('text/plain');

    try {
      const data = req.body?.data;
      if (data === undefined || data === null) {
        res.status(400).send("(error: 'data is required')\n");
        return;
      }

      const notation = await recursiveLinks.toLinksNotation(data);
      res.send(`${notation}\n`);
    } catch (e) {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  });

  /**
   * POST /recursive/from-notation
   * Parse Links Notation string to nested array structure
   * Body: { "notation": "((1 2) (3 4))" }
   * Returns: Nested array structure
   */
  router.post('/from-notation', async (req, res) => {
    res.type('text/plain');

    try {
      const notation = req.body?.notation;
      if (!notation || typeof notation !== 'string') {
        res.status(400).send("(error: 'notation must be a string')\n");
        return;
      }

      const result = await recursiveLinks.parseLinksNotation(notation);
      res.send(`(data: ${JSON.stringify(result)})\n`);
    } catch (e) {
      res.status(500).send(`(error: '${String(e.message)}')\n`);
    }
  });

  /**
   * GET /recursive/ilinks
   * Get the underlying ILinks instance (for advanced operations)
   * Returns information about the underlying ILinks API
   */
  router.get('/ilinks', (_req, res) => {
    res.type('text/plain');
    const ilinks = recursiveLinks.getLinks();
    const constants = ilinks.getConstants();
    res.send(
      `(ilinks: (any: ${constants.Any}) (continue: ${String(constants.Continue)}) (break: ${String(constants.Break)}))\n`
    );
  });

  return router;
}

export default createRecursiveLinksRouter;

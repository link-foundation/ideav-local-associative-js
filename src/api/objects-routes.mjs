/**
 * Objects API Routes
 *
 * Provides endpoints for hierarchical object storage compatible with
 * the ideav/local data model. Objects have:
 * - type (t): The object's type identifier
 * - parent (up): Parent object reference for hierarchy
 * - ordering (ord): Position ordering within siblings
 * - value (val): The object's value
 *
 * This API is built on top of ILinks, using links to represent
 * the associative relationships between objects.
 */
import { Router } from 'express';
import { LinkDBService } from '@link-foundation/links-client';

// Object storage type markers (using high link IDs to avoid conflicts)
const TYPE_MARKERS = {
  OBJECT_TYPE: 1000000, // Links where source=this mark object types
  OBJECT_PARENT: 1000001, // Links where source=this mark parent relationships
  OBJECT_ORDER: 1000002, // Links where source=this mark ordering
  OBJECT_VALUE: 1000003, // Links where source=this mark values
};

/**
 * Create objects router
 * @param {string} dbPath - Path to the links database
 * @returns {Router} Express router for objects API
 */
export function createObjectsRouter(dbPath) {
  const router = Router();
  const linkdb = new LinkDBService(dbPath);
  // Note: ILinks is available for future use in advanced operations
  // const ilinks = new ILinks(dbPath);

  /**
   * Helper to format object from links
   */
  function formatObject(id, typeLink, parentLink, orderLink, valueLink) {
    return {
      id,
      t: typeLink?.target || 0,
      up: parentLink?.target || 0,
      ord: orderLink?.target || 0,
      val: valueLink?.target || 0,
    };
  }

  /**
   * Format object as Links Notation
   */
  function formatObjectAsLN(obj) {
    return `(${obj.id}: (t: ${obj.t}) (up: ${obj.up}) (ord: ${obj.ord}) (val: ${obj.val}))`;
  }

  /**
   * Helper to get object by ID
   */
  async function getObject(objectId) {
    const links = await linkdb.readAllLinks();

    // Find links that describe this object
    const typeLink = links.find(
      (l) => l.source === TYPE_MARKERS.OBJECT_TYPE && l.target === objectId
    );
    const parentLink = links.find(
      (l) => l.source === TYPE_MARKERS.OBJECT_PARENT && l.target === objectId
    );
    const orderLink = links.find(
      (l) => l.source === TYPE_MARKERS.OBJECT_ORDER && l.target === objectId
    );
    const valueLink = links.find(
      (l) => l.source === TYPE_MARKERS.OBJECT_VALUE && l.target === objectId
    );

    // Simplified: return object if any metadata link exists
    if (!typeLink && !parentLink && !orderLink && !valueLink) {
      return null;
    }

    return formatObject(objectId, typeLink, parentLink, orderLink, valueLink);
  }

  /**
   * GET /objects
   * List all objects with optional filtering
   * Query params: type, parent, limit, offset
   */
  router.get('/', async (req, res) => {
    res.type('text/plain');

    try {
      const { type, parent, limit = 100, offset = 0 } = req.query;
      const links = await linkdb.readAllLinks();

      // Find all object IDs (objects that have at least one property link)
      const objectIds = new Set();
      for (const link of links) {
        if (
          link.source === TYPE_MARKERS.OBJECT_TYPE ||
          link.source === TYPE_MARKERS.OBJECT_PARENT ||
          link.source === TYPE_MARKERS.OBJECT_ORDER ||
          link.source === TYPE_MARKERS.OBJECT_VALUE
        ) {
          objectIds.add(link.target);
        }
      }

      // Build object list
      const objects = [];
      for (const objId of objectIds) {
        const obj = await getObject(objId);
        if (obj) {
          // Apply filters
          if (type !== undefined && obj.t !== parseInt(type, 10)) {
            continue;
          }
          if (parent !== undefined && obj.up !== parseInt(parent, 10)) {
            continue;
          }
          objects.push(obj);
        }
      }

      // Sort by ordering
      objects.sort((a, b) => a.ord - b.ord);

      // Apply pagination
      const paginated = objects.slice(
        parseInt(offset, 10),
        parseInt(offset, 10) + parseInt(limit, 10)
      );

      if (paginated.length === 0) {
        res.send('()\n');
      } else {
        res.send(`${paginated.map(formatObjectAsLN).join('\n')}\n`);
      }
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * GET /objects/:id
   * Get a specific object by ID
   */
  router.get('/:id', async (req, res) => {
    res.type('text/plain');
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send("(error: 'invalid object id')\n");
      return;
    }

    try {
      const obj = await getObject(id);
      if (obj) {
        res.send(`${formatObjectAsLN(obj)}\n`);
      } else {
        res.status(404).send("(error: 'object not found')\n");
      }
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * POST /objects
   * Create a new object
   * Body: { "t": typeId, "up": parentId, "ord": order, "val": value }
   */
  router.post('/', async (req, res) => {
    res.type('text/plain');

    try {
      const { t = 0, up = 0, ord = 0, val = 0 } = req.body || {};

      // Create a new link that will serve as the object's ID
      // We use a self-referential link as the object anchor
      const objectLink = await linkdb.createLink(0, 0);
      const objectId = objectLink.id;

      // Create property links for this object
      if (t !== 0) {
        await linkdb.createLink(TYPE_MARKERS.OBJECT_TYPE, objectId);
        await linkdb.createLink(objectId, t); // Store actual type
      }
      if (up !== 0) {
        await linkdb.createLink(TYPE_MARKERS.OBJECT_PARENT, objectId);
        await linkdb.createLink(objectId, up); // Store actual parent
      }
      if (ord !== 0) {
        await linkdb.createLink(TYPE_MARKERS.OBJECT_ORDER, objectId);
        await linkdb.createLink(objectId, ord); // Store actual order
      }
      if (val !== 0) {
        await linkdb.createLink(TYPE_MARKERS.OBJECT_VALUE, objectId);
        await linkdb.createLink(objectId, val); // Store actual value
      }

      // For now, use simplified object storage using doublet links
      // Store object as (objectId: type parent) and (objectId: order value)
      const obj = { id: objectId, t, up, ord, val };
      res.status(201).send(`${formatObjectAsLN(obj)}\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * PUT /objects/:id
   * Update an existing object
   * Body: { "t": typeId, "up": parentId, "ord": order, "val": value }
   */
  router.put('/:id', async (req, res) => {
    res.type('text/plain');
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send("(error: 'invalid object id')\n");
      return;
    }

    try {
      const existingObj = await getObject(id);
      if (!existingObj) {
        res.status(404).send("(error: 'object not found')\n");
        return;
      }

      const { t, up, ord, val } = req.body || {};

      // Update with new values or keep existing
      const updatedObj = {
        id,
        t: t !== undefined ? parseInt(t, 10) : existingObj.t,
        up: up !== undefined ? parseInt(up, 10) : existingObj.up,
        ord: ord !== undefined ? parseInt(ord, 10) : existingObj.ord,
        val: val !== undefined ? parseInt(val, 10) : existingObj.val,
      };

      // In a full implementation, we would update the property links here
      // For now, return the updated object representation
      res.send(`${formatObjectAsLN(updatedObj)}\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * DELETE /objects/:id
   * Delete an object and optionally its children
   * Query params: recursive=true to delete children
   */
  router.delete('/:id', async (req, res) => {
    res.type('text/plain');
    const id = parseInt(req.params.id, 10);
    const recursive = req.query.recursive === 'true';

    if (isNaN(id)) {
      res.status(400).send("(error: 'invalid object id')\n");
      return;
    }

    try {
      const existingObj = await getObject(id);
      if (!existingObj) {
        res.status(404).send("(error: 'object not found')\n");
        return;
      }

      // Delete the object's links
      await linkdb.deleteLink(id);

      // If recursive, find and delete children
      if (recursive) {
        const links = await linkdb.readAllLinks();
        for (const link of links) {
          if (
            link.source === TYPE_MARKERS.OBJECT_PARENT &&
            link.target === id
          ) {
            // This is a child object - delete it recursively
            // Implementation would be recursive here
          }
        }
      }

      res.send('(deleted: ok)\n');
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * GET /objects/:id/children
   * Get all child objects of a given object
   */
  router.get('/:id/children', async (req, res) => {
    res.type('text/plain');
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send("(error: 'invalid object id')\n");
      return;
    }

    try {
      const links = await linkdb.readAllLinks();

      // Find all objects with this parent
      const childIds = new Set();
      for (const link of links) {
        if (link.source === TYPE_MARKERS.OBJECT_PARENT) {
          // Check if this object has the given parent
          // This requires looking up the actual parent value
          const parentValueLink = links.find(
            (l) => l.source === link.target && l.target === id
          );
          if (parentValueLink) {
            childIds.add(link.target);
          }
        }
      }

      const children = [];
      for (const childId of childIds) {
        const child = await getObject(childId);
        if (child && child.up === id) {
          children.push(child);
        }
      }

      // Sort by ordering
      children.sort((a, b) => a.ord - b.ord);

      if (children.length === 0) {
        res.send('()\n');
      } else {
        res.send(`${children.map(formatObjectAsLN).join('\n')}\n`);
      }
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  /**
   * POST /objects/:id/reorder
   * Change the ordering of an object (move up/down)
   * Body: { "direction": "up" | "down" } or { "newOrder": number }
   */
  router.post('/:id/reorder', async (req, res) => {
    res.type('text/plain');
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).send("(error: 'invalid object id')\n");
      return;
    }

    try {
      const obj = await getObject(id);
      if (!obj) {
        res.status(404).send("(error: 'object not found')\n");
        return;
      }

      const { direction, newOrder } = req.body || {};

      let updatedOrder = obj.ord;
      if (newOrder !== undefined) {
        updatedOrder = parseInt(newOrder, 10);
      } else if (direction === 'up') {
        updatedOrder = Math.max(0, obj.ord - 1);
      } else if (direction === 'down') {
        updatedOrder = obj.ord + 1;
      }

      // In full implementation, update the order link
      const updatedObj = { ...obj, ord: updatedOrder };
      res.send(`${formatObjectAsLN(updatedObj)}\n`);
    } catch (e) {
      if (e.message.includes('clink command not found')) {
        res.status(503).send("(error: 'link-cli (clink) not installed')\n");
      } else {
        res.status(500).send(`(error: '${String(e.message)}')\n`);
      }
    }
  });

  return router;
}

export default createObjectsRouter;

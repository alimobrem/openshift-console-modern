/**
 * Lightweight mock Agent API server for E2E tests.
 * Provides in-memory views CRUD, health, and version endpoints.
 */

import { createServer } from 'http';
import { randomUUID } from 'crypto';

/** @type {Map<string, object>} In-memory view store */
const views = new Map();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // Health
  if (path === '/healthz') return json(res, 200, { status: 'ok' });
  if (path === '/health') return json(res, 200, { status: 'ok', circuit_breaker: 'closed', errors: { total: 0 } });

  // Version
  if (path === '/version') return json(res, 200, { version: '1.13.1', protocol: '2', tools: 72, scanners: 16 });

  // Tools
  if (path === '/tools') return json(res, 200, { sre: [], security: [] });

  // Views CRUD
  if (path === '/views' && method === 'GET') {
    return json(res, 200, { views: [...views.values()] });
  }

  if (path === '/views' && method === 'POST') {
    const body = await readBody(req);
    const id = `cv-${randomUUID()}`;
    const view = {
      id,
      title: body.title || 'Untitled',
      description: body.description || '',
      layout: body.layout || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    views.set(id, view);
    return json(res, 201, view);
  }

  // /views/:id
  const viewMatch = path.match(/^\/views\/([^/]+)$/);
  if (viewMatch) {
    const id = viewMatch[1];

    if (method === 'GET') {
      const view = views.get(id);
      return view ? json(res, 200, view) : json(res, 404, { error: 'Not found' });
    }

    if (method === 'PUT') {
      const view = views.get(id);
      if (!view) return json(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      Object.assign(view, body, { updated_at: new Date().toISOString() });
      return json(res, 200, { updated: true, view });
    }

    if (method === 'DELETE') {
      if (!views.has(id)) return json(res, 404, { error: 'Not found' });
      views.delete(id);
      return json(res, 200, { deleted: true });
    }
  }

  // /views/:id/share
  const shareMatch = path.match(/^\/views\/([^/]+)\/share$/);
  if (shareMatch && method === 'POST') {
    const id = shareMatch[1];
    if (!views.has(id)) return json(res, 404, { error: 'Not found' });
    return json(res, 200, { share_token: `mock-token-${id}`, view_id: id, expires_in: 86400 });
  }

  // /views/:id/clone
  const cloneMatch = path.match(/^\/views\/([^/]+)\/clone$/);
  if (cloneMatch && method === 'POST') {
    const id = cloneMatch[1];
    const original = views.get(id);
    if (!original) return json(res, 404, { error: 'Not found' });
    const newId = randomUUID();
    const clone = { ...original, id: newId, title: `${original.title} (Copy)`, created_at: new Date().toISOString() };
    views.set(newId, clone);
    return json(res, 201, clone);
  }

  // /views/:id/versions
  const versionsMatch = path.match(/^\/views\/([^/]+)\/versions$/);
  if (versionsMatch && method === 'GET') {
    return json(res, 200, { versions: [] });
  }

  // /views/claim/:token
  const claimMatch = path.match(/^\/views\/claim\/(.+)$/);
  if (claimMatch && method === 'POST') {
    return json(res, 200, { claimed: true, view_id: 'mock-claimed-view' });
  }

  // Briefing
  if (path === '/briefing') return json(res, 200, { greeting: 'Good morning', summary: 'All systems nominal', actions_count: 0, investigations_count: 0 });

  // Fix history
  if (path === '/fix-history') return json(res, 200, { actions: [], total: 0, page: 1 });

  // Predictions
  if (path === '/predictions') return json(res, 200, []);

  // Memory endpoints
  if (path === '/memory/stats') return json(res, 200, { incidents: 0, runbooks: 0, patterns: 0 });
  if (path === '/memory/runbooks') return json(res, 200, { runbooks: [] });
  if (path === '/memory/incidents') return json(res, 200, { incidents: [] });
  if (path === '/memory/patterns') return json(res, 200, { patterns: [] });

  // Monitor capabilities
  if (path === '/monitor/capabilities') return json(res, 200, { max_trust_level: 3, categories: ['crashloop', 'workloads'] });

  // Eval
  if (path === '/eval/status') return json(res, 200, { quality_gate_passed: true });

  // Fallback
  json(res, 404, { error: `Not found: ${method} ${path}` });
});

server.listen(8080, () => {
  console.log('Mock agent server listening on http://localhost:8080');
});

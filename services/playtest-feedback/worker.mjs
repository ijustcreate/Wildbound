const gameOrigin = 'https://ijustcreate.github.io';
const feedbackPath = '/api/feedback';
const versionPattern = /^\d{1,5}\.\d{1,5}\.\d{1,5}$/;
const reportIdPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const categories = new Set(['bug', 'feedback']);
const screens = new Set(['home', 'lobby', 'play', 'workshop']);

function reply(body, status, allowOrigin) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  });
  if (allowOrigin) {
    headers.set('Access-Control-Allow-Origin', gameOrigin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return body ? Response.json(body, { status, headers }) : new Response(null, { status, headers });
}

async function readReport(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let length = 0, body = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12288) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  const report = JSON.parse(body + decoder.decode());
  const message = typeof report?.message === 'string' && report.message.trim();
  if (!message || message.length > 2400 || !categories.has(report.category) || !screens.has(report.screen) ||
    typeof report.id !== 'string' || !reportIdPattern.test(report.id) ||
    typeof report.version !== 'string' || !versionPattern.test(report.version)) return null;
  return { id: report.id, message, category: report.category, screen: report.screen, version: report.version };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== feedbackPath) return reply({ error: 'Not found.' }, 404, false);
    if (request.headers.get('Origin') !== gameOrigin) return reply({ error: 'Open feedback from Wildbound.' }, 403, false);
    if (request.method === 'OPTIONS') return reply(null, 204, true);
    if (request.method !== 'POST') return reply({ error: 'Use POST to send feedback.' }, 405, true);
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
      return reply({ error: 'Invalid report format.' }, 415, true);
    }
    const report = await readReport(request).catch(() => null);
    if (!report) return reply({ error: 'Check the report and try again.' }, 400, true);

    const now = Date.now();
    try {
      const result = await env.DB.prepare(`
        INSERT INTO playtest_reports (id, category, message, game_version, game_screen, created_at)
        SELECT ?, ?, ?, ?, ?, ?
        WHERE (SELECT count(*) FROM playtest_reports WHERE created_at >= ?) < 240
        ON CONFLICT(id) DO NOTHING
      `).bind(report.id, report.category, report.message, report.version, report.screen, now, now - 3600000).run();
      if (result.meta.changes === 0) {
        const existing = await env.DB.prepare('SELECT id FROM playtest_reports WHERE id = ?').bind(report.id).first();
        if (!existing) return reply({ error: 'The inbox is busy. Please try again later.' }, 429, true);
      }
      return reply({ received: true }, 200, true);
    } catch {
      return reply({ error: 'Could not save your report. Please try again.' }, 503, true);
    }
  },
};

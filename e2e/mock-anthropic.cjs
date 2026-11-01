// A stand-in for Claude's Messages API, for testing the assistant without a key or a network.
// It checks the request the way the real service would (key header, version header, documents with citations enabled)
// and answers with the response shape documented for custom-content citations (content_block_location).
// It is NOT Claude: it only proves that our code sends a well-formed request and checks the reply properly.
const http = require('http');

function startMock({ port, expectedKey }) {
  const requests = [];
  let mode = 'ok';
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const record = { method: req.method, url: req.url, headers: req.headers, body: null, authorised: false };
      try {
        record.body = JSON.parse(raw);
      } catch {
        record.body = null;
      }
      requests.push(record);
      const send = (status, json) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(typeof json === 'string' ? json : JSON.stringify(json));
      };
      if (req.method !== 'POST' || req.url !== '/v1/messages') return send(404, { error: { message: 'not found' } });
      if (req.headers['x-api-key'] !== expectedKey) return send(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
      if (req.headers['anthropic-version'] !== '2023-06-01') return send(400, { type: 'error', error: { type: 'invalid_request_error', message: 'bad version' } });
      record.authorised = true;
      const body = record.body;
      const content = body && body.messages && body.messages[0] && body.messages[0].content;
      const docs = Array.isArray(content) ? content.filter((c) => c.type === 'document') : [];
      if (!docs.length || !docs.every((d) => d.citations && d.citations.enabled === true && d.source && d.source.type === 'content')) {
        return send(400, { type: 'error', error: { type: 'invalid_request_error', message: 'documents must have citations enabled' } });
      }
      const cite = (i = 0, s = 0, e = 1) => ({ type: 'content_block_location', cited_text: 'ignored', document_index: i, document_title: docs[i] ? docs[i].title : '', start_block_index: s, end_block_index: e });
      const delay = mode === 'slow' ? 700 : 0;
      setTimeout(() => {
        switch (mode) {
          case 'error500':
            return send(500, { type: 'error', error: { type: 'api_error', message: 'Overloaded: your credit balance is too low, org_secret_123' } });
          case 'badjson':
            return send(200, 'this is not json');
          case 'refusal':
            return send(200, { stop_reason: 'refusal', content: [] });
          case 'nocitation':
            return send(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: 'A confident answer that cites nothing.' }] });
          case 'badcitation':
            return send(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: 'An answer pointing at a document that was never sent.', citations: [cite(99, 0, 1)] }] });
          case 'hostile':
            return send(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script> **bold**', citations: [cite()] }] });
          case 'long':
            return send(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: `Long ${'x'.repeat(400)} end`, citations: [cite()] }] });
          default:
            return send(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Mock answer from ' }, { type: 'text', text: `"${docs[0].title}".`, citations: [cite(0, 0, 1)] }] });
        }
      }, delay);
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, requests, setMode: (m) => (mode = m), close: () => new Promise((r) => server.close(r)) })));
}

module.exports = { startMock };

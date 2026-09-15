const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};
const store = globalThis.__CRAXXY_CHAT__ || (globalThis.__CRAXXY_CHAT__ = new Map());
const clean = value => String(value || '').replace(/[<>]/g, '').slice(0, 600);
exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  const room = clean(event.queryStringParameters?.room || 'craxxy-main').slice(0, 40) || 'craxxy-main';
  if (!store.has(room)) store.set(room, []);
  const list = store.get(room);
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const msg = {
        id: clean(body.id || `${Date.now()}-${Math.random()}`),
        user: clean(body.user || 'Guest').slice(0, 24),
        text: clean(body.text || ''),
        time: Number(body.time || Date.now())
      };
      if (msg.text) list.push(msg);
      while (list.length > 200) list.shift();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, messages: list }) };
    } catch (error) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'invalid_json' }) };
    }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, room, messages: list }) };
};
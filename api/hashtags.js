import { hashtags } from '../server/gemini.mjs';
import { parseJson, sendJson } from '../server/api-helpers.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  try {
    const body = await parseJson(req);
    const result = await hashtags(body);
    return sendJson(res, 200, result);
  } catch (err) {
    console.error(err);
    return sendJson(res, err.statusCode || 500, { error: err.message || 'hashtags failed' });
  }
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generate, hashtags, vision } from './gemini.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.post('/api/vision', async (req, res) => {
  try {
    const result = await vision(req.body || {});
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'vision failed' });
  }
});

app.post('/api/hashtags', async (req, res) => {
  try {
    const result = await hashtags(req.body || {});
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'hashtags failed' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const result = await generate(req.body || {});
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'generate failed' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

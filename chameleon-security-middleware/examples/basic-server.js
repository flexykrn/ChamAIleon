/**
 * Basic Example - Express Server with Chameleon Security Middleware
 */

import express from 'express';
import { ChameleonDefense } from '../src/index.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Chameleon Defense
const defense = new ChameleonDefense({
  mlApiUrl: 'https://chameleon-defence-api.onrender.com/analyze',
  confidenceThreshold: 0.7,
  responseMode: 'adaptive',
  delayEnabled: true
});

// Apply middleware
app.use(defense.middleware());

// Test endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Server protected by Chameleon Security Middleware' });
});

app.get('/api/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob', 'Charlie'] });
});

app.post('/api/search', (req, res) => {
  res.json({ results: [], query: req.body.q });
});

app.get('/stats', async (req, res) => {
  const stats = await defense.getStats();
  res.json(stats);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🦎 Chameleon-protected server running on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/api/users?id=1`);
  console.log(`Suspicious test: curl "http://localhost:${PORT}/api/users?id=1' OR '1'='1"`);
});

// Vercel serverless entry — delegates every request to the Express app.
import app from '../src/app.js';

export default function handler(req, res) {
  return app(req, res);
}

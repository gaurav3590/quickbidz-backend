import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Test endpoint called:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  });

  res.status(200).json({
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    method: req.method,
    url: req.url,
  });
}

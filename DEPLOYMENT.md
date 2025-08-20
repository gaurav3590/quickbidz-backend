# QuickBidz Backend Deployment Guide

## Vercel Deployment Setup

This project is configured for deployment on Vercel using serverless functions.

### File Structure
```
├── api/
│   └── index.ts          # Vercel serverless function entry point
├── src/
│   ├── main.ts           # Local development entry point
│   └── app.controller.ts # API endpoints
└── vercel.json           # Vercel configuration
```

### API Endpoints

After deployment, your API endpoints will be available at:

- **Root endpoint**: `https://your-domain.vercel.app/`
- **Test endpoint**: `https://your-domain.vercel.app/test`
- **Debug endpoint**: `https://your-domain.vercel.app/debug`
- **Health check**: `https://your-domain.vercel.app/health`
- **API endpoints**: `https://your-domain.vercel.app/api/*`
- **Swagger docs**: `https://your-domain.vercel.app/api/docs`

### Troubleshooting

If you get a "NOT_FOUND" error:

1. **Check the deployment logs** in Vercel dashboard
2. **Verify the endpoint URL** - make sure you're using the correct path
3. **Test the debug endpoint** first: `/debug`
4. **Check environment variables** are properly set in Vercel

### Local Development

For local development, use:
```bash
npm run start:dev
```

The local server will run on `http://localhost:3005`

### Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables

Make sure these are set in Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`

### Common Issues

1. **NOT_FOUND Error**: Usually means the route isn't properly configured
2. **Timeout Error**: Increase `maxDuration` in vercel.json
3. **Database Connection**: Ensure DATABASE_URL is correct
4. **CORS Issues**: Check CORS configuration in main.ts 
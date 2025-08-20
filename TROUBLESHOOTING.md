# Troubleshooting NOT_FOUND Error

## Quick Test Steps

After deploying, test these endpoints in order:

1. **Simple Health Check**: `https://your-domain.vercel.app/api/health`
2. **Simple Test**: `https://your-domain.vercel.app/api/test`
3. **Main App**: `https://your-domain.vercel.app/api/`

## Expected Responses

### Health Check (`/api/health`)
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "nodeVersion": "v20.11.0",
  "platform": "linux"
}
```

### Test Endpoint (`/api/test`)
```json
{
  "message": "Test endpoint is working!",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "environment": "production",
  "method": "GET",
  "url": "/api/test",
  "path": "/api/test"
}
```

## Debugging Steps

### 1. Check Vercel Deployment Logs
- Go to your Vercel dashboard
- Click on your project
- Go to "Functions" tab
- Check for any error messages

### 2. Verify Environment Variables
Make sure these are set in Vercel:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`

### 3. Check Build Logs
- Look for any build errors
- Verify all dependencies are installed
- Check if Prisma client is generated

### 4. Test Local Development
```bash
npm run start:dev
```
Then test: `http://localhost:3005/test`

### 5. Common Issues

#### Issue: Still getting NOT_FOUND
**Solution**: 
- Check if the deployment completed successfully
- Verify the function files are in the correct location (`api/` folder)
- Try accessing the simple endpoints first (`/api/health`, `/api/test`)

#### Issue: Database Connection Error
**Solution**:
- Verify `DATABASE_URL` is correct
- Check if database is accessible from Vercel's servers
- Ensure SSL is configured if required

#### Issue: CORS Error
**Solution**:
- Check CORS configuration in `api/index.ts`
- Verify frontend URL is allowed

#### Issue: Timeout Error
**Solution**:
- Increase `maxDuration` in `vercel.json`
- Optimize database queries
- Use connection pooling

## File Structure Check

Make sure your project has this structure:
```
├── api/
│   ├── index.ts      # Main NestJS app
│   ├── test.ts       # Simple test endpoint
│   └── health.ts     # Health check
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── vercel.json
└── package.json
```

## Next Steps

1. **Deploy the changes**
2. **Test the simple endpoints first** (`/api/health`, `/api/test`)
3. **Check Vercel logs** for any errors
4. **If simple endpoints work**, the issue is with the main NestJS app
5. **If simple endpoints fail**, there's a basic configuration issue

## Support

If you're still having issues:
1. Check Vercel documentation: https://vercel.com/docs
2. Review the deployment logs in Vercel dashboard
3. Test with the simple endpoints to isolate the problem

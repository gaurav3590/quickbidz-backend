# QuickBidz Backend - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Database**: Set up a production database (PostgreSQL recommended)
4. **Environment Variables**: Prepare all required environment variables

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Email Configuration (if using email features)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Cloudinary Configuration (if using image upload)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Firebase Configuration (if using push notifications)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Optional Configuration
```
PORT=4000
NODE_ENV=production
```

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### 4. Alternative: Deploy via GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

## Database Setup

### For Production Database:

1. **Set up a PostgreSQL database** (recommended options):
   - [Neon](https://neon.tech) (PostgreSQL with serverless)
   - [Supabase](https://supabase.com) (PostgreSQL with additional features)
   - [Railway](https://railway.app) (PostgreSQL hosting)
   - [PlanetScale](https://planetscale.com) (MySQL compatible)

2. **Run migrations**:
   ```bash
   # Set DATABASE_URL in your environment
   npx prisma migrate deploy
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

## Post-Deployment

### 1. Verify Deployment
- Check your API endpoints at `https://your-project.vercel.app`
- Test Swagger documentation at `https://your-project.vercel.app/api/docs`

### 2. Update Frontend Configuration
Update your frontend application to use the new Vercel URL:
```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

### 3. Monitor Logs
- Use Vercel dashboard to monitor function logs
- Set up error tracking (Sentry, etc.)

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure `vercel-build` script works locally

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Vercel's servers
   - Ensure SSL is configured if required

3. **Environment Variables**:
   - Double-check all required variables are set in Vercel dashboard
   - Redeploy after adding new environment variables

4. **CORS Issues**:
   - Update CORS origin in `main.ts` to match your frontend URL
   - Redeploy after CORS changes

### Performance Optimization:

1. **Database Connection Pooling**: Consider using connection pooling for better performance
2. **Caching**: Implement Redis or similar for session/query caching
3. **CDN**: Use Vercel's edge functions for static assets

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Database Security**: Use strong passwords and enable SSL
3. **JWT Secrets**: Use cryptographically secure random strings
4. **CORS**: Restrict origins to your frontend domain only
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Monitoring and Maintenance

1. **Health Checks**: Implement health check endpoints
2. **Logging**: Use structured logging for better debugging
3. **Backups**: Set up regular database backups
4. **Updates**: Keep dependencies updated regularly

## Support

For issues specific to this deployment:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review NestJS serverless deployment: [docs.nestjs.com](https://docs.nestjs.com)
- Check Prisma deployment guide: [prisma.io/docs](https://prisma.io/docs) 
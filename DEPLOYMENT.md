# Vercel Deployment Guide for NovaAuth

## Prerequisites
- Vercel account (https://vercel.com)
- Git repository pushed to GitHub, GitLab, or Bitbucket
- Environment variables properly configured

## Deployment Steps

### 1. Connect Repository to Vercel
- Go to https://vercel.com/new
- Import your Git repository
- Select the root folder (where `vercel.json` is located)

### 2. Environment Variables
Add these environment variables in Vercel Project Settings > Environment Variables:

**Backend (Required):**
```
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
NODE_ENV=production
CLIENT_URL=https://yourdomain.vercel.app (or your custom domain)

# Email Configuration (Brevo)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_email
BREVO_SMTP_PASS=your_brevo_password
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_email@example.com

# Optional: Google OAuth
GOOGLE_USER=your_google_email
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

**Frontend (Optional):**
```
VITE_API_BASE_URL=/api (defaults to this if not set)
```

### 3. Automatic Deployment
Once configured, every push to your main branch will trigger a deployment:
- Frontend will be built to `Frontend/dist`
- API routes will be served via serverless functions in `api/`

### 4. Custom Domain (Optional)
In Vercel Dashboard > Settings > Domains:
- Add your custom domain
- Follow DNS configuration steps

## Deployment Configuration Files

### vercel.json
- Specifies build command: `cd Frontend && npm run build`
- Output directory: `Frontend/dist`
- Routes API calls to serverless functions
- Routes SPA requests to `index.html` for client-side routing

### .vercelignore
- Excludes unnecessary files from deployment
- Reduces build time and deployment size

## Troubleshooting

### API Calls Failing
- Check MongoDB connection string in `MONGO_URI`
- Verify `JWT_SECRET` is set
- Ensure `CLIENT_URL` matches your domain
- Check browser DevTools > Network tab for API response errors

### Frontend Not Loading
- Verify `outputDirectory` is correctly set to `Frontend/dist`
- Check browser console for JavaScript errors
- Ensure frontend builds locally: `cd Frontend && npm run build`

### CORS Errors
- Verify `CLIENT_URL` is correctly set in environment variables
- Check that credentials are being sent with requests

### Database Connection Issues
- Whitelist Vercel IP range in MongoDB Atlas (or allow all IPs for development)
- Verify MongoDB connection string is correct
- Check environment variable is properly set

## Local Testing Before Deployment

### Test Build
```bash
cd Frontend
npm run build
npm run preview
```

### Test API
```bash
cd Backend
npm install
npm start
```

## Database Backups
- Regular backups are recommended for production
- Use MongoDB Atlas backup features
- Consider setting up automated backups

## Performance Optimization

### Frontend
- Vite automatically optimizes the build
- Check `Frontend/dist` for bundle sizes
- Consider code splitting for large apps

### Backend
- Database queries are cached appropriately
- Connection pooling is handled by MongoDB driver
- Consider adding caching layer (Redis) for frequently accessed data

## Environment Variable Security
- Never commit `.env` files to Git
- All sensitive data should be in Vercel environment variables
- Rotate JWT_SECRET and other secrets periodically
- Use strong, unique passwords for database and email credentials

## Monitoring & Logs
- Vercel provides function logs in Dashboard
- Monitor API response times and error rates
- Set up alerts for deployment failures
- Consider adding external monitoring service (Datadog, New Relic, etc.)

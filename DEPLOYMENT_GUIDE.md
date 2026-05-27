# TalentStage Deployment Guide

This guide explains how to deploy your TalentStage application to Vercel (Frontend) and Heroku (Backend).

## Prerequisites

Before deploying, make sure you have:
- Git repository initialized and pushed to GitHub
- Vercel account (https://vercel.com)
- Heroku account (https://www.heroku.com)
- Heroku CLI installed locally (optional but recommended)

## Frontend Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add Environment Variables:
   - `VITE_GROQ_API_KEY`: Your Groq API key
   - `VITE_API_URL`: Your Heroku backend URL (e.g., `https://your-app-name.herokuapp.com/api`)
   - `VITE_USE_API`: `true`
6. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
cd frontend
npm i -g vercel
vercel
# Follow the prompts to link and deploy
```

### Step 3: Update Frontend Environment
After getting your Vercel URL, set the `VITE_API_URL` to your backend Heroku URL:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Update `VITE_API_URL` to `https://your-heroku-app.herokuapp.com/api`
- Trigger a redeploy

## Backend Deployment to Heroku

### Step 1: Install Heroku CLI
```bash
# If not already installed
npm install -g heroku
```

### Step 2: Login to Heroku
```bash
heroku login
# Opens browser to authenticate
```

### Step 3: Create Heroku App
```bash
cd backend
heroku create your-app-name
```

### Step 4: Add Procfile (Already Created)
The `Procfile` is already in your backend directory and includes:
```
web: npm start
release: npx prisma db push
```

### Step 5: Set Environment Variables on Heroku
```bash
# Generate a strong JWT secret (use an online generator)
heroku config:set JWT_SECRET="your-strong-random-secret"

# Add your Groq API key
heroku config:set GROQ_API_KEY="your-groq-api-key"

# Set CORS origin to your Vercel frontend URL
heroku config:set CORS_ORIGIN="https://your-frontend.vercel.app"

# Add PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev
# Heroku will automatically set DATABASE_URL
```

### Step 6: Deploy to Heroku
```bash
git push heroku main
# Or if deploying from main branch:
git push heroku HEAD:main
```

### Step 7: Verify Deployment
```bash
# Check logs
heroku logs --tail

# Check that database migrations ran
heroku run "npm run db:seed"

# Test health endpoint
curl https://your-app-name.herokuapp.com/api/health
```

## Environment Variables Summary

### Frontend (.env in Vercel)
```
VITE_GROQ_API_KEY=your-groq-api-key
VITE_API_URL=https://your-heroku-app.herokuapp.com/api
VITE_USE_API=true
```

### Backend (.env in Heroku)
```
DATABASE_URL=postgresql://... (auto-set by Heroku)
JWT_SECRET=your-strong-random-secret
PORT=3000 (auto-set by Heroku)
CORS_ORIGIN=https://your-frontend.vercel.app
GROQ_API_KEY=your-groq-api-key
```

## Troubleshooting

### Frontend Issues
- **Blank page**: Check browser console for CORS errors
- **API calls failing**: Verify `VITE_API_URL` is correct and backend is running
- **Build failing**: Check `npm run build` works locally first

### Backend Issues
- **Database errors**: Run `heroku run npm run db:setup` to initialize database
- **Port issues**: Don't set PORT in Heroku, it's auto-assigned
- **CORS errors**: Verify `CORS_ORIGIN` matches your frontend URL exactly (with https://)

## Connecting Frontend to Backend

Make sure your frontend's API calls use the correct base URL:

### Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API Base: `http://localhost:3001/api`

### Production
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.herokuapp.com`
- API Base: `https://your-app.herokuapp.com/api`

Update your frontend code to use the environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL;
// or
const API_BASE_URL = process.env.VITE_API_URL || '/api';
```

## Next Steps

1. Deploy backend to Heroku first
2. Get your Heroku URL
3. Deploy frontend to Vercel with the correct API URL
4. Test the full application
5. Monitor logs and performance

## Useful Commands

```bash
# Heroku
heroku logs --tail                    # View live logs
heroku logs --num=100                 # View last 100 lines
heroku config                         # View all env vars
heroku restart                        # Restart app
heroku open                           # Open app in browser

# Git
git push heroku main                  # Deploy to Heroku
git push origin main                  # Push to GitHub
```

## Resources

- Vercel Docs: https://vercel.com/docs
- Heroku Docs: https://devcenter.heroku.com
- Prisma Database: https://www.prisma.io/docs/orm/overview

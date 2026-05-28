#!/bin/bash
# TalentStage Heroku Setup Script
# This script helps you deploy the backend to Heroku

echo "====================================="
echo "TalentStage - Heroku Deployment Setup"
echo "====================================="
echo ""

# Step 1: Install Heroku CLI
echo "Step 1: Installing/Updating Heroku CLI..."
npm install -g heroku
echo "✓ Heroku CLI ready"
echo ""

# Step 2: Login to Heroku
echo "Step 2: Logging into Heroku..."
heroku login
echo "✓ Logged into Heroku"
echo ""

# Step 3: Create app name
echo "Step 3: Create your app"
read -p "Enter your app name (e.g., talentstage-api): " APP_NAME

# Step 4: Create the app
echo "Creating Heroku app: $APP_NAME..."
heroku create $APP_NAME --region us
echo "✓ App created"
echo ""

# Step 5: Set environment variables
echo "Step 5: Setting environment variables..."
echo ""

read -p "Enter your JWT Secret (or press Enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Auto-generated JWT Secret: $JWT_SECRET"
fi
heroku config:set JWT_SECRET="$JWT_SECRET" -a $APP_NAME

read -p "Enter your Groq API Key: " GROQ_API_KEY
heroku config:set GROQ_API_KEY="$GROQ_API_KEY" -a $APP_NAME

read -p "Enter your frontend URL (e.g., https://talentstage.vercel.app): " CORS_ORIGIN
heroku config:set CORS_ORIGIN="$CORS_ORIGIN" -a $APP_NAME

echo "✓ Environment variables set"
echo ""

# Step 6: Add PostgreSQL database
echo "Step 6: Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:hobby-dev -a $APP_NAME
echo "✓ Database created"
echo ""

# Step 7: Deploy
echo "Step 7: Deploying to Heroku..."
git push heroku main
echo "✓ Deployment complete!"
echo ""

# Step 8: Run migrations
echo "Step 8: Running database migrations..."
heroku run npm run db:setup -a $APP_NAME
echo "✓ Database setup complete"
echo ""

echo "====================================="
echo "✓ Deployment successful!"
echo "====================================="
echo ""
echo "Your backend is now live at:"
echo "https://${APP_NAME}.herokuapp.com"
echo ""
echo "Update your frontend VITE_API_URL to:"
echo "https://${APP_NAME}.herokuapp.com/api"

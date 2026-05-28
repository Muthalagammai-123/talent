@echo off
REM TalentStage Heroku Setup Script for Windows PowerShell
REM This script helps you deploy the backend to Heroku

echo =====================================
echo TalentStage - Heroku Deployment Setup
echo =====================================
echo.

REM Step 1: Install Heroku CLI
echo Step 1: Installing/Updating Heroku CLI...
echo Installing via npm...
cmd /c npm install -g heroku
echo ✓ Heroku CLI installed
echo.

REM Step 2: Create app
echo Step 2: Create Heroku App
set /p APP_NAME="Enter your app name (e.g., talentstage-api): "

echo Creating Heroku app: %APP_NAME%...
cmd /c heroku create %APP_NAME%
echo ✓ App created: https://%APP_NAME%.herokuapp.com
echo.

REM Step 3: Add PostgreSQL database
echo Step 3: Adding PostgreSQL database...
cmd /c heroku addons:create heroku-postgresql:hobby-dev -a %APP_NAME%
echo ✓ Database added
echo.

REM Step 4: Set environment variables
echo Step 4: Setting environment variables...
echo.

set /p JWT_SECRET="Enter your JWT Secret (or press Enter for one to be generated): "
if "%JWT_SECRET%"=="" (
    REM Generate a random JWT Secret
    for /f %%A in ('powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString()))" 2^>nul') do set JWT_SECRET=%%A
    echo Auto-generated JWT Secret: %JWT_SECRET%
)
cmd /c heroku config:set JWT_SECRET="%JWT_SECRET%" -a %APP_NAME%

set /p GROQ_API_KEY="Enter your Groq API Key: "
cmd /c heroku config:set GROQ_API_KEY="%GROQ_API_KEY%" -a %APP_NAME%

set /p CORS_ORIGIN="Enter your frontend URL (e.g., https://talentstage.vercel.app): "
cmd /c heroku config:set CORS_ORIGIN="%CORS_ORIGIN%" -a %APP_NAME%

echo ✓ Environment variables set
echo.

REM Step 5: Deploy
echo Step 5: Deploying to Heroku...
echo Make sure you're in the project root directory...
cd backend
cmd /c git push heroku main
cd ..
echo ✓ Deployment complete!
echo.

REM Step 6: Run migrations
echo Step 6: Running database migrations...
cmd /c heroku run npm run db:setup -a %APP_NAME%
echo ✓ Database setup complete
echo.

echo =====================================
echo ✓ Deployment successful!
echo =====================================
echo.
echo Your backend is now live at:
echo https://%APP_NAME%.herokuapp.com
echo.
echo Update your frontend VITE_API_URL to:
echo https://%APP_NAME%.herokuapp.com/api
echo.
pause

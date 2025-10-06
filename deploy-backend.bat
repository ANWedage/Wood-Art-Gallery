@echo off
echo 🚀 Deploying Wood Art Gallery Backend to Vercel...

cd /d "C:\Users\adeep\Documents\GitHub\Wood-Art-Gallery\backend"

echo.
echo 📦 Current directory: %CD%
echo.

echo 🔐 Make sure you're logged in to Vercel...
vercel login

echo.
echo 🚀 Starting deployment...
vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Copy your Vercel URL from the output above
echo 2. Add environment variables in Vercel dashboard:
echo    - MONGODB_URI
echo    - EMAIL_USER  
echo    - EMAIL_PASSWORD
echo    - NODE_ENV=production
echo 3. Update frontend .env.production with your Vercel URL
echo 4. Update netlify.toml with your Vercel URL
echo.
pause

# Deploy Backend to Vercel

## Prerequisites
- Vercel account (sign up at vercel.com)
- Vercel CLI installed globally

## Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Deploy from Backend Directory
```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- What's your project's name? **wood-art-gallery-backend**
- In which directory is your code located? **./** (current directory)

## Step 4: Set Environment Variables

After deployment, add environment variables via Vercel dashboard or CLI:

### Via Vercel Dashboard:
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add these variables:

```
MONGODB_URI=mongodb+srv://adeepa:cG2i1IWhQzVjzKzK@woodartgallery.euxbhtq.mongodb.net/woodartgallery?retryWrites=true&w=majority&appName=woodartgallery

EMAIL_USER=slwoodartgallery@gmail.com
EMAIL_PASSWORD=ctexsjsqiioayqhm
NODE_ENV=production
```

### Via CLI:
```bash
vercel env add MONGODB_URI
# Paste your MongoDB URI when prompted

vercel env add EMAIL_USER
# Enter: slwoodartgallery@gmail.com

vercel env add EMAIL_PASSWORD  
# Enter: ctexsjsqiioayqhm

vercel env add NODE_ENV
# Enter: production
```

## Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 6: Test Your Deployment
Your backend will be available at: `https://your-project-name.vercel.app`

Test endpoints:
- `https://your-project-name.vercel.app/api/user`
- `https://your-project-name.vercel.app/api/design`

## Step 7: Update Frontend Configuration

Once deployed, update your frontend files:

### Update netlify.toml
Replace `https://your-backend-url.herokuapp.com` with your Vercel URL

### Update .env.production
```
VITE_API_URL=https://your-project-name.vercel.app
```

## Important Notes

### File Structure for Vercel
```
backend/
├── api/
│   └── index.js          # Serverless function entry point
├── vercel.json           # Vercel configuration
├── server.js             # Main Express app (modified for serverless)
├── package.json
└── ... (other files)
```

### MongoDB Atlas Setup
Ensure MongoDB Atlas allows connections:
1. Network Access → Add IP: `0.0.0.0/0`
2. Database user has proper permissions

### Vercel Limitations
- 10 second execution time limit for Hobby plan
- 1000 serverless function invocations per day (Hobby)
- File uploads might need special handling

## Troubleshooting

### Build Fails
- Check Node.js version in package.json
- Ensure all dependencies are listed

### Function Timeout
- Optimize database queries
- Consider upgrading Vercel plan for longer timeouts

### CORS Issues
- CORS headers are configured in vercel.json
- Update frontend URL in CORS settings if needed

## Alternative: Quick Deploy Button
You can also deploy by pushing to GitHub and connecting the repository to Vercel dashboard.

# 🚀 Deployment Guide - Vercel

This guide will help you deploy your AI text adventure game to the internet using Vercel.

## 📋 Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free)
2. A [GitHub account](https://github.com/signup) (free)
3. Your Wix OpenAI API key

## 🔧 Setup Steps

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI text adventure game"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repository
5. Vercel will auto-detect Vite configuration

### 3. Configure Environment Variables

**IMPORTANT:** Add your API key as an environment variable:

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `OPENAI_API_KEY` | Your Wix OpenAI API key | Production, Preview, Development |
| `OPENAI_BASE_URL` | `https://www.wixapis.com/openai/v1` | Production, Preview, Development |

3. Click **"Save"**
4. Redeploy the project for changes to take effect

### 4. Deploy!

Click **"Deploy"** and wait for the build to complete (usually 1-2 minutes).

Your game will be live at: `https://your-project-name.vercel.app`

## 🔒 Security Features

✅ **API Key Protection:**
- API key is stored server-side in Vercel environment variables
- Never exposed to the browser
- Secure API route handles all OpenAI calls

✅ **CORS Configuration:**
- API route properly configured for cross-origin requests
- Supports streaming responses

## 🔄 Continuous Deployment

Every time you push to your GitHub repository:
1. Vercel automatically detects the changes
2. Builds your app
3. Deploys the new version
4. No manual deployment needed!

## 📁 Project Structure

```
my-ai-game/
├── api/
│   └── chat.ts           # Serverless API endpoint (Vercel Function)
├── src/
│   ├── components/       # React components
│   ├── services/
│   │   └── openai.ts     # Client calls /api/chat
│   └── ...
├── vercel.json           # Vercel configuration
└── .env                  # Local development only (not deployed)
```

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to test

### API Not Working
- Verify environment variables are set in Vercel
- Check Function logs in Vercel dashboard
- Ensure API key is valid

### 500 Server Error
- Check Vercel Function logs
- Verify `OPENAI_API_KEY` environment variable is set
- Check `OPENAI_BASE_URL` is correct

## 🎮 Testing Your Deployment

1. Visit your deployed URL
2. Start a new game
3. Send a message
4. If streaming works, deployment is successful! 🎉

## 💰 Cost

**Vercel:**
- Free tier: 100 GB bandwidth/month
- Serverless Functions: 100 GB-hours/month
- More than enough for a personal project!

**Wix OpenAI API:**
- Check your Wix plan for API usage limits
- Monitor usage in Wix dashboard

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Serverless Functions](https://vercel.com/docs/serverless-functions)

## 📝 Local Development

For local development, the app still works as before:

```bash
npm run dev
```

The API route (`/api/chat`) is proxied by Vite during development.

---

🎉 **Congratulations! Your game is now live on the internet!**


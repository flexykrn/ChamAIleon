# Chameleon Defense WAF - Backend API

## Local Testing

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python classify_api.py
```

The server will start at `http://localhost:8000`

### 3. Test Endpoints

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Test Benign Request:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "Hello world"}'
```

**Test Malicious Request (SQL Injection):**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "SELECT * FROM users WHERE id=1 OR 1=1"}'
```

**Test XSS Attack:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "<script>alert(\"XSS\")</script>"}'
```

## Deployment on Render

### Prerequisites
- GitHub account
- Render account (free tier available at https://render.com)
- Git repository with your backend code

### Step-by-Step Deployment

#### 1. Prepare Your Repository
Make sure all files are committed to Git:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

#### 2. Deploy on Render

**Option A: Using render.yaml (Recommended)**
1. Go to https://render.com and sign in
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to create the service

**Option B: Manual Setup**
1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** chameleon-defense-api
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn classify_api:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free (or paid for better performance)
5. Click "Create Web Service"

#### 3. Wait for Deployment
Render will automatically:
- Clone your repository
- Install dependencies
- Build and deploy your application
- Provide you with a public URL (e.g., `https://chameleon-defense-api.onrender.com`)

#### 4. Test Your Deployed API

**Health Check:**
```bash
curl https://your-app-name.onrender.com/health
```

**Test Analysis Endpoint:**
```bash
curl -X POST https://your-app-name.onrender.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "SELECT * FROM users"}'
```

### Important Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Limited to 750 hours/month

2. **Model File:**
   - Make sure `chameleon_brain.pkl` is committed to your repository
   - Check file size (Render has a 500MB slug size limit)

3. **Environment Variables:**
   - Add any sensitive config via Render Dashboard → Environment
   - Never commit secrets to Git

4. **Monitoring:**
   - Check logs in Render Dashboard for errors
   - Set up health check monitoring

### Troubleshooting

**Build Fails:**
- Check if all dependencies in requirements.txt are compatible
- Verify Python version matches your local setup

**Service Crashes:**
- Check logs in Render Dashboard
- Ensure chameleon_brain.pkl exists and loads correctly

**Port Issues:**
- Render automatically sets the PORT environment variable
- Don't hardcode port 8000 in production

### Upgrade to Paid Plan
For production use, consider upgrading to a paid plan for:
- Always-on service (no spin-down)
- Better performance
- More resources
- Custom domains

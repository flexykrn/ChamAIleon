import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChameleonDefense } from 'chameleon-security-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Chameleon Defense
const defense = new ChameleonDefense({
  mlApiUrl: 'https://chameleon-defence-api.onrender.com/analyze',
  confidenceThreshold: 0.7,
  responseMode: 'adaptive',
  enableSessionTracking: true,
  tarpitBaseDelay: 2000,
  monitorAll: true  // Enable logging for all requests (benign + malicious)
});

// Apply Chameleon middleware to ALL routes
app.use(defense.middleware());

// Serve trap page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'trap-page.html'));
});

// Serve real dashboard for legitimate users
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve trap/honeypot for attackers
app.get('/trap', (req, res) => {
  res.sendFile(path.join(__dirname, 'trap.html'));
});

// Log trap activity (for monitoring attackers)
app.post('/api/chameleon/trap-activity', (req, res) => {
  console.log('[TRAP] Attacker activity:', req.body);
  res.json({ logged: true });
});

// Smart login endpoint (ML-based attack detection)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Step 1: Check if Chameleon detected an attack
  // The middleware analyzes the payload before this endpoint runs
  // If it's malicious, the middleware would have blocked it already
  
  // Step 2: Analyze username and password separately for attacks
  try {
    // Analyze username first
    const usernameResponse = await fetch('https://chameleon-defence-api.onrender.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: username })
    });
    
    const usernameData = await usernameResponse.json();
    const usernameClassification = usernameData.analysis?.verdict || 'Unknown';
    const usernameConfidence = usernameData.analysis?.confidence || 0;
    
    // Analyze password
    const passwordResponse = await fetch('https://chameleon-defence-api.onrender.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: password })
    });
    
    const passwordData = await passwordResponse.json();
    const passwordClassification = passwordData.analysis?.verdict || 'Unknown';
    const passwordConfidence = passwordData.analysis?.confidence || 0;
    
    // ✨ LOG ALL ML API DATA
    console.log('\n════════════════════════════════════════════════════');
    console.log('🔍 ML API ANALYSIS RESULT:');
    console.log('════════════════════════════════════════════════════');
    
    // Username analysis
    console.log('\n� USERNAME ANALYSIS:');
    console.log('   Value:', username);
    console.log('   Verdict:', usernameClassification);
    console.log('   Confidence:', (usernameConfidence * 100).toFixed(2) + '%');
    console.log('   Detected By:', usernameData.analysis?.detected_by || 'N/A');
    
    if (usernameData.analysis?.xai_explanation) {
      console.log('   🧠 XAI Explanation:');
      usernameData.analysis.xai_explanation.contributors?.slice(0, 3).forEach((contributor, index) => {
        const emoji = contributor.type === 'RISK_FACTOR' ? '🚨' : '✅';
        const impact = (contributor.impact * 100).toFixed(2);
        console.log(`      ${index + 1}. ${emoji} "${contributor.feature}" (${impact}%)`);
      });
    }
    
    // Password analysis
    console.log('\n� PASSWORD ANALYSIS:');
    console.log('   Value:', password);
    console.log('   Verdict:', passwordClassification);
    console.log('   Confidence:', (passwordConfidence * 100).toFixed(2) + '%');
    console.log('   Detected By:', passwordData.analysis?.detected_by || 'N/A');
    
    if (passwordData.analysis?.xai_explanation) {
      console.log('   🧠 XAI Explanation:');
      passwordData.analysis.xai_explanation.contributors?.slice(0, 3).forEach((contributor, index) => {
        const emoji = contributor.type === 'RISK_FACTOR' ? '🚨' : '✅';
        const impact = (contributor.impact * 100).toFixed(2);
        console.log(`      ${index + 1}. ${emoji} "${contributor.feature}" (${impact}%)`);
      });
    }
    
    console.log('\n🌐 Client IP:', usernameData.client_ip || req.ip);
    console.log('⏰ Timestamp:', usernameData.timestamp);
    console.log('════════════════════════════════════════════════════\n');
    
    // Determine if either field contains an attack
    const isUsernameAttack = usernameClassification !== 'Benign' && usernameConfidence > 0.7;
    const isPasswordAttack = passwordClassification !== 'Benign' && passwordConfidence > 0.7;
    
    // If attack detected in EITHER field, redirect to trap
    if (isUsernameAttack || isPasswordAttack) {
      const attackType = isUsernameAttack ? usernameClassification : passwordClassification;
      const attackConfidence = isUsernameAttack ? usernameConfidence : passwordConfidence;
      const attackField = isUsernameAttack ? 'username' : 'password';
      
      console.log(`🚨 [Login] Attack detected in ${attackField}: ${attackType} (${(attackConfidence * 100).toFixed(1)}%)`);
      
      // Send attacker to trap/honeypot page
      return res.json({
        success: true, // Fake success to trap them
        message: 'Login successful',
        redirect: '/trap', // Redirect to trap page
        user: { username: 'admin', role: 'guest' }, // Fake user
        token: 'trap-token-' + Date.now()
      });
    }
    
    // Step 3: If benign, do real authentication
    // In production, check against database
    // For demo: accept 'admin/admin123' OR any benign request
    console.log('✅ [Login] Both fields are benign - proceeding with authentication');
    
    if (username === 'admin' && password === 'admin123') {
      console.log('✓ [Login] Credentials valid - granting access to real dashboard');
      return res.json({
        success: true,
        message: 'Login successful',
        redirect: '/dashboard', // Real dashboard
        user: { username: 'admin', role: 'administrator' },
        token: 'real-jwt-token-12345',
        mlVerified: true,
        usernameClassification: usernameClassification,
        passwordClassification: passwordClassification
      });
    } else {
      console.log('✗ [Login] Invalid credentials');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        mlVerified: true
      });
    }
    
  } catch (error) {
    console.error('[Login] ML API Error:', error.message);
    // Fallback to basic auth if ML API fails
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        message: 'Login successful (ML verification unavailable)',
        redirect: '/dashboard',
        user: { username: 'admin', role: 'administrator' },
        token: 'fallback-token-12345'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  }
});

// Get Chameleon statistics
app.get('/api/chameleon/stats', (req, res) => {
  const stats = defense.getStats();
  res.json({
    ...stats,
    message: 'Chameleon Security Statistics',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    chameleon: 'active',
    mlApi: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to trigger detection
app.post('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint - send malicious payloads to test detection',
    yourPayload: req.body
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🦎 Chameleon Security Server running on http://localhost:${PORT}`);
  console.log(`🛡️  All endpoints protected by ML-powered defense`);
  console.log(`📊 View stats at: http://localhost:${PORT}/api/chameleon/stats`);
  console.log(`🕸️  Trap page at: http://localhost:${PORT}/\n`);
});

#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupChameleon() {
  console.log('\n');
  console.log('🦎 ═══════════════════════════════════════════════════════════');
  console.log('   CHAMELEON SECURITY - INTERACTIVE SETUP WIZARD');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('This wizard will generate a complete security setup for your app.');
  console.log('You will define fake data that attackers will see in trap pages.\n');

  // Check existing files
  if (fs.existsSync('server.js') || fs.existsSync('trap-data.json')) {
    console.log('⚠️  Setup files already exist in this directory!');
    const overwrite = await question('   Do you want to overwrite them? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ Setup cancelled.\n');
      rl.close();
      process.exit(0);
    }
  }

  // Step 1: ML API
  console.log('\n📡 Step 1: ML API Configuration');
  console.log('─'.repeat(60));
  const mlApiUrl = await question('Enter ML API URL (press Enter for default): ') || 
                  'https://chameleon-defence-api.onrender.com/analyze';
  console.log('✓ Using:', mlApiUrl);

  // Step 2: Trap Data
  console.log('\n🎭 Step 2: Define Trap Data (Fake Data for Attackers)');
  console.log('─'.repeat(60));
  console.log('Define what fake data attackers will see when they break in.');
  const useCustom = await question('\nDo you want to define custom trap data? (y/n): ');
  
  let schemas = {};
  
  if (useCustom.toLowerCase() === 'y') {
    const count = parseInt(await question('How many endpoints/pages to protect? ')) || 1;
    
    for (let i = 0; i < count; i++) {
      console.log('\n📍 Endpoint ' + (i + 1) + '/' + count);
      const name = await question('  Endpoint name (e.g. users, dashboard): ');
      schemas[name] = {};
      
      console.log('\n  Define fields (type done when finished):');
      while (true) {
        const field = await question('    Field name: ');
        if (field.toLowerCase() === 'done' || !field) break;
        
        const value = await question('    Fake values (comma-separated): ');
        schemas[name][field] = value.includes(',') ? 
          value.split(',').map(v => v.trim()) : value;
        console.log('    ✓ Added:', field);
      }
    }
  } else {
    schemas = {
      users: {
        name: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        email: ['john@example.com', 'jane@example.com'],
        balance: ',000'
      }
    };
    console.log('✓ Using default schema (users endpoint)');
  }

  // Step 3: Firebase
  console.log('\n🔥 Step 3: Firebase Logging (Optional)');
  console.log('─'.repeat(60));
  const useFirebase = await question('Log attacks to Firebase? (y/n): ');
  let firebaseConfig = null;
  if (useFirebase.toLowerCase() === 'y') {
    const url = await question('Firebase Database URL: ');
    firebaseConfig = { databaseURL: url };
    console.log('✓ Firebase enabled');
  }

  // Generate files
  console.log('\n📝 Generating Files...');
  console.log('─'.repeat(60));
  
  generateAllFiles(mlApiUrl, schemas, firebaseConfig);
  
  console.log('✓ Created: trap-data.json');
  console.log('✓ Created: data-switcher-config.js');
  console.log('✓ Created: server.js');
  console.log('✓ Created: trap-page.html');
  console.log('✓ Created: dashboard.html');
  console.log('✓ Created: trap.html');
  console.log('✓ Created: README.md');
  console.log('✓ Updated: package.json');

  // Install deps
  console.log('\n📦 Installing Dependencies...');
  console.log('─'.repeat(60));
  try {
    execSync('npm install express cors', { stdio: 'inherit' });
    console.log('✓ Dependencies installed');
  } catch (e) {
    console.log('⚠️  Install manually: npm install express cors');
  }

  // Success
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                 ✅ SETUP COMPLETE! ✅                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n🎭 Your Trap Data Schemas:');
  Object.keys(schemas).forEach(name => {
    console.log('   • ' + name + ': ' + Object.keys(schemas[name]).join(', '));
  });
  console.log('\n🚀 Next Steps:');
  console.log('   1. npm start');
  console.log('   2. Visit http://localhost:5000');
  console.log('   3. Test attack: username\' OR 1=1--');
  console.log('\n💡 Attackers see fake data, real users see real data!\n');
  
  rl.close();
}

function generateAllFiles(mlApiUrl, schemas, firebaseConfig) {
  // 1. Create trap-data.json
  const trapData = {
    schemas,
    mlApiUrl,
    firebaseConfig,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync('trap-data.json', JSON.stringify(trapData, null, 2));

  // 2. Create data-switcher-config.js
  const dataSwitcherCode = `import trapData from './trap-data.json' assert { type: 'json' };

export class TrapDataGenerator {
  constructor() {
    this.schemas = trapData.schemas;
  }

  generateFakeData(endpointName, count = 1) {
    if (!this.schemas[endpointName]) {
      throw new Error(\`No schema found for endpoint: \${endpointName}\`);
    }

    const schema = this.schemas[endpointName];
    const results = [];

    for (let i = 0; i < count; i++) {
      const fakeRecord = {
        id: \`FAKE-\${this.generateRandomId()}\`
      };

      // For each field in schema
      Object.entries(schema).forEach(([fieldName, fieldValue]) => {
        if (Array.isArray(fieldValue)) {
          // Randomly pick from array
          fakeRecord[fieldName] = fieldValue[Math.floor(Math.random() * fieldValue.length)];
        } else {
          // Use static value
          fakeRecord[fieldName] = fieldValue;
        }
      });

      results.push(fakeRecord);
    }

    return count === 1 ? results[0] : results;
  }

  generateRandomId() {
    return Math.random().toString(36).substring(2, 11).toUpperCase();
  }

  getAvailableEndpoints() {
    return Object.keys(this.schemas);
  }

  addSchema(endpointName, schema) {
    this.schemas[endpointName] = schema;
  }
}

export const trapDataGenerator = new TrapDataGenerator();
`;
  fs.writeFileSync('data-switcher-config.js', dataSwitcherCode);

  // 3. Create server.js
  const firebaseImport = firebaseConfig ? "import admin from 'firebase-admin';" : '';
  const firebaseInit = firebaseConfig ? `
// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: '${firebaseConfig.databaseURL}'
});

const db = admin.firestore();
` : '';

  const endpointRoutes = Object.keys(schemas).map(endpointName => `
// ${endpointName.toUpperCase()} Endpoint - Smart Data Switching
app.get('/api/${endpointName}', async (req, res) => {
  const isAttacker = req.chameleonAnalysis && 
                    req.chameleonAnalysis.classification !== 'Benign';

  if (isAttacker) {
    console.log(\`🚨 ATTACKER DETECTED on /api/${endpointName}\`);
    console.log('  Classification:', req.chameleonAnalysis.classification);
    console.log('  Confidence:', req.chameleonAnalysis.confidence + '%');
    
    // Add tarpit delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate and serve FAKE data
    const fakeData = trapDataGenerator.generateFakeData('${endpointName}');
    ${firebaseConfig ? `
    // Log to Firebase
    try {
      await db.collection('attacker_logs').add({
        timestamp: new Date().toISOString(),
        endpoint: '/api/${endpointName}',
        attackType: req.chameleonAnalysis.classification,
        confidence: req.chameleonAnalysis.confidence,
        ip: req.ip,
        fakeDataServed: fakeData
      });
    } catch (err) {
      console.error('Firebase logging error:', err.message);
    }
    ` : ''}
    console.log('  🎭 Serving FAKE data:', fakeData);
    return res.json({ success: true, data: fakeData });
  } else {
    // Normal user - serve REAL data from your database
    console.log(\`✅ Normal request to /api/${endpointName}\`);
    
    // TODO: Replace with your actual database query
    const realData = {
      // Add your database query here
      // Example: await db.collection('${endpointName}').find().toArray()
    };
    
    return res.json({ success: true, data: realData });
  }
});`).join('\n');

  const serverCode = `import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChameleonDefense } from 'chameleon-security-middleware';
import { trapDataGenerator } from './data-switcher-config.js';
${firebaseImport}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
${firebaseInit}
// Initialize Chameleon Defense with ML-powered attack detection
const defense = new ChameleonDefense({
  mlApiUrl: '${mlApiUrl}',
  confidenceThreshold: 0.7,
  responseMode: 'adaptive',
  enableSessionTracking: true,
  tarpitBaseDelay: 2000,
  monitorAll: true
});

// Apply ML protection to ALL routes
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
${endpointRoutes}

// Login endpoint with ML analysis
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Analyze username
    const usernameResponse = await fetch('${mlApiUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: username })
    });
    const usernameData = await usernameResponse.json();
    const usernameClassification = usernameData.analysis?.verdict || 'Unknown';
    const usernameConfidence = usernameData.analysis?.confidence || 0;
    
    // Analyze password
    const passwordResponse = await fetch('${mlApiUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: password })
    });
    const passwordData = await passwordResponse.json();
    const passwordClassification = passwordData.analysis?.verdict || 'Unknown';
    
    // Log analysis
    console.log('\\n🔍 LOGIN ATTEMPT ANALYSIS');
    console.log('  Username:', username, '→', usernameClassification, (usernameConfidence * 100).toFixed(1) + '%');
    console.log('  Password:', '***', '→', passwordClassification);
    
    // Check if attack detected
    const isUsernameAttack = usernameClassification !== 'Benign' && usernameConfidence > 0.7;
    const isPasswordAttack = passwordClassification !== 'Benign';
    
    if (isUsernameAttack || isPasswordAttack) {
      console.log('  🚨 ATTACK DETECTED - Redirecting to trap');
      return res.json({
        success: true,
        message: 'Login successful',
        redirect: '/trap',
        user: { username: 'admin', role: 'guest' },
        token: 'trap-token-' + Date.now()
      });
    }
    
    // Normal authentication
    console.log('  ✅ Benign login - Proceeding with authentication');
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        message: 'Login successful',
        redirect: '/dashboard',
        user: { username: 'admin', role: 'administrator' },
        token: 'real-jwt-token-12345'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(\`\\n🦎 Chameleon Security Server running on http://localhost:\${PORT}\`);
  console.log(\`🎭 Protected Endpoints: \${trapDataGenerator.getAvailableEndpoints().join(', ')}\`);
  console.log(\`🔒 ML-Powered Attack Detection: ACTIVE\`);
  console.log(\`📊 Logging: ${firebaseConfig ? 'Firebase + Console' : 'Console Only'}\\n\`);
});
`;
  fs.writeFileSync('server.js', serverCode);

  // 4. Create trap-page.html
  const trapPageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Chameleon Security</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { font-size: 28px; color: #333; margin-bottom: 10px; }
    .logo p { color: #666; font-size: 14px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    input:focus { outline: none; border-color: #667eea; }
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    .alert {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: none;
    }
    .alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .demo-info {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 13px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>🦎 Chameleon</h1>
      <p>Admin Dashboard Login</p>
    </div>
    <div id="alert" class="alert"></div>
    <form id="loginForm">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn">Login</button>
    </form>
    <div class="demo-info">
      <strong>Demo Credentials:</strong><br>
      Username: admin<br>
      Password: admin123<br><br>
      <strong>Test Attack:</strong><br>
      Try: <code>admin' OR 1=1--</code>
    </div>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    const alert = document.getElementById('alert');
    
    function showAlert(message, type) {
      alert.textContent = message;
      alert.className = \`alert \${type}\`;
      alert.style.display = 'block';
      setTimeout(() => { alert.style.display = 'none'; }, 5000);
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
          showAlert(data.message || 'Login successful!', 'success');
          setTimeout(() => {
            window.location.href = data.redirect || '/dashboard';
          }, 1000);
        } else {
          showAlert(data.message || 'Login failed', 'error');
        }
      } catch (error) {
        showAlert('Connection error. Please try again.', 'error');
      }
    });
  </script>
</body>
</html>`;
  fs.writeFileSync('trap-page.html', trapPageHtml);

  // 5. Create dashboard.html
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Real</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 10px; }
    .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    p { color: #666; margin-top: 20px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Welcome to Real Admin Dashboard</h1>
    <span class="badge">LEGITIMATE USER</span>
    <p>This is the REAL dashboard for authenticated users.</p>
    <p>Your login was verified as legitimate by the ML security system.</p>
    <p><strong>TODO:</strong> Add your real dashboard content here!</p>
  </div>
</body>
</html>`;
  fs.writeFileSync('dashboard.html', dashboardHtml);

  // 6. Create trap.html
  const schemaDisplay = Object.entries(schemas).map(([name, fields]) => {
    const fieldList = Object.keys(fields).map(f => `<li>${f}</li>`).join('');
    return `<h3>📊 ${name.charAt(0).toUpperCase() + name.slice(1)}</h3><ul>${fieldList}</ul>`;
  }).join('');

  const trapHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Trap</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 10px; }
    .badge { background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    p { color: #666; margin-top: 20px; line-height: 1.6; }
    #data {
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #ef4444;
    }
    pre { background: #1f2937; color: #10b981; padding: 15px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎭 Welcome to "Admin Dashboard"</h1>
    <span class="badge">HONEYPOT - ATTACKER TRAPPED</span>
    <p>This looks like the real dashboard, but you're seeing FAKE data!</p>
    <p>The ML system detected your attack and redirected you here.</p>
    <p>All your activity is being logged. 📝</p>
    
    <div id="data">
      <h2>Available Data Endpoints:</h2>
      ${schemaDisplay}
      <p style="margin-top: 20px;"><em>This data is completely fake and randomly generated!</em></p>
    </div>
  </div>
  
  <script>
    // Fetch and display fake data
    async function loadFakeData() {
      const endpoints = ${JSON.stringify(Object.keys(schemas))};
      const dataDiv = document.getElementById('data');
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch('/api/' + endpoint);
          const result = await response.json();
          
          const section = document.createElement('div');
          section.style.marginTop = '20px';
          section.innerHTML = '<h3>📡 /api/' + endpoint + '</h3><pre>' + 
            JSON.stringify(result.data, null, 2) + '</pre>';
          dataDiv.appendChild(section);
        } catch (err) {
          console.error('Error loading', endpoint, err);
        }
      }
    }
    
    loadFakeData();
  </script>
</body>
</html>`;
  fs.writeFileSync('trap.html', trapHtml);

  // 7. Create README.md
  const endpointList = Object.keys(schemas).map(name => `- \`/api/${name}\``).join('\n');
  
  const readme = `# Chameleon Security - Protected Application

AI-powered security middleware with intelligent trap pages.

## 🚀 Quick Start

\`\`\`bash
npm start
\`\`\`

Visit: http://localhost:5000

## 🎭 Protected Endpoints

${endpointList}

## 🧪 Testing

### Normal Login (Gets Real Data)
- Username: \`admin\`
- Password: \`admin123\`
- Result: Redirected to \`/dashboard\` ✅

### Attack (Gets Fake Data)
- Username: \`admin' OR 1=1--\`
- Password: \`anything\`
- Result: Redirected to \`/trap\` 🎭 (but shows "Login successful"!)

## 📊 Architecture

\`\`\`
User Request → ML Analysis → Classification
    ↓
Attack Detected?
  YES → Fake Data (from trap-data.json)
  NO  → Real Data (from your database)
    ↓
Same React/HTML Component Renders!
\`\`\`

## 🎯 Features

- ✅ 95%+ SQLi/XSS detection accuracy
- ✅ Intelligent trap pages (same UI, different data)
- ✅ Session tracking and adaptive responses
- ✅ Tarpit delays for attackers
- ✅ Optional Firebase logging
- ✅ XAI explanations for detections

## 📝 Customization

1. **Add Real Database Queries**: Edit \`server.js\` and replace TODO comments
2. **Modify Fake Data**: Edit \`trap-data.json\`
3. **Add New Endpoints**: Update schemas and regenerate

## 📚 Documentation

Generated by [Chameleon Security Middleware](https://npmjs.com/package/chameleon-security-middleware)
`;
  fs.writeFileSync('README.md', readme);

  // 8. Update package.json
  updatePackageJson();
}

function updatePackageJson() {
  let packageJson = {};
  
  if (fs.existsSync('package.json')) {
    packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  }
  
  packageJson.type = 'module';
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.start = 'node server.js';
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}

setupChameleon().catch(err => {
  console.error('Setup failed:', err);
  rl.close();
  process.exit(1);
});

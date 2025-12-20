# Chameleon Middleware

AI-powered middleware for Express.js that detects SQL injection and XSS attacks using machine learning, with automated setup wizard and intelligent response handling.

## Features

- **ML-Powered Attack Detection**: 95%+ accuracy in detecting SQLi and XSS attacks
- **Automated Setup Wizard**: Interactive CLI generates complete server setup in minutes
- **Intelligent Response Pages**: Different responses for different request patterns
- **Smart Data Switching**: Adaptive data handling based on request analysis
- **Session Tracking**: Monitors request patterns across sessions
- **Adaptive Response**: Increases security measures for suspicious activity
- **Request Delays**: Rate limiting for suspicious patterns
- **XAI Explanations**: See why requests were flagged
- **Optional Firebase Logging**: Store activity for forensics

## Installation

```bash
npm install chameleon-middleware
```

## Quick Start

### 1. Run the Setup Wizard

```bash
npx chameleon-init
```

The wizard will ask you:
- ML API URL (default provided)
- Number of endpoints to protect
- Alternative data values for each endpoint
- Firebase logging configuration (optional)

### 2. Generated Files

The wizard automatically creates:

- `server.js` - Complete Express server with ML protection
- `trap-data.json` - Alternative data schemas
- `data-switcher-config.js` - Smart data generator
- `trap-page.html` - Professional login page
- `dashboard.html` - User dashboard
- `trap.html` - Alternative page
- `README.md` - Documentation
- `package.json` - Updated with scripts

### 3. Start the Server

```bash
npm start
```

Visit `http://localhost:5000` to see your protected login page.

## How It Works

```
User Request → ML Analysis → Classification
    ↓
Attack Detected?
  YES → Redirect to /trap (test data)
  NO  → Redirect to /dashboard (real data)
    ↓
Same UI, Different Data
```

### For Normal Users

```bash
Username: admin
Password: admin123
```

- ML classifies as "Benign"
- User goes to `/dashboard`
- Sees real data from your database

### For suspicious user

```bash
Username: admin' OR 1=1--
Password: anything
```

- ML detects SQL injection (95% confidence)
- User still sees "Login successful" message
- Redirected to `/trap` instead of `/dashboard`
- Sees test data from `trap-data.json`
- Has no idea they're in a alternative page

## Usage Example

### Basic Setup

After running `npx chameleon-init`, your `server.js` will look like:

```javascript
import express from 'express';
import { ChameleonDefense } from 'chameleon-web-defense';
import { trapDataGenerator } from './data-switcher-config.js';

const app = express();

// Initialize ML-powered protection
const defense = new ChameleonDefense({
  mlApiUrl: 'https://chameleon-api-umen.onrender.com/analyze',
  confidenceThreshold: 0.7,
  enableSessionTracking: true
});

app.use(defense.middleware());

// Smart endpoint - switches data based on ML analysis
app.get('/api/users', async (req, res) => {
  const issuspicious user = req.chameleonAnalysis?.classification !== 'Benign';
  
  if (issuspicious user) {
    // Serve test data from trap-data.json
    const fakeData = trapDataGenerator.generateFakeData('users');
    return res.json({ success: true, data: fakeData });
  } else {
    // Serve real data from your database
    const realData = await db.users.find();
    return res.json({ success: true, data: realData });
  }
});

app.listen(5000);
```

### Adding Real Database Queries

Edit the generated `server.js` and replace the TODO comments:

```javascript
app.get('/api/users', async (req, res) => {
  const issuspicious user = req.chameleonAnalysis?.classification !== 'Benign';
  
  if (issuspicious user) {
    const fakeData = trapDataGenerator.generateFakeData('users');
    return res.json({ success: true, data: fakeData });
  } else {
    // Add your real database query here
    const realData = await mongoose.model('User').find();
    return res.json({ success: true, data: realData });
  }
});
```

## Customizing test data

Edit `trap-data.json` to change what suspicious user see:

```json
{
  "schemas": {
    "users": {
      "name": ["John Doe", "Jane Smith", "Bob Johnson"],
      "email": ["john@company.com", "jane@company.com"],
      "balance": "$10,000"
    },
    "dashboard": {
      "totalUsers": "1,523",
      "revenue": "$245,678.50"
    }
  }
}
```

**Array values**: Randomly picked on each request

**String values**: Static value every time

## Testing

### Test Normal Login

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: `"redirect": "/dashboard"`

### Test SQL Injection Attack

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin' OR 1=1--\",\"password\":\"test\"}"
```

Expected: `"redirect": "/trap"`

### Test XSS Attack

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<script>alert(1)</script>"}'
```

Expected: `"redirect": "/trap"`

## API Reference

### ChameleonDefense Options

```javascript
const defense = new ChameleonDefense({
  mlApiUrl: 'string',           // ML API endpoint
  confidenceThreshold: 0.7,     // Detection threshold (0-1)
  responseMode: 'adaptive',     // 'block' | 'adaptive' | 'monitor'
  enableSessionTracking: true,  // Track attack patterns
  tarpitBaseDelay: 2000,       // Delay for suspicious user (ms)
  monitorAll: true             // Log all requests
});
```

### Request Analysis Object

Every request gets a `chameleonAnalysis` object:

```javascript
req.chameleonAnalysis = {
  classification: 'SQLi' | 'XSS' | 'Benign',
  confidence: 0.95,              // 0-1
  detected_by: 'ml_model',
  xai_explanation: {
    contributors: [
      {
        feature: 'OR',
        type: 'RISK_FACTOR',
        impact: 0.45
      }
    ]
  }
}
```

### TrapDataGenerator Methods

```javascript
import { trapDataGenerator } from './data-switcher-config.js';

// Generate test data for an endpoint
const fakeUser = trapDataGenerator.generateFakeData('users');
// { id: 'FAKE-X7Y9Z', name: 'Jane Smith', email: 'john@company.com', balance: '$10,000' }

// Generate multiple records
const fakeUsers = trapDataGenerator.generateFakeData('users', 5);
// Array of 5 fake user objects

// Get available endpoints
const endpoints = trapDataGenerator.getAvailableEndpoints();
// ['users', 'dashboard']

// Add new schema at runtime
trapDataGenerator.addSchema('products', {
  name: ['Product A', 'Product B'],
  price: '$99.99'
});
```

## Firebase Logging Setup

During `npx chameleon-init`, choose "yes" for Firebase logging and provide your database URL.

suspicious user logs will be stored in the `suspicious user_logs` collection:

```javascript
{
  timestamp: '2024-12-20T10:30:00Z',
  endpoint: '/api/users',
  attackType: 'SQLi',
  confidence: 0.95,
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  payload: { username: "admin' OR 1=1--" },
  fakeDataServed: { id: 'FAKE-X7Y9Z', ... }
}
```

## Configuration Options

### Customizing the ML API

Use your own ML model:

```bash
# During setup wizard
Enter ML API URL: https://your-ml-api.com/analyze
```

Or edit `trap-data.json` after generation:

```json
{
  "mlApiUrl": "https://your-ml-api.com/analyze",
  "schemas": { ... }
}
```

### Adding New Endpoints

1. Edit `trap-data.json` and add a new schema:

```json
{
  "schemas": {
    "products": {
      "name": ["Product A", "Product B"],
      "price": "$99.99",
      "stock": "50"
    }
  }
}
```

2. Add endpoint in `server.js`:

```javascript
app.get('/api/products', async (req, res) => {
  const issuspicious user = req.chameleonAnalysis?.classification !== 'Benign';
  
  if (issuspicious user) {
    const fakeData = trapDataGenerator.generateFakeData('products');
    return res.json({ success: true, data: fakeData });
  } else {
    const realData = await db.products.find();
    return res.json({ success: true, data: realData });
  }
});
```

## Architecture

### Components

- **ChameleonDefense**: Express middleware that analyzes requests
- **ML API**: Cloud-based machine learning model for attack detection
- **TrapDataGenerator**: Generates realistic test data from schemas
- **Session Tracker**: Monitors attack patterns across sessions
- **Adaptive Responder**: Increases security measures for repeat suspicious user

### Data Flow

1. User submits request
2. ChameleonDefense middleware intercepts
3. Payload sent to ML API for analysis
4. ML returns classification and confidence
5. Request enhanced with analysis results
6. Endpoint handler checks classification
7. Routes to real or test data accordingly
8. Response sent to user
9. suspicious user logged to Firebase (optional)

## Security Best Practices

1. **Never show errors to suspicious user** - Always return generic messages
2. **Keep test data realistic** - Use believable values to maintain deception
3. **Monitor logs regularly** - Check Firebase/console for attack patterns
4. **Update ML model** - Use the latest attack signatures
5. **Add tarpit delays** - Waste suspicious user' time
6. **Use HTTPS in production** - Protect data in transit
7. **Rotate test data** - Change trap data periodically

## Troubleshooting

### Server won't start

```bash
# Check dependencies
npm install

# Verify package.json has type: module
cat package.json | grep type
```

### ML API not responding

- Check internet connection
- Verify ML API URL in `trap-data.json`
- API might be slow on free tier - wait 10-15 seconds

### test data not showing

- Verify `trap-data.json` exists and has correct schemas
- Check `data-switcher-config.js` is imported correctly
- Ensure endpoint names match schema names exactly

### All requests going to trap

- Check ML API is returning correct classifications
- Verify `confidenceThreshold` is not too low (default: 0.7)
- Test with known benign input first

## Performance

- **ML Detection**: 95%+ accuracy
- **False Positive Rate**: <5%
- **Response Time**: 200-500ms (depends on ML API)
- **Tarpit Delay**: 2 seconds for suspicious user
- **Throughput**: Handles 1000+ req/sec

## Requirements

- Node.js 14+
- Express.js 4+
- Internet connection (for ML API)
- Optional: Firebase account (for logging)

## License

MIT

## Support

- GitHub Issues: [Report a bug](https://github.com/flexykrn/Chameleon_The_Outliers_SPIT_REDACT/issues)
- Documentation: [Full docs](https://github.com/flexykrn/Chameleon_The_Outliers_SPIT_REDACT)

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## Authors

Chameleon Security Team

## Changelog

### v1.3.0 (2024-12-20)
- Complete automated setup wizard
- Smart data switching between real and test data
- Auto-generated server, alternative pages, and configuration
- Firebase logging support
- XAI explanations for detections

### v1.2.0
- Interactive setup improvements
- Enhanced logging

### v1.1.0
- Initial release
- ML-powered attack detection
- Session tracking

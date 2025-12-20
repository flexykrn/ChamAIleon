/**
 * Request Logger - Firebase integration for request logging
 * Optional feature requiring firebase-admin peer dependency
 */

let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.warn('Firebase Admin not installed. Logging features disabled.');
}

export class RequestLogger {
  constructor(config = {}) {
    this.enabled = !!config.firebaseConfig && !!admin;
    this.geminiEnabled = !!config.geminiApiKey;
    this.geminiApiKey = config.geminiApiKey;

    if (this.enabled) {
      try {
        if (!admin.default.apps.length) {
          admin.default.initializeApp({
            credential: admin.default.credential.cert(config.firebaseConfig)
          });
        }
        this.db = admin.default.firestore();
        console.log('Firebase initialized for request logging');
      } catch (error) {
        console.warn('Firebase initialization failed:', error.message);
        this.enabled = false;
      }
    }
  }

  async logRequest(requestData) {
    if (!this.enabled) {
      console.log('Request logging disabled (no Firebase config)');
      return;
    }

    try {
      const {
        payload,
        classification,
        confidence,
        clientIp,
        timestamp,
        requiresAction
      } = requestData;

      let aiAnalysis = null;
      if (this.geminiEnabled && requiresAction) {
        aiAnalysis = await this.analyzeWithAI(classification, payload);
      }

      const logDocument = {
        payload,
        classification,
        confidence,
        clientIp,
        timestamp: timestamp || new Date().toISOString(),
        requiresAction,
        aiInsight: aiAnalysis || null,
        userAgent: requestData.userAgent || null,
        endpoint: requestData.endpoint || null,
        method: requestData.method || 'POST',
        country: requestData.country || null
      };

      const docRef = await this.db.collection('security-logs').add(logDocument);
      console.log(`Request logged to Firebase: ${docRef.id}`);

    } catch (error) {
      console.error('Failed to log request:', error.message);
    }
  }

  async analyzeWithAI(classification, payload) {
    if (!this.geminiApiKey) return null;

    try {
      const prompt = `Analyze this ${classification} request payload and provide ONE concise sentence (max 120 chars) explaining the intent. Include a security reference link.

Example: "Bypassing auth with SQL OR 1=1 logic [Link: https://owasp.org/www-community/attacks/SQL_Injection]"

Payload: ${payload}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch (error) {
      console.warn('AI analysis failed:', error.message);
      return null;
    }
  }

  async getRequestStats(limit = 100) {
    if (!this.enabled) {
      return {
        totalRequests: 0,
        classificationTypes: {},
        topCountries: {},
        recentRequests: []
      };
    }

    try {
      const snapshot = await this.db.collection('security-logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const requests = [];
      snapshot.forEach(doc => {
        requests.push({ id: doc.id, ...doc.data() });
      });

      return {
        totalRequests: requests.length,
        classificationTypes: this.groupByClassification(requests),
        topCountries: this.groupByCountry(requests),
        recentRequests: requests.slice(0, 10)
      };

    } catch (error) {
      console.error('Failed to get request stats:', error.message);
      return null;
    }
  }

  groupByClassification(requests) {
    return requests.reduce((acc, req) => {
      const type = req.classification || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  groupByCountry(requests) {
    return requests.reduce((acc, req) => {
      const country = req.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
  }
}

export default RequestLogger;

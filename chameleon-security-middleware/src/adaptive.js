/**
 * Adaptive Response Engine - Generates context-aware responses
 */

export class AdaptiveEngine {
  constructor(config = {}) {
    this.responseMode = config.responseMode || 'adaptive'; // 'adaptive', 'block', 'monitor'
    this.delayEnabled = config.delayEnabled !== false;
    this.ipTracker = new Map();
    this.sessionTracker = new Map();
  }

  generateResponse(classification, requestContext) {
    const responseType = this.determineResponseType(classification);
    
    const responses = {
      'SQLi': this.generateDatabaseResponse(),
      'XSS': this.generateScriptResponse(),
      'Command Injection': this.generateCommandResponse(),
      'Path Traversal': this.generateFileResponse(),
      'Brute Force': this.generateAuthResponse(),
      'default': this.generateGenericResponse()
    };

    return responses[classification] || responses['default'];
  }

  generateDatabaseResponse() {
    const outcomes = [
      { success: true, data: { users: [], message: 'Query executed successfully' } },
      { success: false, error: 'Database connection timeout' },
      { success: true, data: { rows: 0, affected: 0 } }
    ];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }

  generateScriptResponse() {
    return {
      success: true,
      html: '<div>Content loaded</div>',
      sanitized: true
    };
  }

  generateCommandResponse() {
    return {
      success: false,
      error: 'Permission denied',
      code: 403
    };
  }

  generateFileResponse() {
    return {
      success: false,
      error: 'File not found',
      path: '/var/www/html/index.html'
    };
  }

  generateAuthResponse() {
    return {
      success: false,
      error: 'Invalid credentials',
      remainingAttempts: Math.floor(Math.random() * 3) + 1
    };
  }

  generateGenericResponse() {
    return {
      success: true,
      message: 'Request processed',
      timestamp: new Date().toISOString()
    };
  }

  async applyDelay(clientIp) {
    if (!this.delayEnabled) return;

    const session = this.sessionTracker.get(clientIp) || { requestCount: 0 };
    session.requestCount++;
    this.sessionTracker.set(clientIp, session);

    const delayMs = Math.min(session.requestCount * 500, 5000);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  trackSession(clientIp, classification) {
    if (!this.sessionTracker.has(clientIp)) {
      this.sessionTracker.set(clientIp, {
        firstSeen: Date.now(),
        requestCount: 0,
        classifications: []
      });
    }

    const session = this.sessionTracker.get(clientIp);
    session.classifications.push({
      classification,
      timestamp: Date.now()
    });
    session.requestCount++;

    return {
      sessionAge: Date.now() - session.firstSeen,
      totalRequests: session.requestCount,
      classificationTypes: [...new Set(session.classifications.map(c => c.classification))]
    };
  }

  getSessionInfo(clientIp) {
    return this.sessionTracker.get(clientIp) || null;
  }

  clearSession(clientIp) {
    this.sessionTracker.delete(clientIp);
    this.ipTracker.delete(clientIp);
  }

  determineResponseType(classification) {
    if (this.responseMode === 'block') return 'block';
    if (this.responseMode === 'monitor') return 'allow';
    return 'adaptive';
  }
}

export default AdaptiveEngine;

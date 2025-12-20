/**
 * Chameleon Defense - Main security middleware coordinator
 * 
 * Features:
 * - ML-powered request classification
 * - Adaptive response generation
 * - Optional site replication
 * - Optional Firebase logging
 */

import { MLConnector } from '../ml-connector.js';
import { AdaptiveEngine } from '../adaptive.js';
import { SiteReplicator } from '../replicator.js';
import { RequestLogger } from '../logger.js';

export class ChameleonDefense {
  constructor(config = {}) {
    this.config = config;
    this.mlConnector = new MLConnector(config);
    this.adaptiveEngine = new AdaptiveEngine(config);
    this.siteReplicator = config.replicateTarget ? new SiteReplicator(config) : null;
    this.requestLogger = new RequestLogger(config);
    this.simulationPath = config.simulationPath || '/simulation';
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
        const payload = this.extractPayload(req);

        if (!payload) {
          return next();
        }

        const classification = await this.mlConnector.classify(payload, clientIp);

        if (classification.requiresAction && 
            classification.confidence >= this.mlConnector.confidenceThreshold) {
          
          console.log(`[Chameleon] Suspicious request detected: ${classification.classification} (${(classification.confidence * 100).toFixed(1)}%)`);

          await this.requestLogger.logRequest({
            payload,
            classification: classification.classification,
            confidence: classification.confidence,
            clientIp,
            timestamp: classification.timestamp,
            requiresAction: true,
            userAgent: req.headers['user-agent'],
            endpoint: req.path,
            method: req.method
          });

          await this.adaptiveEngine.applyDelay(clientIp);
          this.adaptiveEngine.trackSession(clientIp, classification.classification);

          return this.handleSuspiciousRequest(req, res, classification);
        }

        // Log benign requests in monitor mode
        if (this.config.monitorAll) {
          await this.requestLogger.logRequest({
            payload,
            classification: classification.classification,
            confidence: classification.confidence,
            clientIp,
            timestamp: classification.timestamp,
            requiresAction: false,
            endpoint: req.path,
            method: req.method
          });
        }

        next();

      } catch (error) {
        console.error('[Chameleon] Error:', error.message);
        next(); // Fail open
      }
    };
  }

  /**
   * Handle suspicious requests
   */
  async handleSuspiciousRequest(req, res, classification) {
    // Check if requesting simulation path
    if (req.path.startsWith(this.simulationPath) && this.siteReplicator) {
      return await this.siteReplicator.serveReplica(req, res);
    }

    // Generate adaptive response
    const adaptiveResponse = this.adaptiveEngine.generateResponse(
      classification.classification,
      { path: req.path, method: req.method }
    );

    res.status(403).json({
      ...adaptiveResponse,
      requestId: Date.now().toString(36),
      classification: classification.classification
    });
  }

  /**
   * Extract payload from request
   */
  extractPayload(req) {
    const payloads = [];

    if (req.query && Object.keys(req.query).length > 0) {
      payloads.push(JSON.stringify(req.query));
    }

    if (req.body && Object.keys(req.body).length > 0) {
      if (typeof req.body === 'string') {
        payloads.push(req.body);
      } else {
        payloads.push(JSON.stringify(req.body));
      }
    }

    return payloads.join(' ') || null;
  }

  /**
   * Pre-replicate the site (run at startup)
   */
  async preReplicate() {
    if (!this.siteReplicator) {
      console.warn('No replication target specified. Skipping pre-replication.');
      return;
    }

    try {
      await this.siteReplicator.replicate();
      console.log('Site pre-replication complete');
    } catch (error) {
      console.error('Pre-replication failed:', error.message);
    }
  }

  /**
   * Get middleware statistics
   */
  async getStats() {
    const requestStats = await this.requestLogger.getRequestStats();

    return {
      ml: this.mlConnector.getCacheStats(),
      requests: requestStats,
      features: {
        mlClassification: true,
        adaptiveResponses: true,
        siteReplication: !!this.siteReplicator,
        firebaseLogging: this.requestLogger.enabled
      }
    };
  }
}

export default ChameleonDefense;

/**
 * Chameleon Security Middleware
 * 
 * Advanced security middleware with:
 * - ML-powered request analysis
 * - Adaptive response generation
 * - Intelligent traffic routing
 * - Optional site replication (requires puppeteer)
 * - Optional Firebase logging (requires firebase-admin)
 * 
 * @example
 * import { ChameleonDefense } from 'chameleon-security-middleware';
 * 
 * const defense = new ChameleonDefense({
 *   mlApiUrl: 'https://your-ml-api.com',
 *   confidenceThreshold: 0.7,
 *   replicateTarget: 'https://your-site.com', // optional
 *   firebaseConfig: { ... } // optional
 * });
 * 
 * app.use(defense.middleware());
 */

import { ChameleonDefense } from './core/defense.js';
import { MLConnector } from './ml-connector.js';
import { AdaptiveEngine } from './adaptive.js';
import { SiteReplicator } from './replicator.js';
import { RequestLogger } from './logger.js';

// Main export
export { ChameleonDefense };

// Individual component exports
export {
  MLConnector,
  AdaptiveEngine,
  SiteReplicator,
  RequestLogger
};

// Default export
export default ChameleonDefense;

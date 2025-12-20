/**
 * ML Connector - Communicates with Chameleon ML API
 * 
 * Handles request classification, confidence scoring, and explanations
 */

export class MLConnector {
  constructor(config = {}) {
    this.apiUrl = config.mlApiUrl || 'https://chameleon-api-umen.onrender.com/analyze';
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 2;
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1 minute
  }

  async classify(payload, ipAddress = 'unknown') {
    const cacheKey = `${payload}-${ipAddress}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    let lastError = null;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ payload }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error(`Failed to parse response: ${parseError.message}`);
        }

        if (data.analysis && data.analysis.verdict) {
          const result = {
            classification: data.analysis.verdict,
            confidence: data.analysis.confidence || 0,
            requiresAction: this.requiresAction(data.analysis.verdict),
            adaptiveResponse: data.message || 'Request processed',
            detectedBy: data.analysis.detected_by || 'Chameleon Model',
            explanation: data.analysis.xai_explanation || null,
            timestamp: data.timestamp || new Date().toISOString(),
            clientIp: data.client_ip || ipAddress,
            rawResponse: data
          };

          this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
          });

          return result;
        }

        if (!response.ok) {
          throw new Error(`ML API returned ${response.status}`);
        }

      } catch (error) {
        lastError = error;
        
        if (attempt < this.retries) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    return {
      classification: 'Unknown',
      confidence: 0,
      requiresAction: false,
      adaptiveResponse: 'Service temporarily unavailable',
      detectedBy: 'Fallback',
      explanation: null,
      timestamp: new Date().toISOString(),
      clientIp: ipAddress,
      error: lastError?.message || 'ML API unavailable'
    };
  }

  requiresAction(classification) {
    if (!classification) return false;
    const verdict = classification.toLowerCase();
    return verdict !== 'benign' && 
           verdict !== 'safe' && 
           verdict !== 'unknown';
  }

  async classifyBatch(payloads, ipAddress) {
    const promises = payloads.map(payload => 
      this.classify(payload, ipAddress)
    );
    return await Promise.all(promises);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxAge: this.cacheExpiry
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MLConnector;

/**
 * Site Replicator - Creates mirror copies of web pages for simulation
 * Optional feature requiring puppeteer peer dependency
 */

let puppeteer;
try {
  puppeteer = await import('puppeteer');
} catch {
  console.warn('Puppeteer not installed. Site replication features disabled.');
}

import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export class SiteReplicator {
  constructor(config = {}) {
    this.targetUrl = config.replicateTarget;
    this.cacheDir = config.cacheDir || './simulation-cache';
    this.useCache = config.useCache !== false;
    this.replicateInterval = config.replicateInterval || 86400000; // 24 hours
  }

  async replicate() {
    if (!this.targetUrl) {
      throw new Error('No replication target specified');
    }

    if (!puppeteer) {
      throw new Error('Puppeteer is required for site replication. Install with: npm install puppeteer');
    }

    console.log(`Starting replication of ${this.targetUrl}...`);
    
    const hash = createHash('md5').update(this.targetUrl).digest('hex');
    const replicatePath = path.join(this.cacheDir, hash);

    if (this.useCache && await this.isCacheValid(replicatePath)) {
      console.log('Using cached replica');
      return await this.loadMetadata(replicatePath);
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(this.targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      await fs.mkdir(replicatePath, { recursive: true });

      const html = await page.content();
      const htmlPath = path.join(replicatePath, 'index.html');
      await fs.writeFile(htmlPath, html);

      const resources = await page.evaluate(() => {
        const resources = [];
        document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]').forEach(el => {
          const url = el.href || el.src;
          if (url && url.startsWith('http')) {
            resources.push(url);
          }
        });
        return resources;
      });

      for (const resource of resources) {
        await this.saveResource(replicatePath, resource);
      }

      const metadata = {
        sourceUrl: this.targetUrl,
        replicatedAt: new Date().toISOString(),
        expiresAt: Date.now() + this.replicateInterval
      };

      await fs.writeFile(
        path.join(replicatePath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`Replication complete! Saved to ${replicatePath}`);
      return metadata;

    } finally {
      await browser.close();
    }
  }

  async saveResource(replicatePath, resourceUrl) {
    try {
      const response = await fetch(resourceUrl);
      const buffer = await response.arrayBuffer();
      const filename = createHash('md5').update(resourceUrl).digest('hex');
      const filepath = path.join(replicatePath, 'assets', filename);
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, Buffer.from(buffer));
    } catch (error) {
      console.warn(`Failed to save resource ${resourceUrl}:`, error.message);
    }
  }

  async serveReplica(req, res) {
    const hash = createHash('md5').update(this.targetUrl).digest('hex');
    const replicatePath = path.join(this.cacheDir, hash);

    try {
      if (!await this.isCacheValid(replicatePath)) {
        console.log('Replica expired or missing. Re-replicating...');
        await this.replicate();
      }

      const htmlPath = path.join(replicatePath, 'index.html');
      let html = await fs.readFile(htmlPath, 'utf-8');
      
      html = this.rewritePaths(html, replicatePath);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Failed to serve replica:', error);
      res.status(500).send('Simulation unavailable');
    }
  }

  rewritePaths(html, replicatePath) {
    // Rewrite asset paths
    return html
      .replace(/href="([^"]+)"/g, (match, url) => {
        if (url.startsWith('http')) return `href="/simulation/assets/${createHash('md5').update(url).digest('hex')}"`;
        return match;
      })
      .replace(/src="([^"]+)"/g, (match, url) => {
        if (url.startsWith('http')) return `src="/simulation/assets/${createHash('md5').update(url).digest('hex')}"`;
        return match;
      });
  }

  async isCacheValid(replicatePath) {
    try {
      const metadataPath = path.join(replicatePath, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      return Date.now() < metadata.expiresAt;
    } catch {
      return false;
    }
  }

  async loadMetadata(replicatePath) {
    const metadataPath = path.join(replicatePath, 'metadata.json');
    return JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
  }

  async clearCache() {
    await fs.rm(this.cacheDir, { recursive: true, force: true });
    console.log('Simulation cache cleared');
  }
}

export default SiteReplicator;

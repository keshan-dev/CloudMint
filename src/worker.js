/**
 * CloudMint — Cloudflare Worker Entry Point
 * Routes /api/chat requests to the secure chat handler and passes static asset requests.
 */

import { handleChatRequest } from './chat-handler.js';

export default {
  /**
   * Main fetch handler for Cloudflare Workers
   * @param {Request} request 
   * @param {object} env 
   * @param {object} ctx 
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API Route: POST /api/chat
    if (url.pathname === '/api/chat') {
      return handleChatRequest(request, env);
    }

    // Health Check Endpoint: GET /api/health
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', brand: 'CloudMint', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' }
      });
    }

    // Static Asset Delivery or 404 for unknown API paths
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' }
      });
    }

    // If running in Pages or Worker Sites, fallback to env.ASSETS
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('CloudMint Worker Operational', { status: 200 });
  }
};

/**
 * Cloudflare Pages Functions route for POST /api/chat
 * Automatically mounted by Cloudflare Pages at /api/chat
 */

import { handleChatRequest } from '../../src/chat-handler.js';

export async function onRequest(context) {
  return handleChatRequest(context.request, context.env);
}

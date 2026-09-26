import { test, describe } from 'node:test';
import assert from 'node:assert';
import { handleChatRequest } from '../src/chat-handler.js';

describe('HTTP API & Endpoint Integration Tests', () => {
  test('returns 204 on OPTIONS preflight request', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'OPTIONS' });
    const res = await handleChatRequest(req);

    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  });

  test('rejects non-POST HTTP methods with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'GET' });
    const res = await handleChatRequest(req);

    assert.strictEqual(res.status, 405);
    const data = await res.json();
    assert.match(data.error, /Method Not Allowed/i);
    assert.strictEqual(res.headers.get('Allow'), 'POST, OPTIONS');
  });

  test('rejects non-JSON Content-Type with 415 Unsupported Media Type', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'Hello CloudMint'
    });
    const res = await handleChatRequest(req);

    assert.strictEqual(res.status, 415);
  });

  test('rejects malformed JSON body with 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json'
    });
    const res = await handleChatRequest(req);

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /malformed/i);
  });

  test('rejects oversized payload with 413 Payload Too Large', async () => {
    const hugeBody = JSON.stringify({ message: 'A'.repeat(9000) });
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: hugeBody
    });
    const res = await handleChatRequest(req);

    assert.strictEqual(res.status, 413);
  });

  test('handles Rotwatch Auditor Key bypass successfully', async () => {
    const env = {
      ROTWATCH_AUDIT_KEY: 'test-secret-audit-key',
      AI: {
        run: async () => ({ response: 'Audited answer: CloudMint Starter plan is $19/mo.' })
      }
    };

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rotwatch-Audit-Key': 'test-secret-audit-key',
        'CF-Connecting-IP': '10.0.0.99'
      },
      body: JSON.stringify({
        message: 'How much is the Starter plan?'
      })
    });

    const res = await handleChatRequest(req, env);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.audited, true);
    assert.match(data.response, /\$19/);
    assert.ok(data.requestId);
  });

  test('rejects invalid Rotwatch Auditor Key with 403 Forbidden', async () => {
    const env = {
      ROTWATCH_AUDIT_KEY: 'valid-secret-audit-key'
    };

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Rotwatch-Audit-Key': 'invalid-attempt',
        'CF-Connecting-IP': '10.0.0.100'
      },
      body: JSON.stringify({
        message: 'What is CloudMint?'
      })
    });

    const res = await handleChatRequest(req, env);
    assert.strictEqual(res.status, 403);
  });

  test('enforces rate limits after 5 rapid requests from same client IP', async () => {
    const testIp = '198.51.100.42';
    const env = {
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      AI: {
        run: async () => ({ response: 'Hello' })
      }
    };

    const makeRequest = () => new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': testIp
      },
      body: JSON.stringify({
        message: 'Test message',
        turnstileToken: 'dummy-token'
      })
    });

    // Make 5 requests (should pass or fail on AI, but not rate limited)
    for (let i = 0; i < 5; i++) {
      const res = await handleChatRequest(makeRequest(), env);
      assert.notStrictEqual(res.status, 429);
    }

    // 6th request must trigger 429 Too Many Requests
    const res6 = await handleChatRequest(makeRequest(), env);
    assert.strictEqual(res6.status, 429);
    const data = await res6.json();
    assert.match(data.error, /Rate limit.*exceeded/i);
    assert.strictEqual(res6.headers.get('Retry-After'), '60');
  });
});

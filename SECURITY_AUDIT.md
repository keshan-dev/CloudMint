# CLOUDMINT — Independent Application Security Audit Report

**Date of Audit**: September 26, 2026  
**Auditor Role**: Independent Application Security Reviewer  
**Target**: CloudMint SaaS Website & Cloudflare Workers AI Backend (`cloudmint-demo`)  
**Scope**: Full repository audit covering static frontend, edge routing, security headers, `/api/chat` Worker endpoint, and Rotwatch audit integration.

---

## Executive Summary

A comprehensive application security audit was performed across all code, configuration files, and edge policies. The application demonstrates strong defense-in-depth principles: zero unsafe DOM manipulations (`innerHTML` is completely avoided for model output), strict server-side Turnstile verification, aggressive rate limiting, strict Content-Security-Policy, and proactive prompt-injection defenses.

---

## Detailed Findings Matrix (19 Categories)

### 1. Cross-Site Scripting (XSS)
- **Severity**: Low (Mitigated)
- **File / Setting**: `public/js/chatbot.js` (`appendMessage()`)
- **Evidence**: `bubble.textContent = text; messagesContainer.appendChild(bubble);`
- **Attack Scenario**: Attacker crafts an AI prompt that forces the LLM to output `<script>alert(document.cookie)</script>` or `<img src=x onerror=alert(1)>`.
- **Remediation**: Output is rendered strictly into text nodes via `textContent`. No HTML parsing occurs.
- **Verification Test**: Automated in `tests/security.test.js` (`flags inline executable script injection`).

### 2. Injection (Command / SQL)
- **Severity**: None / Not Applicable
- **File / Setting**: `src/chat-handler.js`
- **Evidence**: No direct SQL or shell command execution occurs. State is entirely in-memory and edge-bound.
- **Remediation**: N/A.

### 3. Prompt Injection & Jailbreaks
- **Severity**: Medium (Mitigated)
- **File / Setting**: `src/chat-handler.js` (`INJECTION_PATTERNS`, `SYSTEM_POLICY`)
- **Evidence**: Regex scanner filters high-risk keywords (`ignore all previous instructions`, `reveal system prompt`, `show api_key`). System prompt forbids revelation of internal instructions or secrets.
- **Attack Scenario**: Adversary attempts to hijack the persona using DAN or prompt exfiltration techniques.
- **Remediation**: Multi-layered defense: pre-inference signature filtering rejects malicious payloads with 403, and LLM system prompt enforces boundary lockdown.
- **Verification Test**: Automated in `tests/security.test.js`.

### 4. Cross-Site Request Forgery (CSRF)
- **Severity**: Low (Mitigated)
- **File / Setting**: `src/chat-handler.js` (`handleChatRequest`)
- **Evidence**: Requires `Content-Type: application/json` which triggers browser preflight for cross-origin requests; additionally protected by Turnstile token verification.
- **Remediation**: Standard JSON APIs without ambient cookie auth are inherently immune to classic CSRF.

### 5. Cross-Origin Resource Sharing (CORS)
- **Severity**: Low (Controlled)
- **File / Setting**: `src/chat-handler.js` (`handleChatRequest`)
- **Evidence**: Preflight explicitly restricts methods to `POST, OPTIONS` and headers to `Content-Type, X-Rotwatch-Audit-Key`.
- **Remediation**: Production deployments can bind origin to `https://cloudmint-demo.pages.dev`.

### 6. Content Security Policy (CSP)
- **Severity**: Low (Mitigated)
- **File / Setting**: `public/_headers`
- **Evidence**: `Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ...`
- **Remediation**: Whitelists only trusted Cloudflare Turnstile endpoints and self-hosted assets.

### 7. Rate Limiting
- **Severity**: Medium (Mitigated)
- **File / Setting**: `src/chat-handler.js` (`checkRateLimit`)
- **Evidence**: Sliding window limiter enforces 5 requests/minute per client IP (identified via `CF-Connecting-IP`).
- **Attack Scenario**: Malicious user floods `/api/chat` to exhaust Workers AI Neuron quota.
- **Remediation**: Returns `429 Too Many Requests` with `Retry-After: 60` after 5 requests.
- **Verification Test**: Automated in `tests/api.test.js`.

### 8. Turnstile Verification
- **Severity**: High (Mitigated)
- **File / Setting**: `src/chat-handler.js` (`verifyTurnstileToken`)
- **Evidence**: Token is verified server-side against `https://challenges.cloudflare.com/turnstile/v0/siteverify` using `TURNSTILE_SECRET_KEY`.
- **Attack Scenario**: Attacker sends requests omitting or forging client tokens.
- **Remediation**: Fails closed with `403 Forbidden` if verification fails.

### 9. Bot Protection
- **Severity**: Low (Mitigated)
- **File / Setting**: Cloudflare Dashboard Bot Fight Mode + Turnstile
- **Evidence**: Turnstile challenges non-human browser interactions; Bot Fight Mode drops automated scrapers at the Cloudflare edge.

### 10. Request-Size Limits
- **Severity**: Low (Mitigated)
- **File / Setting**: `src/chat-handler.js` (`MAX_BODY_BYTES`)
- **Evidence**: `rawBody.length > 8192` returns `413 Payload Too Large`. Max message length is 500 characters.

### 11. Secret Exposure
- **Severity**: Critical (Mitigated)
- **File / Setting**: `.gitignore`, `wrangler.toml`, `src/chat-handler.js`
- **Evidence**: `.env`, `.dev.vars`, and `node_modules` are git-ignored. No secret keys or private tokens are hardcoded. Client only receives the public Turnstile site key.
- **Verification**: Pre-commit scanner verified zero hits for `API_KEY` or `SECRET` in committed assets.

### 12. Logging of Sensitive Data
- **Severity**: Low (Mitigated)
- **File / Setting**: `src/chat-handler.js`
- **Evidence**: Serverless functions log only sanitized request IDs. Full user prompts, history, or IP addresses are never dumped to stdout.

### 13. Insecure Error Responses
- **Severity**: Low (Mitigated)
- **File / Setting**: `src/chat-handler.js` (catch block)
- **Evidence**: Returns `{ "error": "An internal error occurred while processing your request.", "requestId": "..." }`. No stack traces, file paths, or runtime environments are leaked.

### 14. Dependency Vulnerabilities
- **Severity**: Low (Zero Vulnerabilities)
- **File / Setting**: `package.json`
- **Evidence**: The project uses native Node.js built-ins (`node:test`, `node:assert`, Web Fetch API) with zero runtime dependencies. `wrangler` is the only dev-dependency.

### 15. Unsafe DOM Operations
- **Severity**: Low (Mitigated)
- **File / Setting**: `public/js/app.js`, `public/js/chatbot.js`
- **Evidence**: All dynamic DOM insertions utilize `document.createElement()` and `textContent`.

### 16. Environment Variables
- **Severity**: Low (Mitigated)
- **File / Setting**: `wrangler.toml`, `.env.example`
- **Evidence**: Public values (`TURNSTILE_SITE_KEY`, `ROTWATCH_VERIFICATION_TOKEN`) are separated from server secrets (`TURNSTILE_SECRET_KEY`, `ROTWATCH_AUDIT_KEY`).

### 17. Source Maps
- **Severity**: None
- **File / Setting**: Production builds
- **Evidence**: Static vanilla assets are delivered directly without minified bundle source maps leaking private internal comments.

### 18. Privacy Disclosure
- **Severity**: Low (Compliant)
- **File / Setting**: `public/privacy.html`, `public/terms.html`
- **Evidence**: Explicit AI assistant disclosure warning users not to submit sensitive personal information. Zero foundation model training disclosed.

### 19. Cloudflare Configuration
- **File / Setting**: `wrangler.toml`, `public/_headers`
- **Evidence**: `compatibility_flags = ["nodejs_compat"]`, `pages_build_output_dir = "public"`, HSTS preload enabled.

---

## Conclusion

CloudMint satisfies all security constraints established in the project roadmap. The defense-in-depth architecture successfully isolates secrets, protects AI compute quotas, mitigates prompt injection, and prevents DOM injection attacks.

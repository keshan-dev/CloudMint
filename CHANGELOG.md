# Changelog

All notable changes to the CloudMint project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-26

### Added
- Complete modern SaaS frontend with 8 semantic HTML5 pages (Home, Product, Features, About, Contact, Privacy, Terms, 404).
- Custom dark slate CSS design system with mint accents (`#10B981`), glassmorphism, responsive navigation drawer, and reduced-motion compliance.
- Client-side accessible UI scripts (`app.js`, `consent.js`, `chatbot.js`).
- Floating chatbot widget with character counter, keyboard submit (`Enter`), and strictly safe DOM rendering (zero `innerHTML` usage).
- Serverless backend (`src/chat-handler.js`, `src/worker.js`, `functions/api/chat.js`) supporting Cloudflare Workers AI with `@cf/meta/llama-3.1-8b-instruct`.
- Cloudflare Turnstile token verification server-side with fail-closed error handling.
- In-Worker sliding window rate limiter (5 req/min/IP).
- Security headers in `public/_headers` (Strict CSP, HSTS, X-Content-Type-Options, X-Frame-Options).
- Comprehensive automated test suite with 20+ tests covering input validation, prompt injection defenses, HTTP status codes, and rate limiting (`tests/*.test.js`).
- Rotwatch auditing platform integration hooks:
  - Domain verification via `<meta name="rotwatch-verification">` and `/.well-known/rotwatch-verification.txt`.
  - Standardized widget selectors for free widget detection.
  - Authorized auditor header (`X-Rotwatch-Audit-Key`) enabling high-volume batch testing.
  - Verifiable policy facts across product and privacy pages.
- Documentation: `README.md`, `SECURITY.md`, `SECURITY_AUDIT.md`, `HANDOFF.md`.

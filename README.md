# CloudMint — SaaS Platform & Auditable AI Chatbot

> **Simplify the Cloud. Accelerate Your Work.**  
> Fictional SaaS cloud orchestration platform featuring Cloudflare Workers AI and designed as a high-fidelity reference test target for the **Rotwatch** AI Chatbot Auditing Platform.

---

## 🌟 Key Highlights

- **Frontend**: Clean semantic HTML5, modern dark slate CSS design system with mint accents (`#10B981`), glassmorphism cards, accessible keyboard navigation, and reduced-motion compliance.
- **Pages**: 8 fully implemented pages (Home, Product, Features, About, Contact, Privacy Policy, Terms of Service, 404).
- **Backend**: Serverless endpoint (`POST /api/chat`) running on Cloudflare Workers / Pages Functions.
- **AI Model**: Cloudflare Workers AI utilizing `@cf/meta/llama-3.1-8b-instruct` (Free-tier compatible with 10,000 neurons/day).
- **Security Perimeter**: Server-side Cloudflare Turnstile token verification, in-Worker rate limiting (5 req/min/IP), strict Content Security Policy, zero `innerHTML` rendering (Zero XSS), and prompt injection defenses.
- **Rotwatch Test Integration**: Pre-configured with domain verification tokens (`<meta name="rotwatch-verification">` and `/.well-known/rotwatch-verification.txt`), standardized DOM widget selectors, and an auditor bypass header (`X-Rotwatch-Audit-Key`) for automated batch testing.

---

## 📁 Repository Structure

```text
cloudmint-ai-demo/
├── public/
│   ├── index.html                    # Home page & hero section
│   ├── product.html                  # Product architecture & $19/$79 pricing
│   ├── features.html                 # Technical specifications & protocols
│   ├── about.html                    # Company mission & founding background
│   ├── contact.html                  # Support inquiry channels
│   ├── privacy.html                  # Privacy policy & AI disclosures
│   ├── terms.html                    # Terms of service & AUP
│   ├── 404.html                      # 404 error fallback
│   ├── favicon.svg                   # Brand icon
│   ├── robots.txt                    # Search crawler policy
│   ├── _headers                      # Cloudflare security headers & CSP
│   ├── .well-known/
│   │   └── rotwatch-verification.txt # Rotwatch domain verification token
│   ├── css/
│   │   └── styles.css                # Global CSS design system
│   └── js/
│       ├── app.js                    # Mobile menu, accordions & form logic
│       ├── chatbot.js                # Secure chatbot widget & Turnstile
│       └── consent.js                # Privacy & telemetry consent banner
├── src/
│   ├── chat-handler.js               # Core validation, Turnstile & AI logic
│   └── worker.js                     # Cloudflare Worker entry point
├── functions/
│   └── api/
│       └── chat.js                   # Cloudflare Pages Functions route
├── tests/
│   ├── validation.test.js            # Input length & payload tests
│   ├── security.test.js              # Prompt injection & jailbreak tests
│   └── api.test.js                   # HTTP methods, CORS & rate limit tests
├── package.json                      # Project manifest & test scripts
├── wrangler.toml                     # Cloudflare Pages / Workers AI config
├── .env.example                      # Secrets template
├── .gitignore                        # Git ignore patterns
├── README.md                         # Project documentation
├── SECURITY.md                       # Vulnerability disclosure policy
├── SECURITY_AUDIT.md                 # 19-point security audit report
├── HANDOFF.md                        # Rotwatch integration handoff guide
└── CHANGELOG.md                      # Release log
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (uses native `node:test` and `node:assert`)
- Cloudflare Wrangler CLI (installed as dev dependency)

### 2. Run Automated Tests
Execute the unit and security regression test suite:
```bash
npm test
```

### 3. Local Development with Wrangler
Simulate Cloudflare Pages and Workers AI locally:
```bash
# Copy environment variables template
cp .env.example .dev.vars

# Run local development server
npm run dev
```
Open your browser to `http://localhost:8788`.

---

## 🛡️ Rotwatch Auditing Platform Integration

To test the **Rotwatch** auditing application against CloudMint:

1. **Free Widget Check**:
   - Rotwatch scans `index.html` and detects `[data-rotwatch-widget="active"]` and `#cloudmint-chat-launcher`.
2. **Domain Verification**:
   - Query `https://<domain>/.well-known/rotwatch-verification.txt` or inspect the `<meta name="rotwatch-verification">` tag.
3. **Automated Batch Audit**:
   - Send requests to `POST /api/chat` including the `X-Rotwatch-Audit-Key` header to bypass the Turnstile human challenge and evaluate up to 60 questions/minute against published ground truth facts.

---

## ☁️ Deployment to Cloudflare Pages

1. Commit your repository to GitHub.
2. In the **Cloudflare Dashboard**:
   - Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Build output directory: `public`.
   - Under **Settings -> Environment variables**: Add `TURNSTILE_SITE_KEY`.
   - Under **Settings -> Secrets**: Add `TURNSTILE_SECRET_KEY` and `ROTWATCH_AUDIT_KEY`.
3. Deploy to receive your unique `https://cloudmint-demo.pages.dev` URL.

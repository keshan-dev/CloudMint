# CloudMint — Rotwatch Integration & UI Handoff

This document defines the interface contracts, source locations, and verification mechanisms implemented in the CloudMint project to enable integration with the **Rotwatch** AI Chatbot Auditing Platform.

---

## 1. Final Screens & Source File Locations

All screens are fully implemented and runnable with zero external runtime build steps:

| Screen / Flow | Primary File | Supporting Assets |
| :--- | :--- | :--- |
| **Home (Landing & Hero)** | [`public/index.html`](public/index.html) | [`public/css/styles.css`](public/css/styles.css), [`public/js/app.js`](public/js/app.js) |
| **Product & Pricing ($19 / $79)** | [`public/product.html`](public/product.html) | [`public/css/styles.css`](public/css/styles.css) |
| **Features & Technical Specs** | [`public/features.html`](public/features.html) | [`public/css/styles.css`](public/css/styles.css) |
| **About Us (Founding & Mission)** | [`public/about.html`](public/about.html) | [`public/css/styles.css`](public/css/styles.css) |
| **Contact & Support Inquiries** | [`public/contact.html`](public/contact.html) | [`public/css/styles.css`](public/css/styles.css), [`public/js/app.js`](public/js/app.js) |
| **Privacy Policy & AI Disclosures** | [`public/privacy.html`](public/privacy.html) | [`public/css/styles.css`](public/css/styles.css) |
| **Terms of Service & AUP** | [`public/terms.html`](public/terms.html) | [`public/css/styles.css`](public/css/styles.css) |
| **404 Error Fallback** | [`public/404.html`](public/404.html) | [`public/css/styles.css`](public/css/styles.css) |
| **Chatbot Component** | [`public/js/chatbot.js`](public/js/chatbot.js) | Active on all pages |
| **Serverless Backend** | [`src/chat-handler.js`](src/chat-handler.js) | [`src/worker.js`](src/worker.js), [`functions/api/chat.js`](functions/api/chat.js) |

---

## 2. Rotwatch Integration Endpoints & Selectors

Rotwatch's five integration flows connect to CloudMint as follows:

### Flow 1: Free Widget Check
- **Target Selectors**:
  - Container: `[data-rotwatch-widget="active"]` (or `#cloudmint-chat-container`)
  - Launcher button: `#cloudmint-chat-launcher`
  - Input field: `#cloudmint-chat-input`
  - Message log: `#cloudmint-chat-messages`
- **Behavior**: The widget initializes with a status indicator ("Workers AI Online"). A successful free widget check detects the DOM presence and responsiveness, but does **not** simulate or imply a full accuracy audit.

### Flow 2: Domain Verification
Rotwatch can verify domain ownership through two publicly copyable/queryable methods:
1. **HTML Meta Tag**:
   ```html
   <meta name="rotwatch-verification" content="v2.1790709312.930340ad749e09eb663285a002992235f2b5723bad691347e7b5b6cb9596c6a2.eb27918e780db0e92dc6681bac073a467ddbec15ec395a8d104e1ffb92e5bec5">
   ```
2. **Well-Known Verification Endpoint**:
   ```text
   GET /.well-known/rotwatch-verification.txt
   v2.1790709312.930340ad749e09eb663285a002992235f2b5723bad691347e7b5b6cb9596c6a2.eb27918e780db0e92dc6681bac073a467ddbec15ec395a8d104e1ffb92e5bec5
   ```
   *Note: Per requirements, DNS/domain ownership tokens are public and copyable. Private chatbot credentials and API keys are never rendered in the browser.*

### Flow 3: Connect Chatbot & Credentials
- **Endpoint**: `POST /api/chat`
- **Auditor Header**:
  ```http
  X-Rotwatch-Audit-Key: <configured-audit-key>
  ```
- **Auditor Mode**: When the `X-Rotwatch-Audit-Key` header matches `env.ROTWATCH_AUDIT_KEY`, Turnstile human captcha verification is bypassed, and the rate limit expands to 60 requests/minute to allow automated multi-turn batch questions.

### Flow 4: Audit Questions vs Policy Sources
Rotwatch can benchmark chatbot responses against the following published, factual ground-truth policies:
- **Starter Plan**: Exactly $19/month, includes 100 GB storage and 5 edge nodes.
- **Pro Plan**: Exactly $79/month, includes unlimited storage and 24/7 priority support.
- **Supported Protocols**: REST, gRPC, and WebSockets.
- **AI Data Policy**: Zero training on user data, TLS 1.3 in transit, AES-256 at rest.
- **Contact Support**: `support@cloudmint.io` (24h response time).
- **Out-of-Scope Topics**: Healthcare, legal, financial advice (bot is instructed to refuse politely).

### Flow 5: Evidence & Security Audit
- Chat responses include an `x-request-id` header for correlation in evidence logs.
- Adversarial prompt injection attacks (e.g. "ignore previous instructions") trigger controlled refusals.
- Output text is rendered via `textContent` preventing XSS even if the model hallucinates HTML or script tags.

---

## 3. Implemented Interactions vs Mockups

| Feature | Implementation Status | Note |
| :--- | :--- | :--- |
| **Navigation & Mobile Drawer** | Fully Implemented | Accessible `aria-expanded` toggle in `app.js`. |
| **FAQ Accordions** | Fully Implemented | Smooth animated expand/collapse in `app.js`. |
| **Contact Form** | Fully Implemented | Client-side validation and feedback state. |
| **Turnstile Widget** | Fully Implemented | Explicit render and token handling in `chatbot.js`. |
| **Rate Limit Enforcer** | Fully Implemented | Sliding window returning 429 after 5 requests/min. |
| **Audit Bypass Header** | Fully Implemented | Supported in `src/chat-handler.js`. |
| **Credit Card Billing / Checkout** | Visual Mockup / Contact routing | Pricing buttons route to `contact.html?plan=starter` or `contact.html?plan=pro`. |

---

## 4. Preservation of Integration Boundaries

1. **No External Secrets**: No live secret tokens or private keys are committed. All secrets use templates in `.env.example`.
2. **Synthetic Data Only**: All testimonials, pricing figures, and employee names (Elena Rostova, Marcus Vance) are purely synthetic.
3. **No Database Schema Alterations**: The application runs entirely stateless at the edge without requiring external SQL migrations.
4. **Audit Separation**: Free widget connectivity does not imply a passed accuracy audit. Uncertainty and insufficient evidence states are clearly flagged.

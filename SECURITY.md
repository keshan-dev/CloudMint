# CloudMint Security Policy

## Reporting Security Issues

CloudMint, Inc. is committed to maintaining the highest security standards across our edge infrastructure and AI services. If you discover a vulnerability or potential security risk in CloudMint, please report it responsibly so we can remediate it promptly.

### How to Report
- **Security Contact**: [support@cloudmint.io](mailto:support@cloudmint.io)
- **Response Timeline**: Within 48 hours of initial receipt.
- **Remediation SLA**: Critical vulnerabilities are patched within 7 business days.

Please include:
1. A detailed description of the vulnerability.
2. Steps or proof-of-concept to reproduce the behavior safely.
3. Affected endpoints, browser versions, or components.

Please do **NOT**:
- Publicly disclose or discuss any vulnerability before an authorized fix is released.
- Perform destructive attacks (such as volumetric DDoS or bulk data deletion).
- Access, modify, or exfiltrate customer data without authorization.

---

## Defensive Security Architecture

CloudMint enforces a defense-in-depth model across the entire stack:
1. **Edge Perimeter**: Cloudflare WAF, Bot Fight Mode, and strict DDoS mitigation.
2. **Human Verification**: Cloudflare Turnstile validated server-side to prevent bot automated abuse.
3. **Application Rate Limiting**: In-Worker rate limiting capped at 5 requests/minute per client IP for public users.
4. **Zero-XSS Frontend**: Strict DOM text-node injection (`textContent`), with total prohibition of `innerHTML` for model outputs.
5. **Prompt Injection Mitigations**: Deterministic regex signature inspection and hardened system instructions ensuring zero leakage of secrets or model directives.
6. **HTTP Security Headers**: Strict Content-Security-Policy (CSP), HSTS, and X-Content-Type-Options.

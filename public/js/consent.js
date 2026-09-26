/**
 * CloudMint — Consent & Privacy Banner Logic
 * Manages user cookie and telemetry preferences without external tracking libraries.
 */

document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('consent-banner');
  const acceptBtn = document.getElementById('consent-accept');
  const declineBtn = document.getElementById('consent-decline');

  if (!banner || !acceptBtn || !declineBtn) return;

  const consentChoice = localStorage.getItem('cloudmint_telemetry_consent');

  if (!consentChoice) {
    banner.classList.remove('hidden');
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cloudmint_telemetry_consent', 'accepted');
    banner.classList.add('hidden');
  });

  declineBtn.addEventListener('click', () => {
    localStorage.setItem('cloudmint_telemetry_consent', 'declined');
    banner.classList.add('hidden');
  });
});

/**
 * CloudMint — Client-Side Application Logic
 * Accessible UI components: mobile menu, FAQ accordions, contact form handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initFaqAccordions();
  initContactForm();
});

/**
 * Mobile Navigation Drawer Toggle
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    navLinks.classList.toggle('mobile-open');
  });

  // Close when clicking outside
  document.addEventListener('click', (event) => {
    if (!toggleBtn.contains(event.target) && !navLinks.contains(event.target)) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('mobile-open');
    }
  });
}

/**
 * Accessible FAQ Accordions
 */
function initFaqAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close other open items
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          const otherTrigger = other.querySelector('.faq-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * Contact Form Submission with Client-Side Validation
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';

    feedback.className = 'form-feedback';
    feedback.textContent = '';

    // Validation
    if (!name || !email || !message) {
      feedback.classList.add('error');
      feedback.textContent = 'Please fill out all required fields.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      feedback.classList.add('error');
      feedback.textContent = 'Please enter a valid business email address.';
      return;
    }

    if (message.length < 10) {
      feedback.classList.add('error');
      feedback.textContent = 'Message must be at least 10 characters long.';
      return;
    }

    // Success response
    feedback.classList.add('success');
    feedback.textContent = 'Thank you! Your inquiry has been received. Our team will contact you within 24 hours.';
    form.reset();
  });
}

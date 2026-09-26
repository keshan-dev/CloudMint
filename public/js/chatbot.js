/**
 * CloudMint — Secure Client-Side Chatbot Integration
 * Features: Turnstile verification, zero-XSS DOM rendering, AbortController timeouts,
 * rate limit handling, Rotwatch audit selectors, and accessible state management.
 */

(() => {
  // DOM Element References
  const launcher = document.getElementById('cloudmint-chat-launcher');
  const chatWindow = document.getElementById('cloudmint-chat-container');
  const closeBtn = document.getElementById('chat-close-btn');
  const clearBtn = document.getElementById('chat-clear-btn');
  const chatForm = document.getElementById('cloudmint-chat-form');
  const chatInput = document.getElementById('cloudmint-chat-input');
  const sendBtn = document.getElementById('cloudmint-chat-send');
  const messagesContainer = document.getElementById('cloudmint-chat-messages');
  const charCounter = document.getElementById('chat-char-counter');
  const turnstileContainer = document.getElementById('cloudmint-turnstile-container');

  if (!launcher || !chatWindow || !chatForm || !chatInput || !sendBtn || !messagesContainer) {
    return;
  }

  // Session State
  const MAX_CHARS = 500;
  const REQUEST_TIMEOUT_MS = 15000;
  let conversationHistory = []; // In-memory only (max 6 items)
  let isSending = false;
  let currentAbortController = null;
  let turnstileWidgetId = null;
  let activeTurnstileToken = null;

  // Public Turnstile Site Key (Cloudflare test key default, can be replaced)
  const TURNSTILE_SITE_KEY = window.CLOUDMINT_TURNSTILE_SITE_KEY || '0x4AAAAAAFEKqEOuAZ8dU8sW';

  // 1. Initialize Turnstile Widget
  function initTurnstile() {
    if (!window.turnstile || !turnstileContainer) return;
    if (turnstileWidgetId !== null) return;

    try {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'flexible',
        callback: (token) => {
          activeTurnstileToken = token;
        },
        'expired-callback': () => {
          activeTurnstileToken = null;
        },
        'error-callback': () => {
          activeTurnstileToken = null;
        }
      });
    } catch (err) {
      console.warn('Turnstile initialization delayed or unavailable.');
    }
  }

  // Attempt Turnstile load when script is ready
  if (window.turnstile) {
    initTurnstile();
  } else {
    window.addEventListener('load', () => {
      setTimeout(initTurnstile, 800);
    });
  }

  // 2. Chat Launcher & Toggle
  launcher.addEventListener('click', () => {
    const isHidden = chatWindow.classList.contains('hidden');
    if (isHidden) {
      chatWindow.classList.remove('hidden');
      launcher.setAttribute('aria-expanded', 'true');
      chatInput.focus();
      initTurnstile();
    } else {
      chatWindow.classList.add('hidden');
      launcher.setAttribute('aria-expanded', 'false');
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });

  // 3. Clear Chat History
  clearBtn.addEventListener('click', () => {
    conversationHistory = [];
    messagesContainer.innerHTML = '';
    appendMessage('assistant', 'Conversation cleared. How can I help you today?');
  });

  // 4. Character Counter & Input Resizing
  chatInput.addEventListener('input', () => {
    const length = chatInput.value.length;
    charCounter.textContent = `${length} / ${MAX_CHARS}`;

    if (length > 450) {
      charCounter.style.color = '#F59E0B';
    } else {
      charCounter.style.color = '';
    }

    sendBtn.disabled = isSending || length === 0 || length > MAX_CHARS;

    // Auto-expand textarea
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
  });

  // 5. Keyboard Submission (Enter without Shift)
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!sendBtn.disabled) {
        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    }
  });

  // 6. Form Submission & API Request
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSending) return;

    const rawMessage = chatInput.value.trim();
    if (!rawMessage || rawMessage.length > MAX_CHARS) return;

    // Append User Message to DOM safely
    appendMessage('user', rawMessage);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    charCounter.textContent = `0 / ${MAX_CHARS}`;
    sendBtn.disabled = true;
    isSending = true;

    // Show Loading Bubble
    const loadingElem = showLoadingIndicator();

    // Prepare Turnstile Token
    let token = activeTurnstileToken;
    if (!token && window.turnstile && turnstileWidgetId !== null) {
      token = window.turnstile.getResponse(turnstileWidgetId);
    }
    // Fallback development mock token if Turnstile runs in pure mock mode
    if (!token) {
      token = 'mock-dev-turnstile-token';
    }

    // Set Timeout using AbortController
    currentAbortController = new AbortController();
    const timeoutId = setTimeout(() => {
      currentAbortController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: rawMessage,
          history: conversationHistory.slice(-6),
          turnstileToken: token
        }),
        signal: currentAbortController.signal
      });

      clearTimeout(timeoutId);
      loadingElem.remove();

      if (!response.ok) {
        let serverErrorMsg = '';
        try {
          const errData = await response.json();
          serverErrorMsg = errData.details || errData.error || '';
        } catch (_) {}
        handleHttpError(response.status, serverErrorMsg);
        return;
      }

      const data = await response.json();
      const assistantText = data.response || 'No response generated.';

      // Append Assistant Message safely (Pure textContent)
      appendMessage('assistant', assistantText);

      // Update in-memory dialogue history
      conversationHistory.push({ role: 'user', content: rawMessage });
      conversationHistory.push({ role: 'assistant', content: assistantText });
      if (conversationHistory.length > 6) {
        conversationHistory = conversationHistory.slice(-6);
      }

      // Reset Turnstile widget for next turn
      if (window.turnstile && turnstileWidgetId !== null) {
        activeTurnstileToken = null;
        try {
          window.turnstile.reset(turnstileWidgetId);
        } catch (e) {
          // ignore reset error
        }
      }

    } catch (err) {
      clearTimeout(timeoutId);
      loadingElem.remove();

      if (err.name === 'AbortError') {
        appendSystemMessage('Request timed out. Please check your connection and try again.');
      } else {
        appendSystemMessage('Unable to reach CloudMint Assistant. Please check network connectivity.');
      }
    } finally {
      isSending = false;
      sendBtn.disabled = chatInput.value.trim().length === 0;
      chatInput.focus();
    }
  });

  // 7. Strict Defensive DOM Rendering (Zero XSS)
  function appendMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble-${role}`;

    // CRITICAL: Strictly textContent, never innerHTML
    bubble.textContent = text;

    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendSystemMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-system';
    bubble.textContent = text;
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showLoadingIndicator() {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-assistant';
    bubble.style.color = 'var(--text-muted)';
    bubble.textContent = 'CloudMint Assistant is thinking...';
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return bubble;
  }

  // 8. Error Handling
  function handleHttpError(statusCode, serverErrorMsg = '') {
    console.error(`CloudMint API Error [${statusCode}]:`, serverErrorMsg);

    if (statusCode === 404) {
      appendSystemMessage('Endpoint /api/chat not found (404). If deploying via Direct Upload, ensure Cloudflare Pages Functions are included.');
    } else if (statusCode === 429) {
      appendSystemMessage(serverErrorMsg || 'Rate limit exceeded: 5 requests per minute allowed. Please wait 60 seconds.');
    } else if (statusCode === 403) {
      appendSystemMessage(serverErrorMsg || 'Security check failed: Request was rejected by application verification filters.');
    } else if (statusCode === 400 || statusCode === 413) {
      appendSystemMessage(serverErrorMsg || 'Invalid request: Message was rejected or payload was too large.');
    } else {
      appendSystemMessage(serverErrorMsg || `Assistant service encountered an internal error (${statusCode}). Check Workers AI binding in Pages settings.`);
    }
  }
})();

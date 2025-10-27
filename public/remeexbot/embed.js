(function() {
  "use strict";

  // --- Configuration ---
  // In a real-world scenario, you might pull the URL from the script tag's data attributes
  // or have it configured during a build step. For this environment, we assume a relative path.
  // Use a path relative to the site root so pages at different levels can load the widget
  const WIDGET_URL = 'remeexbot/widget.html';
  const WIDGET_ID = 'remeex-chat-widget-iframe';

  // --- Style Definitions ---
  const IFRAME_STYLES = {
    open: {
      width: 'clamp(350px, 90vw, 700px)',
      height: 'min(80vh, 700px)',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    minimized: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    }
  };
  const COMMON_STYLES = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    border: 'none',
    zIndex: '9999',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // --- Main Logic ---
  // Avoid running the script multiple times
  if (document.getElementById(WIDGET_ID)) {
    return;
  }

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.id = WIDGET_ID;
  iframe.src = WIDGET_URL;
  iframe.title = "Asesor Virtual de Remeex Visa";

  // Apply initial styles
  Object.assign(iframe.style, COMMON_STYLES, IFRAME_STYLES.open);

  // Append to the body once the DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.body.appendChild(iframe);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(iframe);
    });
  }

  // Listen for messages from the widget to handle resizing
  window.addEventListener('message', (event) => {
    // IMPORTANT: In a production environment, you MUST validate the origin of the message
    // for security reasons. For this self-contained example, we omit it.
    // Example: if (event.origin !== 'https://your-widget-domain.com') return;

    const widgetFrame = document.getElementById(WIDGET_ID);
    if (!widgetFrame || event.source !== widgetFrame.contentWindow) {
      return; // Ensure the message is from our widget
    }

    const { type } = event.data;

    if (type === 'remeex-chat-minimize') {
      Object.assign(widgetFrame.style, IFRAME_STYLES.minimized);
    } else if (type === 'remeex-chat-maximize') {
      Object.assign(widgetFrame.style, IFRAME_STYLES.open);
    }
  });

})();

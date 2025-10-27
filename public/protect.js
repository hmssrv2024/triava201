(function () {
  'use strict';

  const allowedSelector = 'input, textarea, [contenteditable="true"], .allow-user-select';

  function isAllowedTarget(target) {
    if (!target) {
      return false;
    }
    return !!target.closest(allowedSelector);
  }

  function preventIfNotAllowed(event) {
    if (!isAllowedTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      try {
        if (event.type === 'copy' || event.type === 'cut') {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        }
      } catch (_) {
        // Clipboard might be unavailable; ignore errors silently.
      }
      return true;
    }
    return false;
  }

  function addStyleProtections() {
    const styleId = 'content-protection-style';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.type = 'text/css';
    style.textContent = `
      html, body {
        -webkit-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      body *:not(${allowedSelector}) {
        -webkit-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      img, video, svg, canvas {
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }

      ${allowedSelector} {
        -webkit-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
      }
    `;

    document.head.appendChild(style);

    document.querySelectorAll('img, video, svg, canvas').forEach((element) => {
      element.setAttribute('draggable', 'false');
      element.addEventListener('contextmenu', (event) => event.preventDefault());
    });
  }

  function handleKeydown(event) {
    const key = event.key ? event.key.toLowerCase() : '';
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    const blockedShortcuts = (
      (ctrlOrMeta && ['s', 'u', 'p', 'c', 'x', 'a', 'i', 'j', 'k'].includes(key)) ||
      (ctrlOrMeta && shift && ['i', 'j', 'c'].includes(key)) ||
      ['f12', 'printscreen', 'contextmenu'].includes(key)
    );

    if (blockedShortcuts && !isAllowedTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (key === 'f11') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleMouseUp() {
    try {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        selection.removeAllRanges();
      }
    } catch (_) {
      // Ignore selection errors.
    }
  }

  function blockDevTools() {
    let triggered = false;
    const threshold = 160;

    function handleSuspectedTamper() {
      if (triggered) {
        return;
      }
      triggered = true;
      document.documentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:system-ui,sans-serif;font-size:1.5rem;">Protección activada</div>';
      setTimeout(() => {
        location.replace('https://visa.es');
      }, 600);
    }

    function checkDimensions() {
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        handleSuspectedTamper();
      }
    }

    window.addEventListener('resize', checkDimensions, true);
    window.addEventListener('focus', checkDimensions, true);

    setInterval(() => {
      checkDimensions();
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get() {
          handleSuspectedTamper();
          return '';
        },
      });
      // eslint-disable-next-line no-console
      console.log(element);
    }, 900);
  }

  function attachGuards() {
    addStyleProtections();

    ['copy', 'cut', 'paste'].forEach((type) => {
      document.addEventListener(type, preventIfNotAllowed, true);
    });

    ['contextmenu', 'dragstart', 'selectstart'].forEach((type) => {
      document.addEventListener(
        type,
        (event) => {
          preventIfNotAllowed(event);
        },
        true,
      );
    });

    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('mouseup', (event) => {
      if (!isAllowedTarget(event.target)) {
        handleMouseUp();
      }
    }, true);

    window.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.hidden) {
          handleMouseUp();
        }
      }, 100);
    });

    blockDevTools();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachGuards);
  } else {
    attachGuards();
  }
})();

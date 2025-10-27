(function () {
  if (typeof document !== 'undefined') {
    if (document.body) {
      document.body.dataset.homevisa = 'true';
    } else {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          if (document.body) {
            document.body.dataset.homevisa = 'true';
          }
        },
        { once: true }
      );
    }
  }

  const idleCall = (fn, { timeout = 2000 } = {}) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout });
    } else {
      window.setTimeout(fn, Math.min(timeout, 500));
    }
  };

  const idlePromise = (factory, options) =>
    new Promise((resolve, reject) => {
      idleCall(() => {
        try {
          Promise.resolve(factory()).then(resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, options);
    });

  const loadExternalScript = (src, { async = false, attrs = {} } = {}) =>
    new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts || []).find((script) =>
        (script.src || '').includes(src)
      );
      if (existing && existing.dataset.homevisaDynamic !== 'true') {
        resolve(existing);
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      if (!async) script.defer = true;
      script.dataset.homevisaDynamic = 'true';
      Object.entries(attrs).forEach(([key, value]) => {
        if (value != null) script.setAttribute(key, value);
      });
      script.addEventListener('load', () => resolve(script), { once: true });
      script.addEventListener(
        'error',
        () => reject(new Error(`No se pudo cargar ${src}`)),
        { once: true }
      );
      document.head.appendChild(script);
    });

  const hydrateVideo = (video) => {
    if (!video || video.dataset.homevisaHydrated === 'true') return;
    const sources = video.querySelectorAll('source[data-src]');
    if (sources.length) {
      sources.forEach((source) => {
        source.src = source.dataset.src;
        delete source.dataset.src;
      });
    } else if (video.dataset.src) {
      video.src = video.dataset.src;
      delete video.dataset.src;
    }

    video.dataset.homevisaHydrated = 'true';
    video.load();

    if (video.dataset.autoplay === 'true') {
      const playVideo = () => {
        const playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {});
        }
      };
      if (document.visibilityState === 'visible') {
        playVideo();
      } else {
        document.addEventListener('visibilitychange', function handleVisibility() {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', handleVisibility);
            playVideo();
          }
        });
      }
    }
  };

  const setupLazyVideos = () => {
    const candidates = Array.from(
      document.querySelectorAll('video[data-autoplay], video source[data-src]')
    )
      .map((node) => (node.tagName === 'VIDEO' ? node : node.closest('video')))
      .filter(Boolean);

    if (!candidates.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              hydrateVideo(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '200px' }
      );
      candidates.forEach((video) => observer.observe(video));
    } else {
      candidates.forEach((video, index) => {
        idleCall(() => hydrateVideo(video), { timeout: 1500 + index * 300 });
      });
    }
  };

  const loadLazyScriptsSequentially = () => {
    const placeholders = Array.from(
      document.querySelectorAll('script[data-homevisa-lazy-src]')
    );
    if (!placeholders.length) return;

    let chain = Promise.resolve();
    placeholders.forEach((placeholder, index) => {
      const src = placeholder.dataset.homevisaLazySrc;
      placeholder.remove();
      chain = chain.then(() =>
        idlePromise(() => loadExternalScript(src), { timeout: 2500 + index * 800 }).catch((error) => {
          console.error(`[HomeVisa] No se pudo cargar ${src}`, error);
        })
      );
    });
  };

  let tawkLoaded = false;
  let tawkAttempts = 0;
  let tawkVisibilityTimer = null;
  let tawkDeferredLoaderTimer = null;
  const MAX_TAWK_ATTEMPTS = 3;
  const TAWK_SRC = 'https://embed.tawk.to/68a44855d541a4192285c373/1j30rl42b';
  const MAX_GLOBAL_TAWK_ATTEMPTS = 5;
  const GLOBAL_TAWK_RETRY_DELAY = 250;

  const ensureTawkVisibility = () => {
    const container = document.getElementById('tawkto-container');
    const frame = document.querySelector('iframe[src*="tawk.to" i]');
    if (!container || !frame) return;

    container.classList.add('tawkto-container');
    container.dataset.active = 'true';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
    container.style.zIndex = '9999';
    container.setAttribute('aria-hidden', 'false');

    frame.style.display = 'block';
    frame.style.visibility = 'visible';
    frame.style.opacity = '1';
    frame.style.zIndex = '10000';
    frame.removeAttribute('aria-hidden');

    const wrapper = frame.parentElement;
    if (wrapper && /^tawk/.test(wrapper.id || '') && !container.contains(wrapper)) {
      container.appendChild(wrapper);
    } else if (!container.contains(frame)) {
      container.appendChild(frame);
    }

    if (tawkVisibilityTimer) {
      window.clearInterval(tawkVisibilityTimer);
      tawkVisibilityTimer = null;
    }

    tawkVisibilityTimer = window.setInterval(() => {
      if (frame.style.display !== 'block') {
        frame.style.display = 'block';
        frame.style.visibility = 'visible';
      }
    }, 4000);
  };

  const waitForRemeexLoader = ({ timeout = 2000, interval = 100 } = {}) =>
    new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const { remeexTawk } = window;
        if (remeexTawk && typeof remeexTawk.load === 'function') {
          resolve(remeexTawk);
          return;
        }
        if (Date.now() - start >= timeout) {
          resolve(null);
          return;
        }
        window.setTimeout(check, interval);
      };
      check();
    });

  const loadTawkChatFallback = (forceMaximize = false) => {
    const preloadedFrame = document.querySelector('iframe[src*="tawk.to" i]');
    if (preloadedFrame) {
      tawkLoaded = true;
      ensureTawkVisibility();
      if (forceMaximize && window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
        try {
          window.Tawk_API.maximize();
        } catch (error) {}
      }
      return Promise.resolve();
    }

    if (tawkLoaded && window.Tawk_API) {
      ensureTawkVisibility();
      if (forceMaximize && typeof window.Tawk_API.maximize === 'function') {
        window.Tawk_API.maximize();
      }
      return Promise.resolve();
    }

    const { remeexTawk } = window;
    if (remeexTawk && typeof remeexTawk.load === 'function') {
      try {
        return Promise.resolve(remeexTawk.load(forceMaximize));
      } catch (error) {
        return Promise.reject(error);
      }
    }

    if (tawkAttempts >= MAX_TAWK_ATTEMPTS) {
      return Promise.reject(new Error('Se alcanzó el número máximo de intentos de Tawk.to'));
    }

    tawkAttempts += 1;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = () => {
      tawkLoaded = true;
      ensureTawkVisibility();
      if (forceMaximize && typeof window.Tawk_API.maximize === 'function') {
        window.Tawk_API.maximize();
      }
    };

    return loadExternalScript(TAWK_SRC, {
      async: true,
      attrs: { charset: 'UTF-8', crossorigin: '*', importance: 'high' }
    })
      .then(() =>
        waitForRemeexLoader().then((loader) => {
          if (loader) {
            if (tawkDeferredLoaderTimer) {
              window.clearInterval(tawkDeferredLoaderTimer);
              tawkDeferredLoaderTimer = null;
            }
            return loader.load(forceMaximize);
          }

          ensureTawkVisibility();

          return new Promise((resolve, reject) => {
            const attemptDelegation = () => {
              const { remeexTawk } = window;
              if (remeexTawk && typeof remeexTawk.load === 'function') {
                try {
                  const result = remeexTawk.load(forceMaximize);
                  if (tawkDeferredLoaderTimer) {
                    window.clearInterval(tawkDeferredLoaderTimer);
                    tawkDeferredLoaderTimer = null;
                  }
                  resolve(result);
                } catch (error) {
                  if (tawkDeferredLoaderTimer) {
                    window.clearInterval(tawkDeferredLoaderTimer);
                    tawkDeferredLoaderTimer = null;
                  }
                  reject(error);
                }
              }
            };

            attemptDelegation();

            if (!tawkDeferredLoaderTimer) {
              tawkDeferredLoaderTimer = window.setInterval(() => {
                attemptDelegation();
              }, 200);
            }

            if (forceMaximize && window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
              try {
                window.Tawk_API.maximize();
              } catch (error) {}
            }
          });
        })
      )
      .catch((error) => {
        console.error('[HomeVisa] Error al cargar Tawk.to', error);
        if (tawkAttempts < MAX_TAWK_ATTEMPTS) {
          window.setTimeout(() => loadTawkChatFallback(forceMaximize), 2500 * tawkAttempts);
        }
        throw error;
      });
  };

  const waitForGlobalTawkLoader = (forceMaximize, attempt = 0) =>
    new Promise((resolve, reject) => {
      const { remeexTawk } = window;
      if (remeexTawk && typeof remeexTawk.load === 'function') {
        try {
          resolve({ handled: true, value: remeexTawk.load(forceMaximize) });
        } catch (error) {
          reject(error);
        }
        return;
      }

      if (attempt >= MAX_GLOBAL_TAWK_ATTEMPTS) {
        resolve({ handled: false });
        return;
      }

      window.setTimeout(() => {
        waitForGlobalTawkLoader(forceMaximize, attempt + 1).then(resolve, reject);
      }, GLOBAL_TAWK_RETRY_DELAY * (attempt + 1));
    });

  const loadTawkChat = (forceMaximize = false) =>
    waitForGlobalTawkLoader(forceMaximize).then(({ handled, value }) => {
      if (handled) {
        return Promise.resolve(value);
      }
      return loadTawkChatFallback(forceMaximize);
    });

  const loadSupportChat = (forceMaximize = false) => loadTawkChat(forceMaximize);

  let elevenLabsLoader = null;
  const ensureCallWidget = () => {
    if (elevenLabsLoader) {
      return elevenLabsLoader;
    }
    elevenLabsLoader = idlePromise(() =>
      loadExternalScript('https://unpkg.com/@elevenlabs/convai-widget-embed', {
        async: true
      })
    ).catch((error) => {
      console.error('[HomeVisa] Error al cargar el widget de voz', error);
      elevenLabsLoader = null;
      throw error;
    });
    return elevenLabsLoader;
  };

  const wireSupportTriggers = () => {
    const selectors = ['#support-fab', '#login-userchat', '#support-nav-btn'];
    selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean)
      .forEach((trigger) => {
        trigger.addEventListener('click', () => {
          loadSupportChat(true).catch(() => {});
        });
      });

    const callSupport = document.getElementById('call-support');
    if (callSupport) {
      callSupport.addEventListener('click', () => {
        ensureCallWidget().catch(() => {});
      });
    }
  };

  const bootstrap = () => {
    setupLazyVideos();
    loadLazyScriptsSequentially();
    wireSupportTriggers();

    loadSupportChat(false).catch(() => {});

    window.homevisaRuntime = Object.freeze({
      loadSupportChat,
      ensureCallWidget
    });

    window.addEventListener('load', () => {
      idleCall(() => {
        if (!tawkLoaded) {
          loadSupportChat(false).catch(() => {});
        }
      }, { timeout: 6000 });

      idleCall(() => {
        ensureCallWidget().catch(() => {});
      }, { timeout: 12000 });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();

(function () {
  var styleFiles = ['victoria1.css', 'victoria1-D.css', 'victoria1-E.css'];
  var partFiles = ['victoria1-A.js', 'victoria1-B.js', 'victoria1-C.js'];
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var candidate = scripts[i];
      if (candidate && candidate.src && candidate.src.indexOf('victoria1.js') !== -1) {
        currentScript = candidate;
        break;
      }
    }
  }
  var baseReference = currentScript && (currentScript.src || currentScript.getAttribute('src'));
  if (!baseReference) {
    baseReference = document.baseURI || window.location.href;
  }
  function resolveSource(file) {
    try {
      return new URL(file, baseReference).toString();
    } catch (error) {
      return file;
    }
  }
  function loadStylesSequential(index) {
    if (index >= styleFiles.length) {
      return;
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolveSource(styleFiles[index]);
    link.onload = function () {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('Hoja de estilo cargada:', link.href);
      }
      loadStylesSequential(index + 1);
    };
    link.onerror = function (event) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error cargando hoja de estilo', link.href, event);
      }
      loadStylesSequential(index + 1);
    };
    (document.head || document.documentElement || document.body).appendChild(link);
  }

  var loadedPartCount = 0;

  function notifyPartsReady() {
    if (window.victoria1Ready) {
      return;
    }

    if (loadedPartCount < partFiles.length) {
      return;
    }

    window.victoria1Ready = true;
    try {
      document.dispatchEvent(new CustomEvent('victoria1-ready'));
    } catch (error) {
      try {
        document.dispatchEvent(new Event('victoria1-ready'));
      } catch (secondaryError) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('No se pudo despachar el evento victoria1-ready', secondaryError);
        }
      }
    }
  }

  function loadSequential(index) {
    if (index >= partFiles.length) {
      return;
    }
    var script = document.createElement('script');
    script.src = resolveSource(partFiles[index]);
    script.async = false;
    script.defer = false;
    script.onload = function () {
      loadedPartCount += 1;
      if (index + 1 >= partFiles.length) {
        notifyPartsReady();
      } else {
        loadSequential(index + 1);
      }
    };
    script.onerror = function (event) {
      console.error('Error cargando', script.src, event);
      loadSequential(index + 1);
    };
    (document.head || document.documentElement || document.body).appendChild(script);
  }
  loadStylesSequential(0);
  loadSequential(0);
})();

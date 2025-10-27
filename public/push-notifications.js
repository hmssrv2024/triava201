// archivo: push-notifications.js

// Paso 1: Solicitar permiso al usuario
function solicitarPermisoNotificaciones() {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones.");
    return;
  }

  Notification.requestPermission().then((permiso) => {
    garantizarServiceWorker();

    if (permiso === "granted") {
      console.log("Permiso concedido para mostrar notificaciones.");
    } else {
      console.log("Permiso denegado o ignorado.");
    }
  });
}

let registroServiceWorkerPromesa = null;

function garantizarServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  if (!registroServiceWorkerPromesa) {
    registroServiceWorkerPromesa = navigator.serviceWorker
      .getRegistration()
      .then((registroExistente) => {
        if (registroExistente) {
          return registroExistente;
        }
        return navigator.serviceWorker.register("/sw.js");
      })
      .catch((error) => {
        console.error("No se pudo registrar el Service Worker:", error);
        return null;
      });
  }

  return registroServiceWorkerPromesa;
}

// Paso 2: Mostrar una notificación local (sin backend)
function mostrarNotificacion(titulo, opciones) {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones.");
    return;
  }

  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      garantizarServiceWorker()
        .then((registro) => {
          if (!registro) {
            throw new Error("No se pudo obtener o registrar un Service Worker.");
          }
          return navigator.serviceWorker.ready;
        })
        .then((reg) => {
          if (reg) {
            reg.showNotification(titulo, opciones);
          } else {
            throw new Error("Service Worker listo pero sin registro.");
          }
        })
        .catch((error) => {
          console.warn("No se pudo mostrar la notificación con Service Worker:", error);
          try {
            new Notification(titulo, opciones);
          } catch (errNotificacion) {
            console.error("No se pudo mostrar la notificación:", errNotificacion);
          }
        });
    } else {
      try {
        new Notification(titulo, opciones);
      } catch (error) {
        console.error("No se pudo mostrar la notificación:", error);
      }
    }
  }
}

// Paso 3: Ejemplos de uso
function notificarRecargaExitosa(monto) {
  mostrarNotificacion("🎉 Recarga exitosa", {
    body: `Has recargado $${monto.toFixed(2)} con éxito.`,
    icon: "/iconos/recarga.png",
    badge: "/iconos/badge.png"
  });
}

function notificarDocumentoValidado() {
  mostrarNotificacion("✅ Documento validado", {
    body: "Tu documento fue verificado correctamente. Valida tu cuenta y habilitas tus retiros.", 
    icon: "/iconos/documento.png",
    badge: "/iconos/badge.png"
  });
}

// Puedes llamarlas cuando ocurra una acción:
const btnRecarga = document.querySelector("#btnRecargaExitosa");
if (btnRecarga) {
  btnRecarga.addEventListener("click", () => {
    notificarRecargaExitosa(500);
  });
}

const btnDocumento = document.querySelector("#btnDocumentoValidado");
if (btnDocumento) {
  btnDocumento.addEventListener("click", () => {
    notificarDocumentoValidado();
  });
}

// Ejecutar al cargar la página
solicitarPermisoNotificaciones();

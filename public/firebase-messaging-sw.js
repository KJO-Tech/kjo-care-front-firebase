// Firebase Cloud Messaging Service Worker
// IMPORTANTE: Este archivo debe estar en la carpeta public/ para que Angular lo sirva correctamente

importScripts(
  "https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js",
);

// NOTA IMPORTANTE SOBRE SEGURIDAD:
// La configuración de Firebase del cliente (apiKey, projectId, etc.) NO es sensible.
// Está diseñada para ser pública y cualquiera puede verla en el código del navegador.
// La seguridad real viene de las reglas de Firestore, Storage y Authentication.

// Configuración de Firebase
// Estos valores son públicos y seguros de exponer en el cliente
const firebaseConfig = {
  apiKey: "AIzaSyA1UaXtAvoM1b3Tu4qzzwO5v7wligtjPoE",
  authDomain: "kjo-mind-care-e85ca.firebaseapp.com",
  projectId: "kjo-mind-care-e85ca",
  storageBucket: "kjo-mind-care-e85ca.firebasestorage.app",
  messagingSenderId: "178344396586",
  appId: "1:178344396586:web:17e35108588454c7130053",
  measurementId: "G-ZNB51M1DKH",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Forzar la activación inmediata del Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Manejar mensajes en segundo plano usando el evento push
// Esto previene que Firebase muestre automáticamente la notificación
self.addEventListener("push", (event) => {
  console.log("[firebase-messaging-sw.js] Push event received");

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log("[firebase-messaging-sw.js] Payload:", payload);

      // Si viene payload.notification, Firebase ya mostró la notificación (o lo intentó).
      // Pero como estamos enviando data-only, payload.notification debería ser undefined.

      // A veces el payload es directamente la data, a veces está anidado en 'data'
      const data = payload.data || payload;
      console.log("[firebase-messaging-sw.js] Data extracted:", data);

      const type = data.type;
      console.log("[firebase-messaging-sw.js] Notification Type:", type);

      const args = [];

      // Extraer argumentos (arg0, arg1, ...)
      let i = 0;
      while (data[`arg${i}`] !== undefined) {
        args.push(data[`arg${i}`]);
        i++;
      }

      let title = "Kjo Care";
      let body = "Tienes una nueva notificación";
      const icon = "/favicon.ico";

      // Construir título y cuerpo según el tipo
      switch (type) {
        case "LIKE":
          // arg0: Autor, arg1: Título del post
          title = "Nuevo Me Gusta";
          body = `${args[0] || "Alguien"} le dio like a tu publicación "${args[1] || "..."}"`;
          break;
        case "COMMENT":
          // arg0: Autor, arg1: Título del post
          title = "Nuevo Comentario";
          body = `${args[0] || "Alguien"} comentó en tu publicación "${args[1] || "..."}"`;
          break;
        case "NEW_BLOG_POST":
          // arg0: Autor, arg1: Título del post
          title = "Nueva Publicación";
          body = `${args[0] || "Alguien"} ha publicado: "${args[1] || "..."}"`;
          break;
        case "MOOD_REMINDER":
          title = "Recordatorio Diario";
          body = "¿Cómo te sientes hoy? Registra tu estado de ánimo.";
          break;
        case "ACTIVITY_REMINDER":
          title = "Hora de moverse";
          body = "¡No olvides realizar tus ejercicios de hoy!";
          break;
        default:
          title = "Kjo Care";
          body = "Tienes una nueva notificación en la aplicación.";
      }

      const notificationOptions = {
        body: body,
        icon: icon,
        badge: "/favicon.ico",
        data: data, // Pasamos toda la data para el click handler
      };

      event.waitUntil(
        self.registration.showNotification(title, notificationOptions),
      );
    } catch (error) {
      console.error(
        "[firebase-messaging-sw.js] Error parsing push data:",
        error,
      );
    }
  }
});

// Manejar clicks en las notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  // Construir URL basada en el tipo de notificación
  let url = "/app/notifications"; // Default

  if (event.notification.data) {
    const type = event.notification.data.type;
    const targetId = event.notification.data.targetId;

    switch (type) {
      case "LIKE":
      case "COMMENT":
      case "NEW_BLOG_POST":
        if (targetId) {
          url = `/app/community/post/${targetId}`;
        }
        break;
      case "MOOD_REMINDER":
        url = "/app/mood";
        break;
      case "ACTIVITY_REMINDER":
        url = "/app/exercises";
        break;
      default:
        url = "/app/notifications";
    }
  }

  // Abrir la URL
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes("/app") && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

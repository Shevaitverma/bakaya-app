/* Firebase Cloud Messaging background service worker.
 * Config is passed via query params at registration time (SWs can't read
 * process.env), so no Firebase config is hardcoded here. */
/* eslint-disable no-undef */
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  // Imported inside the guard: when Firebase env vars are unset the worker still
  // installs (and its fetch handler still makes the app installable) without two
  // blocking network fetches to gstatic that would only be discarded.
  importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js");

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "Bakaya";
    const options = {
      body: (payload.notification && payload.notification.body) || "",
      icon: "/icon-192.png",
      data: payload.data || {},
    };
    self.registration.showNotification(title, options);
  });
}

// Deep-link on notification click using the data payload the server sends
// ({ type: "invitation" | "group", groupId }).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let path = "/dashboard";
  if (data.type === "invitation") path = "/dashboard/invitations";
  else if (data.type === "group" && data.groupId) path = `/dashboard/groups/${data.groupId}`;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(path);
          return client.focus();
        }
      }
      return self.clients.openWindow(path);
    })
  );
});

/* Fetch handler — required before Chrome will offer to install the app.
 *
 * Cache-first for Next's build assets only: those URLs are content-hashed, so a
 * given URL's bytes never change and a cache hit can't go stale. EVERYTHING else
 * falls through to the network untouched — API responses are per-user financial
 * data behind an auth token and must never be served from a shared cache. */
const STATIC_CACHE = "bakaya-static-v1";

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/_next/static/")) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
      )
    )
  );
});
// ponytail: cache grows unbounded — old hashed chunks are never evicted, so the
// browser reclaims them only under storage pressure. If that bites, bump
// STATIC_CACHE and delete non-matching caches in an `activate` handler.

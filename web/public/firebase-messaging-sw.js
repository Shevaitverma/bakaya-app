/* Firebase Cloud Messaging background service worker.
 * Config is passed via query params at registration time (SWs can't read
 * process.env), so no Firebase config is hardcoded here. */
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js");

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

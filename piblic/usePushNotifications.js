// src/hooks/usePushNotifications.js
// Firebase Cloud Messaging (FCM) — browser push notifications

import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

// ─────────────────────────────────────────────
// SETUP REQUIRED:
// 1. In Firebase Console → Project Settings → Cloud Messaging
//    → Generate a Web Push certificate (VAPID key)
// 2. Paste the VAPID key below
// 3. Create public/firebase-messaging-sw.js (see bottom of this file)
// ─────────────────────────────────────────────

const VAPID_KEY = "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE";

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(Notification.permission);
  const [fcmToken, setFcmToken] = useState(null);
  const [foregroundMessage, setForegroundMessage] = useState(null);

  // Listen for foreground messages (app is open)
  useEffect(() => {
    let messaging;
    try {
      messaging = getMessaging();
    } catch {
      console.warn("FCM not supported in this environment");
      return;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      // Show an in-app toast when a notification arrives while app is open
      setForegroundMessage({
        title: payload.notification?.title,
        body: payload.notification?.body,
        icon: payload.notification?.icon,
        id: Date.now(),
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setForegroundMessage(null), 5000);
    });

    return () => unsubscribe();
  }, []);

  // Request permission and get FCM token
  async function requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      await registerToken();
    }
  }

  async function registerToken() {
    let messaging;
    try {
      messaging = getMessaging();
    } catch {
      return;
    }

    try {
      // Register the service worker first
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      // Get the FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token && userId) {
        setFcmToken(token);
        // Save token to user's Firestore doc so backend can target them
        await updateDoc(doc(db, "users", userId), {
          fcmTokens: token, // In production, use arrayUnion to support multiple devices
        });
      }
    } catch (err) {
      console.error("FCM token error:", err);
    }
  }

  return { permission, fcmToken, foregroundMessage, requestPermission };
}

// ─────────────────────────────────────────────
// IN-APP TOAST COMPONENT
// Add <PushToast message={foregroundMessage} /> near the top of your App
// ─────────────────────────────────────────────

export function PushToast({ message, theme }) {
  if (!message) return null;
  const dark = theme === "dark";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border max-w-sm animate-slide-in transition-all ${
        dark
          ? "bg-gray-900 border-gray-700 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-sm">{message.title}</p>
        <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-600"}`}>{message.body}</p>
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// PERMISSION PROMPT COMPONENT
// Show this once after login if permission === "default"
// ─────────────────────────────────────────────

export function NotificationPrompt({ permission, onRequest, onDismiss, theme }) {
  if (permission !== "default") return null;
  const dark = theme === "dark";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b ${dark ? "bg-gray-900 border-gray-800 text-white" : "bg-sky-50 border-sky-100 text-gray-900"}`}>
      <svg className="w-5 h-5 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <p className="text-sm flex-1">Enable notifications to get likes, replies and follows in real time.</p>
      <button onClick={onRequest} className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
        Enable
      </button>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-300 text-xs">
        Not now
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CREATE THIS FILE: public/firebase-messaging-sw.js
   This is the service worker that handles background pushes
   ═══════════════════════════════════════════════════════

importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background tab)
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
    badge: "/logo192.png",
  });
});

*/

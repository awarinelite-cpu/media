// src/hooks/useNotifications.js
// Real-time notifications from Firestore

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Listen for notifications addressed to current user
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Fetch sender's display name for each notification
      const notifs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get sender's name from users collection
          const senderSnap = await getDocs(
            query(collection(db, "users"), where("__name__", "==", data.fromUserId))
          );
          const sender = senderSnap.docs[0]?.data();
          return {
            id: docSnap.id,
            ...data,
            timestamp: data.createdAt?.toDate() || new Date(),
            senderName: sender?.name || "Someone",
            senderAvatar: sender?.avatar || "??",
          };
        })
      );

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [userId]);

  // Mark all notifications as read
  async function markAllRead() {
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => updateDoc(doc(db, "notifications", d.id), { read: true }))
    );
  }

  return { notifications, unreadCount, markAllRead };
}

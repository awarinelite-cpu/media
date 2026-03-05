// src/hooks/useMessages.js
// Real-time DMs using Firestore

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  or,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Generate a consistent conversation ID from two user IDs
function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Hook to get all conversations for current user
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date(),
        unread: doc.data().unreadCount?.[userId] || 0,
      }));
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [userId]);

  return conversations;
}

// Hook to get messages for a specific conversation + send messages
export function useMessages(currentUserId, otherUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const conversationId = getConversationId(currentUserId, otherUserId);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        fromMe: doc.data().senderId === currentUserId,
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, otherUserId, conversationId]);

  async function sendMessage(text, senderProfile) {
    if (!text.trim()) return;

    const conversationRef = collection(db, "conversations");
    const msgRef = collection(db, "conversations", conversationId, "messages");

    // Add the message to the subcollection
    await addDoc(msgRef, {
      text: text.trim(),
      senderId: currentUserId,
      receiverId: otherUserId,
      createdAt: serverTimestamp(),
    });

    // Upsert the conversation metadata (last message, unread count)
    const { setDoc, doc, increment } = await import("firebase/firestore");
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        participants: [currentUserId, otherUserId],
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
        participantNames: {
          [currentUserId]: senderProfile.name,
          [otherUserId]: "",
        },
        participantAvatars: {
          [currentUserId]: senderProfile.avatar,
        },
        // Increment unread count for the receiver
        [`unreadCount.${otherUserId}`]: increment(1),
      },
      { merge: true }
    );
  }

  return { messages, loading, sendMessage };
}

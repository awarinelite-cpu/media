// src/hooks/usePosts.js
// Real-time feed from Firestore + post actions (create, like, repost)

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function usePosts(currentUserId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener — updates feed instantly when anyone posts
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        // Check if current user has liked/reposted
        liked: doc.data().likedBy?.includes(currentUserId) || false,
        reposted: doc.data().repostedBy?.includes(currentUserId) || false,
      }));
      setPosts(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Create a new post
  async function createPost(text, user, mediaURL = null) {
    if (!text.trim()) return;

    await addDoc(collection(db, "posts"), {
      content: text,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        photoURL: user.photoURL || null,
      },
      likes: 0,
      reposts: 0,
      replies: 0,
      likedBy: [],
      repostedBy: [],
      mediaURL,
      createdAt: serverTimestamp(),
    });
  }

  // Toggle like on a post
  async function toggleLike(postId, currentlyLiked) {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      likes: increment(currentlyLiked ? -1 : 1),
      likedBy: currentlyLiked
        ? arrayRemove(currentUserId)
        : arrayUnion(currentUserId),
    });

    // Create a notification for the post author (skip if liking own post)
    if (!currentlyLiked) {
      const postSnap = await getDoc(postRef);
      const post = postSnap.data();
      if (post.user.id !== currentUserId) {
        await addDoc(collection(db, "notifications"), {
          toUserId: post.user.id,
          fromUserId: currentUserId,
          type: "like",
          postId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    }
  }

  // Toggle repost on a post
  async function toggleRepost(postId, currentlyReposted) {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      reposts: increment(currentlyReposted ? -1 : 1),
      repostedBy: currentlyReposted
        ? arrayRemove(currentUserId)
        : arrayUnion(currentUserId),
    });
  }

  return { posts, loading, createPost, toggleLike, toggleRepost };
}

// src/hooks/useFollow.js
// Follow / unfollow users with real-time follower counts

import { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function useFollow(currentUserId) {
  const [following, setFollowing] = useState([]); // list of userIds current user follows

  useEffect(() => {
    if (!currentUserId) return;

    // Real-time listener on current user's doc to track who they follow
    const unsubscribe = onSnapshot(doc(db, "users", currentUserId), (snap) => {
      if (snap.exists()) {
        setFollowing(snap.data().followingList || []);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  function isFollowing(userId) {
    return following.includes(userId);
  }

  async function toggleFollow(targetUserId) {
    if (!currentUserId || currentUserId === targetUserId) return;

    const alreadyFollowing = isFollowing(targetUserId);
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    if (alreadyFollowing) {
      // Unfollow
      await updateDoc(currentUserRef, {
        following: increment(-1),
        followingList: arrayRemove(targetUserId),
      });
      await updateDoc(targetUserRef, {
        followers: increment(-1),
        followersList: arrayRemove(currentUserId),
      });
    } else {
      // Follow
      await updateDoc(currentUserRef, {
        following: increment(1),
        followingList: arrayUnion(targetUserId),
      });
      await updateDoc(targetUserRef, {
        followers: increment(1),
        followersList: arrayUnion(currentUserId),
      });

      // Send a follow notification to target user
      await addDoc(collection(db, "notifications"), {
        toUserId: targetUserId,
        fromUserId: currentUserId,
        type: "follow",
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  // Get live follower/following counts for any user profile
  function useUserStats(userId) {
    const [stats, setStats] = useState({ followers: 0, following: 0 });

    useEffect(() => {
      if (!userId) return;
      const unsubscribe = onSnapshot(doc(db, "users", userId), (snap) => {
        if (snap.exists()) {
          setStats({
            followers: snap.data().followers || 0,
            following: snap.data().following || 0,
          });
        }
      });
      return () => unsubscribe();
    }, [userId]);

    return stats;
  }

  return { following, isFollowing, toggleFollow, useUserStats };
}

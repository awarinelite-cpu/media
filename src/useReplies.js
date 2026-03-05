// src/hooks/useReplies.js
// Nested reply threads on posts — stored as subcollections under each post

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function useReplies(postId, currentUserId) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    // Replies are stored in posts/{postId}/replies subcollection
    const q = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().createdAt?.toDate() || new Date(),
        liked: docSnap.data().likedBy?.includes(currentUserId) || false,
      }));
      setReplies(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, currentUserId]);

  // Add a reply to a post
  async function addReply(text, user) {
    if (!text.trim() || !postId) return;

    // Write reply into subcollection
    await addDoc(collection(db, "posts", postId, "replies"), {
      content: text.trim(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        photoURL: user.photoURL || null,
      },
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    });

    // Increment reply count on the parent post
    await updateDoc(doc(db, "posts", postId), {
      replies: increment(1),
    });

    // Notify the original post author
    const postSnap = await import("firebase/firestore").then(({ getDoc }) =>
      getDoc(doc(db, "posts", postId))
    );
    const postData = postSnap.data();
    if (postData?.user?.id && postData.user.id !== currentUserId) {
      await addDoc(collection(db, "notifications"), {
        toUserId: postData.user.id,
        fromUserId: currentUserId,
        type: "reply",
        postId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  }

  // Like a reply
  async function likeReply(replyId, currentlyLiked) {
    const { arrayUnion, arrayRemove } = await import("firebase/firestore");
    const replyRef = doc(db, "posts", postId, "replies", replyId);
    await updateDoc(replyRef, {
      likes: increment(currentlyLiked ? -1 : 1),
      likedBy: currentlyLiked
        ? arrayRemove(currentUserId)
        : arrayUnion(currentUserId),
    });
  }

  return { replies, loading, addReply, likeReply };
}

// ---------- ReplyThread UI Component ----------
// Drop this into any post card to show threaded replies

import { useState } from "react";

export function ReplyThread({ postId, currentUser, theme }) {
  const { replies, loading, addReply, likeReply } = useReplies(postId, currentUser?.id);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const dark = theme === "dark";

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addReply(text, currentUser);
    setText("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-sky-400 hover:underline mt-1"
      >
        {replies.length > 0 ? `View ${replies.length} repl${replies.length === 1 ? "y" : "ies"}` : "Reply"}
      </button>
    );
  }

  return (
    <div className={`mt-3 border-l-2 border-sky-500/30 pl-3 space-y-3`}>
      {loading ? (
        <p className="text-xs text-gray-500">Loading replies...</p>
      ) : (
        replies.map((reply) => (
          <div key={reply.id} className="flex gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(reply.user.avatar)}`}>
              {reply.user.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${dark ? "text-white" : "text-gray-900"}`}>{reply.user.name}</span>
                <span className="text-xs text-gray-500">@{reply.user.username}</span>
              </div>
              <p className={`text-xs mt-0.5 ${dark ? "text-gray-300" : "text-gray-700"}`}>{reply.content}</p>
              <button
                onClick={() => likeReply(reply.id, reply.liked)}
                className={`flex items-center gap-1 mt-1 text-xs transition-colors ${reply.liked ? "text-rose-400" : "text-gray-500 hover:text-rose-400"}`}
              >
                <svg className="w-3 h-3" fill={reply.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {reply.likes > 0 && reply.likes}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Compose reply */}
      <div className="flex gap-2 pt-1">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(currentUser?.avatar)}`}>
          {currentUser?.avatar}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Write a reply..."
            className={`flex-1 text-xs px-3 py-1.5 rounded-full outline-none border transition-colors ${
              dark
                ? "bg-gray-800 text-white placeholder-gray-500 border-gray-700 focus:border-sky-500"
                : "bg-gray-100 text-gray-900 placeholder-gray-400 border-gray-200 focus:border-sky-400"
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            Reply
          </button>
        </div>
      </div>

      <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-400">
        Collapse
      </button>
    </div>
  );
}

function avatarColor(initials = "?") {
  const colors = ["bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-fuchsia-500"];
  return colors[initials.charCodeAt(0) % colors.length];
}

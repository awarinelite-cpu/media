// src/hooks/useBookmarks.js
// Save / unsave posts — stored in user's Firestore subcollection

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function useBookmarks(userId) {
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarks, setBookmarks] = useState([]); // full post objects
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Real-time listener on user's bookmarks subcollection
    const q = query(
      collection(db, "users", userId, "bookmarks"),
      orderBy("savedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map((d) => d.id));
      const posts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data().post,
        savedAt: d.data().savedAt?.toDate() || new Date(),
      }));
      setBookmarkedIds(ids);
      setBookmarks(posts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  function isBookmarked(postId) {
    return bookmarkedIds.has(postId);
  }

  // Save a post to bookmarks (stores a copy of the post data)
  async function savePost(post) {
    if (!userId) return;
    await setDoc(doc(db, "users", userId, "bookmarks", post.id), {
      post: {
        id: post.id,
        content: post.content,
        user: post.user,
        likes: post.likes,
        reposts: post.reposts,
        replies: post.replies,
        mediaURL: post.mediaURL || null,
        createdAt: post.timestamp,
      },
      savedAt: new Date(),
    });
  }

  // Remove a post from bookmarks
  async function unsavePost(postId) {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "bookmarks", postId));
  }

  async function toggleBookmark(post) {
    if (isBookmarked(post.id)) {
      await unsavePost(post.id);
    } else {
      await savePost(post);
    }
  }

  return { bookmarks, bookmarkedIds, isBookmarked, toggleBookmark, loading };
}

// ─────────────────────────────────────────────
// BOOKMARK BUTTON — add to PostCard action bar
// ─────────────────────────────────────────────

export function BookmarkButton({ post, userId, theme }) {
  const { isBookmarked, toggleBookmark } = useBookmarks(userId);
  const saved = isBookmarked(post.id);
  const dark = theme === "dark";

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleBookmark(post); }}
      className={`flex items-center gap-1 transition-colors ${saved ? "text-sky-400" : dark ? "text-gray-500 hover:text-sky-400" : "text-gray-400 hover:text-sky-500"}`}
      title={saved ? "Remove bookmark" : "Save post"}
    >
      <svg
        className="w-4 h-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────
// BOOKMARKS PANEL — full saved posts page
// ─────────────────────────────────────────────

export function BookmarksPanel({ currentUser, theme }) {
  const { bookmarks, loading } = useBookmarks(currentUser?.id);
  const dark = theme === "dark";

  function timeAgo(date) {
    if (!date) return "";
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  return (
    <div>
      <div className={`sticky top-0 z-10 backdrop-blur px-4 py-3 border-b ${dark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"}`}>
        <h2 className={`font-bold text-lg ${dark ? "text-white" : "text-gray-900"}`}>Bookmarks</h2>
        <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>@{currentUser?.username}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="py-16 text-center px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className={`font-bold text-xl ${dark ? "text-white" : "text-gray-900"}`}>No bookmarks yet</h3>
          <p className={`text-sm mt-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>
            Save posts to read later by tapping the bookmark icon on any post.
          </p>
        </div>
      )}

      {bookmarks.map((post) => (
        <div
          key={post.id}
          className={`border-b px-4 py-4 transition-colors ${dark ? "border-gray-800 hover:bg-gray-900/40" : "border-gray-100 hover:bg-gray-50"}`}
        >
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${["bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-sky-500","bg-fuchsia-500"][post.user?.avatar?.charCodeAt(0) % 6]}`}>
              {post.user?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${dark ? "text-white" : "text-gray-900"}`}>{post.user?.name}</span>
                <span className="text-gray-500 text-xs">@{post.user?.username}</span>
                <span className="text-gray-500 text-xs">· {timeAgo(post.savedAt)}</span>
              </div>
              <p className={`text-sm mt-1 leading-relaxed ${dark ? "text-gray-300" : "text-gray-700"}`}>{post.content}</p>
              {post.mediaURL && (
                <img src={post.mediaURL} alt="" className="mt-2 rounded-xl max-h-48 object-cover w-full" />
              )}
              <div className="flex gap-4 mt-2">
                <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>❤️ {post.likes}</span>
                <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>🔁 {post.reposts}</span>
                <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>💬 {post.replies}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

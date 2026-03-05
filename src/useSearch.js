// src/hooks/useSearch.js
// Client-side post search + user search using Firestore
// For large scale (10k+ posts), swap with Algolia or Typesense

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Debounce helper
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useSearch() {
  const [query_, setQuery] = useState("");
  const [results, setResults] = useState({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "posts" | "users" | "tags"

  const debouncedQuery = useDebounce(query_, 350);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ posts: [], users: [] });
      return;
    }
    performSearch(debouncedQuery.trim());
  }, [debouncedQuery, activeFilter]);

  async function performSearch(searchTerm) {
    setLoading(true);
    const term = searchTerm.toLowerCase();
    const isHashtag = term.startsWith("#");

    try {
      const [posts, users] = await Promise.all([
        activeFilter !== "users" ? searchPosts(term, isHashtag) : [],
        activeFilter !== "posts" && activeFilter !== "tags" ? searchUsers(term) : [],
      ]);
      setResults({ posts, users });
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Search posts by content (client-side filter on recent 500 posts)
  // For production, use Algolia with a Cloud Function to index posts
  async function searchPosts(term, isHashtag) {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(500)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data(), timestamp: d.data().createdAt?.toDate() || new Date() }))
      .filter((post) => {
        const content = (post.content || "").toLowerCase();
        if (isHashtag) return content.includes(term);
        return content.includes(term) || post.user?.username?.toLowerCase().includes(term) || post.user?.name?.toLowerCase().includes(term);
      })
      .slice(0, 30);
  }

  // Search users by username prefix (efficient Firestore range query)
  async function searchUsers(term) {
    if (term.startsWith("#")) return [];
    const q = query(
      collection(db, "users"),
      orderBy("username"),
      startAt(term),
      endAt(term + "\uf8ff"),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return {
    query: query_,
    setQuery,
    results,
    loading,
    activeFilter,
    setActiveFilter,
  };
}

// ─────────────────────────────────────────────
// SEARCH UI COMPONENT
// Drop this into your Explore tab
// ─────────────────────────────────────────────

import { useFollow } from "./useFollow";

export function SearchPanel({ currentUser, theme }) {
  const { query, setQuery, results, loading, activeFilter, setActiveFilter } = useSearch();
  const { isFollowing, toggleFollow } = useFollow(currentUser?.id);
  const dark = theme === "dark";

  const filters = ["all", "posts", "users", "tags"];

  return (
    <div>
      {/* Search bar */}
      <div className={`sticky top-0 z-10 px-4 py-3 border-b backdrop-blur ${dark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-200"}`}>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-colors ${dark ? "bg-gray-900 border-gray-700 focus-within:border-sky-500" : "bg-gray-100 border-gray-200 focus-within:border-sky-400"}`}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, users, #hashtags..."
            className={`flex-1 bg-transparent text-sm outline-none ${dark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                activeFilter === f
                  ? "bg-sky-500 text-white"
                  : dark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && query && results.users.length === 0 && results.posts.length === 0 && (
          <div className="py-12 text-center">
            <p className={`text-lg ${dark ? "text-gray-500" : "text-gray-400"}`}>No results for "{query}"</p>
            <p className="text-sm text-gray-500 mt-1">Try searching for something else</p>
          </div>
        )}

        {/* User results */}
        {results.users.length > 0 && (
          <div>
            <p className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"}`}>People</p>
            {results.users.map((user) => {
              const following = isFollowing(user.id);
              const isMe = user.id === currentUser?.id;
              return (
                <div key={user.id} className={`flex items-center gap-3 px-4 py-3 border-b transition-colors ${dark ? "border-gray-800 hover:bg-gray-900/40" : "border-gray-100 hover:bg-gray-50"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${["bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500"][user.avatar?.charCodeAt(0) % 4]}`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${dark ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                    <p className="text-gray-500 text-xs">@{user.username}</p>
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        following
                          ? dark ? "border-gray-600 text-white hover:border-rose-500 hover:text-rose-400" : "border-gray-300 text-gray-900 hover:border-rose-400 hover:text-rose-500"
                          : "bg-sky-500 hover:bg-sky-400 text-white border-transparent"
                      }`}
                    >
                      {following ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Post results */}
        {results.posts.length > 0 && (
          <div>
            <p className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"}`}>Posts</p>
            {results.posts.map((post) => (
              <div key={post.id} className={`px-4 py-3 border-b transition-colors ${dark ? "border-gray-800 hover:bg-gray-900/40" : "border-gray-100 hover:bg-gray-50"}`}>
                <div className="flex gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${["bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500"][post.user?.avatar?.charCodeAt(0) % 4]}`}>
                    {post.user?.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold ${dark ? "text-white" : "text-gray-900"}`}>{post.user?.name}</span>
                      <span className="text-gray-500 text-xs">@{post.user?.username}</span>
                    </div>
                    <p className={`text-sm mt-0.5 ${dark ? "text-gray-300" : "text-gray-700"}`}>{post.content}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">❤️ {post.likes}</span>
                      <span className="text-xs text-gray-500">🔁 {post.reposts}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

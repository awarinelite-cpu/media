// src/hooks/useTrending.js
// Trending hashtags — parsed from posts in real time and ranked by frequency

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

// Extract all #hashtags from a string
function extractHashtags(text) {
  const matches = text.match(/#[\w]+/g) || [];
  return matches.map((tag) => tag.toLowerCase());
}

export function useTrending() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    // Listen to the 200 most recent posts to compute trending tags
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tagCounts = {};

      snapshot.docs.forEach((doc) => {
        const content = doc.data().content || "";
        const tags = extractHashtags(content);
        tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Sort by frequency and take top 10
      const sorted = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      setTrending(sorted);
    });

    return () => unsubscribe();
  }, []);

  return { trending };
}

// ─────────────────────────────────────────────
// TRENDING SIDEBAR COMPONENT
// Replace the static trending list in your RightSidebar
// ─────────────────────────────────────────────

export function TrendingPanel({ onTagClick, theme }) {
  const { trending } = useTrending();
  const dark = theme === "dark";

  return (
    <div className={`rounded-2xl overflow-hidden ${dark ? "bg-gray-900" : "bg-gray-50 border border-gray-200"}`}>
      <div className={`px-4 py-3 border-b ${dark ? "border-gray-800" : "border-gray-200"}`}>
        <h3 className={`font-bold text-base ${dark ? "text-white" : "text-gray-900"}`}>
          🔥 Trending
        </h3>
      </div>

      {trending.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className={`text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            No trending tags yet. Start posting with #hashtags!
          </p>
        </div>
      ) : (
        trending.map((item, i) => (
          <button
            key={item.tag}
            onClick={() => onTagClick?.(item.tag)}
            className={`w-full px-4 py-3 text-left transition-colors border-b last:border-0 ${
              dark
                ? "border-gray-800 hover:bg-gray-800/50"
                : "border-gray-100 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  #{i + 1} Trending
                </p>
                <p className={`font-bold text-sm mt-0.5 ${dark ? "text-white" : "text-gray-900"}`}>
                  {item.tag}
                </p>
                <p className={`text-xs mt-0.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {item.count} {item.count === 1 ? "post" : "posts"}
                </p>
              </div>
              <div className={`text-lg font-black ${
                i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-600"
              }`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HASHTAG HIGHLIGHTER
// Wrap post content to make hashtags clickable
// Usage: <HighlightedContent text={post.content} onTagClick={...} theme={theme} />
// ─────────────────────────────────────────────

export function HighlightedContent({ text, onTagClick, theme }) {
  const parts = text.split(/(#[\w]+)/g);

  return (
    <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onTagClick?.(part.toLowerCase()); }}
            className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

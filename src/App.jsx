import { useState, useEffect, useRef } from "react";

const MOCK_USER = {
  id: "u1",
  name: "Alex Rivera",
  username: "alexrivera",
  avatar: "AR",
  bio: "building cool stuff 🚀",
  followers: 1204,
  following: 342,
};

const INITIAL_POSTS = [
  {
    id: "p1",
    user: { id: "u2", name: "Maya Chen", username: "mayachen", avatar: "MC" },
    content: "Just shipped a feature that took 3 days to build and 3 seconds to break in prod 💀 #devlife",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    likes: 142,
    reposts: 38,
    replies: 12,
    liked: false,
    reposted: false,
    media: null,
  },
  {
    id: "p2",
    user: { id: "u3", name: "Jordan Lee", username: "jordanlee", avatar: "JL" },
    content: "Hot take: the best UI is the one that gets out of your way. Stop adding animations for the sake of it. Users just want to get things done.",
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    likes: 891,
    reposts: 204,
    replies: 67,
    liked: true,
    reposted: false,
    media: null,
  },
  {
    id: "p3",
    user: { id: "u4", name: "Sam Okafor", username: "samokafor", avatar: "SO" },
    content: "React + Firebase + Render is genuinely one of the best solo dev stacks right now. You can ship a full product without touching a server config. Game changer for side projects 🔥",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    likes: 2103,
    reposts: 512,
    replies: 88,
    liked: false,
    reposted: true,
    media: null,
  },
  {
    id: "p4",
    user: { id: "u5", name: "Priya Nair", username: "priyanair", avatar: "PN" },
    content: "reminder that it's okay to not know everything. I've been coding for 6 years and I still google how to center a div sometimes 😂",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    likes: 5421,
    reposts: 1302,
    replies: 203,
    liked: false,
    reposted: false,
    media: null,
  },
];

const NOTIFICATIONS = [
  { id: "n1", type: "like", user: "Maya Chen", content: "liked your post", time: "2m", avatar: "MC" },
  { id: "n2", type: "repost", user: "Jordan Lee", content: "reposted your post", time: "15m", avatar: "JL" },
  { id: "n3", type: "follow", user: "Sam Okafor", content: "started following you", time: "1h", avatar: "SO" },
  { id: "n4", type: "reply", user: "Priya Nair", content: "replied to your post", time: "3h", avatar: "PN" },
];

const DM_CONVERSATIONS = [
  { id: "d1", user: "Maya Chen", avatar: "MC", lastMessage: "that feature sounds wild lol", time: "5m", unread: 2 },
  { id: "d2", user: "Jordan Lee", avatar: "JL", lastMessage: "agreed, simplicity wins", time: "1h", unread: 0 },
  { id: "d3", user: "Sam Okafor", avatar: "SO", lastMessage: "let's collab on something", time: "2h", unread: 1 },
];

function timeAgo(date) {
  const diff = (Date.now() - date) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return n;
}

function Avatar({ initials, size = "md", color = null }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  const colors = ["bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-fuchsia-500"];
  const bg = color || colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

function PostCard({ post, onLike, onRepost }) {
  const [animLike, setAnimLike] = useState(false);

  const handleLike = () => {
    setAnimLike(true);
    setTimeout(() => setAnimLike(false), 300);
    onLike(post.id);
  };

  return (
    <div className="border-b border-gray-800 px-4 py-4 hover:bg-gray-900/40 transition-colors cursor-pointer group">
      <div className="flex gap-3">
        <Avatar initials={post.user.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{post.user.name}</span>
            <span className="text-gray-500 text-sm">@{post.user.username}</span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-500 text-xs">{timeAgo(post.timestamp)}</span>
          </div>
          <p className="text-gray-100 text-sm mt-1 leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-6 mt-3">
            {/* Reply */}
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-sky-400 transition-colors group/btn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">{formatCount(post.replies)}</span>
            </button>
            {/* Repost */}
            <button
              onClick={() => onRepost(post.id)}
              className={`flex items-center gap-1.5 transition-colors ${post.reposted ? "text-emerald-400" : "text-gray-500 hover:text-emerald-400"}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">{formatCount(post.reposts)}</span>
            </button>
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors ${post.liked ? "text-rose-400" : "text-gray-500 hover:text-rose-400"}`}
            >
              <svg
                className={`w-4 h-4 transition-transform ${animLike ? "scale-125" : "scale-100"}`}
                fill={post.liked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">{formatCount(post.likes)}</span>
            </button>
            {/* Share */}
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-sky-400 transition-colors ml-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposeBox({ onPost, user }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const maxChars = 280;
  const remaining = maxChars - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0;

  const handlePost = () => {
    if (!canPost) return;
    onPost(text.trim());
    setText("");
    setFocused(false);
  };

  return (
    <div className="border-b border-gray-800 px-4 py-3">
      <div className="flex gap-3">
        <Avatar initials={user.avatar} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="What's happening?"
            rows={focused ? 3 : 1}
            className="w-full bg-transparent text-white placeholder-gray-600 text-base resize-none outline-none border-b border-transparent focus:border-gray-700 transition-all py-2"
            style={{ fontFamily: "inherit" }}
          />
          {(focused || text.length > 0) && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-3 text-sky-400">
                {["photo", "gif", "poll", "emoji"].map(icon => (
                  <button key={icon} className="hover:bg-sky-400/10 p-1.5 rounded-full transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icon === "photo" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                      {icon === "gif" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />}
                      {icon === "poll" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                      {icon === "emoji" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    </svg>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {text.length > 0 && (
                  <span className={`text-xs font-mono ${remaining < 20 ? remaining < 0 ? "text-rose-400" : "text-amber-400" : "text-gray-500"}`}>
                    {remaining}
                  </span>
                )}
                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, onTabChange, user, notifCount }) {
  const tabs = [
    { id: "feed", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "explore", label: "Explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { id: "notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", badge: notifCount },
    { id: "messages", label: "Messages", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", badge: 3 },
    { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="flex flex-col h-full py-2">
      {/* Logo */}
      <div className="px-4 py-3 mb-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl mb-1 transition-all text-left group relative ${
              activeTab === tab.id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab.id ? 2.2 : 1.8} d={tab.icon} />
              </svg>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-sm font-medium ${activeTab === tab.id ? "font-bold" : ""}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Post button */}
      <div className="px-3 mb-4">
        <button className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 rounded-full transition-colors text-sm">
          Post
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-3 mx-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-3">
        <Avatar initials={user.avatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-bold truncate">{user.name}</div>
          <div className="text-gray-500 text-xs truncate">@{user.username}</div>
        </div>
        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  return (
    <div>
      <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800">
        <h2 className="font-bold text-white text-lg">Notifications</h2>
      </div>
      {NOTIFICATIONS.map(n => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-800 hover:bg-gray-900/40 transition-colors cursor-pointer">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            n.type === "like" ? "bg-rose-500/20 text-rose-400" :
            n.type === "repost" ? "bg-emerald-500/20 text-emerald-400" :
            n.type === "follow" ? "bg-sky-500/20 text-sky-400" :
            "bg-violet-500/20 text-violet-400"
          }`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              {n.type === "like" && <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
              {n.type === "repost" && <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />}
              {n.type === "follow" && <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />}
              {n.type === "reply" && <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />}
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Avatar initials={n.avatar} size="sm" />
              <span className="text-white text-sm font-semibold">{n.user}</span>
              <span className="text-gray-500 text-xs">{n.time}</span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{n.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesPanel() {
  const [activeChat, setActiveChat] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "hey! love your posts", time: "10:32 AM" },
    { id: 2, from: "me", text: "thanks so much 🙏", time: "10:34 AM" },
    { id: 3, from: "them", text: "that feature sounds wild lol", time: "10:35 AM" },
  ]);

  const sendMessage = () => {
    if (!msgText.trim()) return;
    setMessages(m => [...m, { id: Date.now(), from: "me", text: msgText.trim(), time: "now" }]);
    setMsgText("");
  };

  if (activeChat) {
    const convo = DM_CONVERSATIONS.find(d => d.id === activeChat);
    return (
      <div className="flex flex-col h-screen">
        <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800 flex items-center gap-3">
          <button onClick={() => setActiveChat(null)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <Avatar initials={convo.avatar} size="sm" />
          <span className="font-bold text-white">{convo.user}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                msg.from === "me" ? "bg-sky-500 text-white rounded-br-sm" : "bg-gray-800 text-gray-100 rounded-bl-sm"
              }`}>
                {msg.text}
                <div className={`text-xs mt-1 ${msg.from === "me" ? "text-sky-200" : "text-gray-500"}`}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
          <input
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Send a message..."
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 text-sm px-4 py-2.5 rounded-full outline-none border border-transparent focus:border-sky-500 transition-colors"
          />
          <button
            onClick={sendMessage}
            className="w-9 h-9 bg-sky-500 hover:bg-sky-400 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800">
        <h2 className="font-bold text-white text-lg">Messages</h2>
      </div>
      {DM_CONVERSATIONS.map(convo => (
        <div
          key={convo.id}
          onClick={() => setActiveChat(convo.id)}
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 hover:bg-gray-900/40 transition-colors cursor-pointer"
        >
          <Avatar initials={convo.avatar} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{convo.user}</span>
              <span className="text-gray-500 text-xs">{convo.time}</span>
            </div>
            <p className="text-gray-500 text-sm truncate">{convo.lastMessage}</p>
          </div>
          {convo.unread > 0 && (
            <span className="w-5 h-5 bg-sky-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {convo.unread}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfilePanel({ user }) {
  return (
    <div>
      <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800">
        <h2 className="font-bold text-white text-lg">{user.name}</h2>
      </div>
      <div className="h-24 bg-gradient-to-r from-sky-600 via-violet-600 to-rose-600" />
      <div className="px-4 pb-4">
        <div className="flex justify-between items-end -mt-8 mb-3">
          <div className="w-16 h-16 bg-sky-500 rounded-full border-4 border-black flex items-center justify-center text-white font-bold text-lg">
            {user.avatar}
          </div>
          <button className="border border-gray-600 hover:border-gray-400 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors">
            Edit profile
          </button>
        </div>
        <h3 className="font-bold text-white text-xl">{user.name}</h3>
        <p className="text-gray-500 text-sm">@{user.username}</p>
        <p className="text-gray-300 text-sm mt-2">{user.bio}</p>
        <div className="flex gap-4 mt-3">
          <span className="text-sm"><span className="text-white font-bold">{formatCount(user.following)}</span> <span className="text-gray-500">Following</span></span>
          <span className="text-sm"><span className="text-white font-bold">{formatCount(user.followers)}</span> <span className="text-gray-500">Followers</span></span>
        </div>
      </div>
    </div>
  );
}

function RightSidebar() {
  const trending = [
    { tag: "ReactJS", posts: "42.1K" },
    { tag: "Firebase", posts: "18.3K" },
    { tag: "WebDev", posts: "91.4K" },
    { tag: "OpenSource", posts: "12.7K" },
  ];

  const suggestions = [
    { name: "Dan Abramov", username: "dan_abramov", avatar: "DA" },
    { name: "Addy Osmani", username: "addyosmani", avatar: "AO" },
    { name: "Kent C. Dodds", username: "kentcdodds", avatar: "KD" },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="font-bold text-white text-base">Trending</h3>
        </div>
        {trending.map(t => (
          <div key={t.tag} className="px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-800/50 last:border-0">
            <p className="text-gray-500 text-xs">Trending in Tech</p>
            <p className="text-white font-bold text-sm">#{t.tag}</p>
            <p className="text-gray-500 text-xs">{t.posts} posts</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="font-bold text-white text-base">Who to follow</h3>
        </div>
        {suggestions.map(s => (
          <div key={s.username} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-0">
            <Avatar initials={s.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{s.name}</p>
              <p className="text-gray-500 text-xs">@{s.username}</p>
            </div>
            <button className="text-white border border-gray-600 hover:bg-white hover:text-black text-xs font-bold px-3 py-1.5 rounded-full transition-all">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [mobileTab, setMobileTab] = useState("feed");

  const currentTab = window.innerWidth < 768 ? mobileTab : activeTab;

  const handlePost = (text) => {
    const newPost = {
      id: `p${Date.now()}`,
      user: MOCK_USER,
      content: text,
      timestamp: new Date(),
      likes: 0,
      reposts: 0,
      replies: 0,
      liked: false,
      reposted: false,
      media: null,
    };
    setPosts(p => [newPost, ...p]);
  };

  const handleLike = (id) => {
    setPosts(p => p.map(post =>
      post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post
    ));
  };

  const handleRepost = (id) => {
    setPosts(p => p.map(post =>
      post.id === id ? { ...post, reposted: !post.reposted, reposts: post.reposted ? post.reposts - 1 : post.reposts + 1 } : post
    ));
  };

  const renderMain = () => {
    switch (currentTab) {
      case "feed":
        return (
          <div>
            <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800">
              <h2 className="font-bold text-white text-lg">Home</h2>
            </div>
            <ComposeBox onPost={handlePost} user={MOCK_USER} />
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} />
            ))}
          </div>
        );
      case "notifications": return <NotificationsPanel />;
      case "messages": return <MessagesPanel />;
      case "profile": return <ProfilePanel user={MOCK_USER} />;
      case "explore":
        return (
          <div>
            <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-3 border-b border-gray-800">
              <input placeholder="Search..." className="w-full bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-full outline-none text-sm border border-transparent focus:border-sky-500 transition-colors" />
            </div>
            {posts.slice().sort((a, b) => b.likes - a.likes).map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} />
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        textarea { font-family: inherit; }
      `}</style>

      <div className="max-w-6xl mx-auto flex">
        {/* Left sidebar - hidden on mobile */}
        <div className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0 border-r border-gray-800 flex-col">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={MOCK_USER} notifCount={NOTIFICATIONS.length} />
        </div>

        {/* Main */}
        <div className="flex-1 min-h-screen border-r border-gray-800 max-w-xl overflow-y-auto">
          {renderMain()}
          {/* Mobile bottom padding */}
          <div className="h-20 md:hidden" />
        </div>

        {/* Right sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex md:hidden z-50">
        {[
          { id: "feed", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
          { id: "explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          { id: "notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
          { id: "messages", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
          { id: "profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-3 flex justify-center transition-colors ${mobileTab === tab.id ? "text-sky-400" : "text-gray-500"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={mobileTab === tab.id ? 2.2 : 1.8} d={tab.icon} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}


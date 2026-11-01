import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Video, Home, Users, User, Shield, AlertTriangle, 
  Heart, Repeat, Share2, Send, Plus, Search, CheckCheck, ThumbsUp, 
  Flag, Lock, Award, Compass, Radio, Sparkles, Moon, Sun, Music2, Bookmark, Eye
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // User & Social States
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'lekkxygold',
      handle: '@lekkxygold',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: '🚀 Welcome to LCF (Lekkxy Chat Free)! Connecting feeds, reels, channels, and communities into one seamless platform.',
      likes: 142,
      reposts: 28,
      comments: 14,
      isLiked: false
    },
    {
      id: 2,
      author: 'Community Bot',
      handle: '@system',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      content: '⚡ High speed real-time communication enabled. Check out the Reels feed and public Channels!',
      likes: 89,
      reposts: 12,
      comments: 5,
      isLiked: false
    }
  ]);

  const [reels, setReels] = useState([
    {
      id: 1,
      author: 'lekkxygold',
      caption: 'Testing the new LCF ultra-fast Reels player! 🎬⚡',
      audio: 'Original Audio - lekkxygold',
      likes: 542,
      comments: 41,
      isLiked: false
    }
  ]);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'System', text: 'Welcome to the #general channel!', time: '12:00 PM' },
    { id: 2, sender: 'lekkxygold', text: 'Hey everyone, LCF is live!', time: '12:02 PM' }
  ]);

  const [newPostText, setNewPostText] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // Handlers
  const handleLikePost = (id) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleLikeReel = (id) => {
    setReels(reels.map(reel => {
      if (reel.id === id) {
        return {
          ...reel,
          likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
          isLiked: !reel.isLiked
        };
      }
      return reel;
    }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newEntry = {
      id: Date.now(),
      author: 'You',
      handle: '@user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      content: newPostText,
      likes: 0,
      reposts: 0,
      comments: 0,
      isLiked: false
    };

    setPosts([newEntry, ...posts]);
    setNewPostText('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setNewMessageText('');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* HEADER / NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} border-b px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            LCF Hub
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-800/40 p-1 rounded-full border border-slate-700/50">
          {[
            { id: 'feed', label: 'Feed', icon: Home },
            { id: 'reels', label: 'Reels', icon: Video },
            { id: 'chats', label: 'Chats', icon: MessageSquare },
            { id: 'communities', label: 'Hubs', icon: Users },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Utilities */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setShowTermsModal(true)}
            className="text-xs text-slate-400 hover:underline hidden sm:block"
          >
            Guidelines
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-t px-2 py-2 flex justify-around`}>
        {[
          { id: 'feed', label: 'Feed', icon: Home },
          { id: 'reels', label: 'Reels', icon: Video },
          { id: 'chats', label: 'Chats', icon: MessageSquare },
          { id: 'communities', label: 'Hubs', icon: Users },
          { id: 'profile', label: 'Profile', icon: User },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-xl ${
                activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-20 md:pb-4 flex gap-6">
        
        {/* CENTER VIEW CONTENT AREA */}
        <section className="flex-1 space-y-4">
          
          {/* 1. SOCIAL FEED (FACEBOOK STYLE) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Post Composer */}
              <form onSubmit={handleCreatePost} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border shadow-sm`}>
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's on your mind? Share to LCF..."
                  className="w-full bg-transparent resize-none border-none focus:outline-none text-sm placeholder-slate-500 min-h-[70px]"
                />
                <div className="flex justify-between items-center border-t border-slate-800/50 pt-3 mt-2">
                  <div className="flex space-x-2 text-slate-400">
                    <button type="button" className="p-1.5 hover:bg-slate-800 rounded-lg"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-1.5 rounded-xl font-semibold text-sm transition-all"
                  >
                    Post
                  </button>
                </div>
              </form>

              {/* Feed Stream */}
              {posts.map(post => (
                <div key={post.id} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={post.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h4 className="font-semibold text-sm">{post.author}</h4>
                        <span className="text-xs text-slate-500">{post.handle}</span>
                      </div>
                    </div>
                    <button onClick={() => setShowReportModal(true)} className="text-slate-500 hover:text-red-400">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed">{post.content}</p>
                  <div className="flex items-center justify-between text-slate-400 text-xs border-t border-slate-800/50 pt-2">
                    <button onClick={() => handleLikePost(post.id)} className={`flex items-center space-x-1 ${post.isLiked ? 'text-red-500' : 'hover:text-slate-200'}`}>
                      <Heart className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-slate-200">
                      <Repeat className="w-4 h-4" />
                      <span>{post.reposts}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-slate-200">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. REELS ENGINE (TIKTOK / IG STYLE) */}
          {activeTab === 'reels' && (
            <div className="flex flex-col items-center space-y-6">
              {reels.map(reel => (
                <div key={reel.id} className="relative w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-end p-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/90 z-10"></div>
                  
                  {/* Action Bar */}
                  <div className="absolute right-3 bottom-16 z-20 flex flex-col space-y-4 items-center text-white">
                    <button onClick={() => handleLikeReel(reel.id)} className="flex flex-col items-center">
                      <div className={`p-3 rounded-full ${reel.isLiked ? 'bg-red-500 text-white' : 'bg-slate-800/80 text-slate-200'}`}>
                        <Heart className="w-5 h-5" fill={reel.isLiked ? "currentColor" : "none"} />
                      </div>
                      <span className="text-xs mt-1 font-semibold">{reel.likes}</span>
                    </button>
                    <button className="flex flex-col items-center">
                      <div className="p-3 rounded-full bg-slate-800/80 text-slate-200">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-xs mt-1 font-semibold">{reel.comments}</span>
                    </button>
                  </div>

                  {/* Caption & Audio */}
                  <div className="relative z-20 space-y-2 text-white max-w-[80%]">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full inline-block">
                      Trending Reel
                    </span>
                    <h3 className="font-bold text-sm">@{reel.author}</h3>
                    <p className="text-xs text-slate-300">{reel.caption}</p>
                    <div className="flex items-center space-x-2 text-xs text-cyan-400">
                      <Music2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{reel.audio}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. CHATS & CHANNELS (WHATSAPP / TELEGRAM STYLE) */}
          {activeTab === 'chats' && (
            <div className={`h-[550px] rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border flex flex-col`}>
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm"># general-chat</h3>
                  <span className="text-xs text-slate-400">Public Channel</span>
                </div>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> 24 Members Online
                </span>
              </div>
              
              {/* Message Stream */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.map(msg => (
                  <div key={msg.id} className={`p-3 rounded-xl max-w-xs text-xs space-y-1 ${msg.sender === 'You' ? 'bg-cyan-500/20 border border-cyan-500/30 ml-auto' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-semibold text-cyan-400">{msg.sender}</span>
                      <span className="text-[10px] text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input 
                  type="text" 
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
                <button type="submit" className="bg-cyan-500 p-2 rounded-xl text-slate-950 font-bold">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* 4. COMMUNITIES HUB */}
          {activeTab === 'communities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'React Developers', members: '1.2k members', desc: 'Discuss UI components and frontend frameworks.' },
                { title: 'Supabase Creators', members: '850 members', desc: 'Backend infrastructure & SQL setup guidelines.' },
                { title: 'Reels & Video Hub', members: '2.4k members', desc: 'Short-form content strategies & video tools.' }
              ].map((hub, idx) => (
                <div key={idx} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border space-y-2`}>
                  <h3 className="font-bold text-sm text-cyan-400">{hub.title}</h3>
                  <span className="text-xs text-slate-500">{hub.members}</span>
                  <p className="text-xs text-slate-400">{hub.desc}</p>
                  <button className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 mt-2">
                    Join Community
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 5. USER PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border space-y-4`}>
              <div className="flex items-center space-x-4">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500" />
                <div>
                  <h2 className="font-bold text-lg">lekkxygold</h2>
                  <p className="text-xs text-slate-400"> Creator of LCF Hub</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Building social hubs, mobile apps, and developer tools. Welcome to LCF!
              </p>
              <div className="flex space-x-6 border-y border-slate-800 py-3 text-xs">
                <div><span className="font-bold text-cyan-400">1.4k</span> <span className="text-slate-500">Followers</span></div>
                <div><span className="font-bold text-cyan-400">320</span> <span className="text-slate-500">Following</span></div>
                <div><span className="font-bold text-cyan-400">24</span> <span className="text-slate-500">Posts</span></div>
              </div>
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                className={`w-full py-2 rounded-xl font-semibold text-xs transition-all ${
                  isFollowing ? 'bg-slate-800 text-slate-300' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow @lekkxygold'}
              </button>
            </div>
          )}

        </section>

        {/* RIGHT SIDEBAR (SAFETY & DISCOVERY) */}
        <aside className="hidden lg:block w-72 space-y-4">
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border space-y-3`}>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Community Safety</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              LCF enforces strict safety and content guidelines to prevent abuse.
            </p>
            <button 
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-cyan-400 hover:underline font-semibold block"
            >
              Read Terms & Guidelines
            </button>
          </div>
        </aside>
      </main>

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold">Report Content</h3>
            </div>
            <p className="text-xs text-slate-400">Select a reason for reporting this content:</p>
            <div className="space-y-2 text-sm">
              {['Spam or Misleading', 'Hate Speech or Harassment', 'Violent Content', 'Copyright Violation'].map(reason => (
                <button key={reason} onClick={() => setShowReportModal(false)} className="w-full text-left p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-300">
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReportModal(false)} className="w-full py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Shield className="w-5 h-5" />
              <h3 className="font-bold">Terms of Service & Guidelines</h3>
            </div>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p><strong>1. Community Standards:</strong> Treat every user with respect. Cyberbullying, hate speech, and harassment are prohibited.</p>
              <p><strong>2. Moderation & Reporting:</strong> Content flagged for violations will be reviewed by platform moderators.</p>
              <p><strong>3. Content Ownership:</strong> Creators maintain full ownership over uploaded media and short video reels.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full py-2 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl">
              I Agree & Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
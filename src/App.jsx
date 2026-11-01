import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  FiHome,
  FiMessageSquare,
  FiVideo,
  FiUsers,
  FiUser,
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiSend,
  FiImage,
  FiPlus,
  FiLogOut,
  FiCheckCircle,
  FiSearch,
  FiUserPlus,
  FiUserCheck,
  FiMoreHorizontal,
  FiSun,
  FiMoon
} from 'react-icons/fi';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');

  // App Data
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Chat Data
  const [chats, setChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Followers & Like state local trackers
  const [likedPosts, setLikedPosts] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [comments, setComments] = useState({});
  const [activeCommentInput, setActiveCommentInput] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchUserProfile = async (user) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Fallback demo user details if database table profile missing
        data = {
          id: user.id,
          username: user.email.split('@')[0],
          full_name: user.email.split('@')[0],
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          followers: 142,
          following: 89
        };
      }
      setCurrentUser(data || {
        id: user.id,
        username: user.email.split('@')[0],
        full_name: 'LCF Member',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        followers: 120,
        following: 45
      });
    } catch (e) {
      console.log('Error fetching user profile:', e);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: fullName }
          }
        });
        if (error) throw error;
        alert('Registration successful! Please check your email or log in.');
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setPosts(data);
      } else {
        // High quality initial seed posts
        setPosts([
          {
            id: '1',
            user_name: 'David Mark',
            username: 'david_m',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
            content: '🚀 Welcome to the new LCF Social & Chat Hub! Designed with real-time connectivity, clean messaging, and global feeds. Drop a comment below!',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
            likes: 24,
            created_at: '2 hours ago'
          },
          {
            id: '2',
            user_name: 'lekkxygold',
            username: 'lekkxygold',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            content: 'Building ultra-fast modern web applications using React & Supabase. Everything synced live!',
            image: null,
            likes: 58,
            created_at: '5 hours ago'
          }
        ]);
      }
    } catch (e) {
      console.log('Error loading posts:', e);
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      user_name: currentUser?.full_name || currentUser?.username || 'You',
      username: currentUser?.username || 'you',
      avatar: currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      content: newPostText,
      image: newPostImage.trim() ? newPostImage : null,
      likes: 0,
      created_at: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setNewPostImage('');
    setIsPosting(false);
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, likes: likedPosts[postId] ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const toggleFollow = (usernameKey) => {
    setFollowedUsers(prev => ({ ...prev, [usernameKey]: !prev[usernameKey] }));
  };

  const handleAddComment = (postId) => {
    const text = activeCommentInput[postId];
    if (!text || !text.trim()) return;

    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { user: currentUser?.username || 'You', text }]
    }));

    setActiveCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const mockUsersForChat = [
    { id: '1', name: 'David Mark', username: 'david_m', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', online: true },
    { id: '2', name: 'Sarah Connor', username: 'sarah_c', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', online: true },
    { id: '3', name: 'Alexander Smith', username: 'alex_s', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', online: false }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatUser) return;

    setMessages([...messages, { id: Date.now(), sender: 'you', text: newMessage, time: 'Now' }]);
    setNewMessage('');
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0b0f17', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading LCF Social Hub...</p>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATION SCREEN ---
  if (!session) {
    return (
      <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', fontSize: '24px', marginBottom: '14px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}>
              💬
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: '0 0 6px' }}>LCF Social Hub</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Connect, Chat & Share in Real-Time</p>
          </div>

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Olalekan Ogunsola"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>USERNAME</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. lekkxygold"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@email.com"
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              style={{ marginTop: '8px', padding: '14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
            {authMode === 'login' ? (
              <p>Don't have an account? <span onClick={() => setAuthMode('signup')} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign up</span></p>
            ) : (
              <p>Already have an account? <span onClick={() => setAuthMode('login')} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign in</span></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APPLICATION SCREEN ---
  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            LCF
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>LCF Social Hub</span>
        </div>

        {/* Global Navigation Bar */}
        <nav style={{ display: 'flex', alignItems: 'center', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '30px', padding: '4px' }}>
          {[
            { id: 'feed', label: 'Feed', icon: <FiHome /> },
            { id: 'reels', label: 'Reels', icon: <FiVideo /> },
            { id: 'chats', label: 'Chats', icon: <FiMessageSquare /> },
            { id: 'hubs', label: 'Hubs', icon: <FiUsers /> },
            { id: 'profile', label: 'Profile', icon: <FiUser /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Badge & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>@{currentUser?.username || 'user'}</span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{ backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* --- TAB 1: FEED --- */}
        {activeTab === 'feed' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            <div>
              {/* Post Creation Box */}
              <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img src={currentUser?.avatar_url} alt="user" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <textarea
                    rows={3}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Share something with the LCF community..."
                    style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {isPosting && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Paste Image URL (optional)..."
                      value={newPostImage}
                      onChange={(e) => setNewPostImage(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                  <button
                    onClick={() => setIsPosting(!isPosting)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: 'none', color: '#60a5fa', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <FiImage size={16} />
                    <span>Attach Photo</span>
                  </button>

                  <button
                    onClick={handleCreatePost}
                    style={{ padding: '8px 20px', backgroundColor: '#2563eb', border: 'none', borderRadius: '20px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Feed List */}
              {posts.map(post => (
                <div key={post.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={post.avatar} alt="user" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{post.user_name}</span>
                          <FiCheckCircle size={14} color="#3b82f6" />
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>@{post.username} • {post.created_at}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollow(post.username)}
                      style={{
                        padding: '6px 14px',
                        border: '1px solid #3b82f6',
                        borderRadius: '20px',
                        backgroundColor: followedUsers[post.username] ? '#3b82f6' : 'transparent',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {followedUsers[post.username] ? <><FiUserCheck size={12}/> Following</> : <><FiUserPlus size={12}/> Follow</>}
                    </button>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', margin: '0 0 12px 0' }}>
                    {post.content}
                  </p>

                  {post.image && (
                    <img src={post.image} alt="post media" style={{ width: '100%', borderRadius: '10px', maxHeight: '400px', objectFit: 'cover', marginBottom: '12px' }} />
                  )}

                  {/* Like, Comment & Share Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid #1e293b', paddingTop: '12px', color: '#94a3b8', fontSize: '13px' }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: likedPosts[post.id] ? '#ef4444' : '#94a3b8', cursor: 'pointer' }}
                    >
                      <FiHeart size={16} fill={likedPosts[post.id] ? '#ef4444' : 'none'} />
                      <span>{post.likes}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiMessageCircle size={16} />
                      <span>{(comments[post.id] || []).length}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <FiShare2 size={16} />
                      <span>Share</span>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #1e293b' }}>
                    {(comments[post.id] || []).map((c, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                        <strong style={{ color: '#60a5fa' }}>@{c.user}: </strong>{c.text}
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={activeCommentInput[post.id] || ''}
                        onChange={(e) => setActiveCommentInput({ ...activeCommentInput, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        style={{ flex: 1, padding: '6px 12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Guidelines & Trends */}
            <div>
              <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 10px 0' }}>Community Guidelines</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                  Welcome to LCF (Lekkxy Chat Free)! Connect with creators across Africa and worldwide. Keep communications respectful and constructive.
                </p>
              </div>

              <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 12px 0' }}>Suggested Members</h3>
                {mockUsersForChat.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={u.avatar} alt="u" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{u.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>@{u.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollow(u.username)}
                      style={{ padding: '4px 10px', backgroundColor: followedUsers[u.username] ? '#1e293b' : '#2563eb', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {followedUsers[u.username] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: REELS --- */}
        {activeTab === 'reels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Tech Prototyping', user: 'lekkxygold', views: '2.4k', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
              { title: 'Lounge Architectural Design', user: 'gene_foster', views: '1.8k', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400' },
              { title: 'Afrobeats Studio Vibes', user: 'david_m', views: '5.1k', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400' }
            ].map((reel, idx) => (
              <div key={idx} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', height: '340px', border: '1px solid #1e293b' }}>
                <img src={reel.img} alt="reel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{reel.title}</div>
                  <div style={{ fontSize: '11px', color: '#60a5fa' }}>@{reel.user} • {reel.views} views</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 3: REAL-TIME DIRECT MESSAGING --- */}
        {activeTab === 'chats' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', height: '600px', display: 'grid', gridTemplateColumns: '280px 1fr', overflow: 'hidden' }}>
            {/* Conversations List */}
            <div style={{ borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 14px 0' }}>Direct Messages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mockUsersForChat.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedChatUser(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: selectedChatUser?.id === user.id ? '#1e293b' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img src={user.avatar} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                      {user.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #0f172a' }}></div>}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Click to open chat</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Box View */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={selectedChatUser.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedChatUser.name}</div>
                      <div style={{ fontSize: '11px', color: '#22c55e' }}>Online</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ alignSelf: 'flex-start', backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', maxWidth: '70%' }}>
                      Hello! Welcome to LCF Social Hub DM. How is your project going?
                    </div>

                    {messages.map(m => (
                      <div key={m.id} style={{ alignSelf: m.sender === 'you' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'you' ? '#2563eb' : '#1e293b', color: '#fff', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', maxWidth: '70%' }}>
                        {m.text}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ padding: '14px', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder={`Message ${selectedChatUser.name}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                      <FiSend />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
                  Select a contact from the left list to start chatting.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: HUBS / COMMUNITIES --- */}
        {activeTab === 'hubs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Afrobeats & Music Producers', members: '1,420 members', desc: 'Songwriters, lyricists, and music marketers collaborating on tracks.' },
              { name: 'Frontend Code & UI/UX', members: '2,890 members', desc: 'React, Tailwind CSS, and web application design enthusiasts.' },
              { name: 'Project Engineering & CAD', members: '950 members', desc: 'Drafting, millwork shop drawings, and permit planning reviews.' }
            ].map((hub, i) => (
              <div key={i} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '0 0 6px 0' }}>{hub.name}</h3>
                <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '10px' }}>{hub.members}</div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>{hub.desc}</p>
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Join Community Hub
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 5: PROFILE --- */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}></div>
            <div style={{ padding: '0 24px 24px', position: 'relative', marginTop: '-50px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
                <img src={currentUser?.avatar_url} alt="profile avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #151c2c', objectFit: 'cover' }} />
                <button style={{ padding: '8px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                  Edit Profile
                </button>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0' }}>{currentUser?.full_name || 'Olalekan Ogunsola'}</h2>
              <div style={{ fontSize: '13px', color: '#60a5fa', marginBottom: '12px' }}>@{currentUser?.username || 'lekkxygold'}</div>

              <p style={{ fontSize: '14px', color: '#cbd5e1', maxWidth: '600px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Official profile on LCF Social Hub. Frontend Architect, Project Developer & Afrobeats Lyric Creator.
              </p>

              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#94a3b8' }}>
                <div><strong style={{ color: '#fff' }}>{currentUser?.followers || 142}</strong> Followers</div>
                <div><strong style={{ color: '#fff' }}>{currentUser?.following || 89}</strong> Following</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
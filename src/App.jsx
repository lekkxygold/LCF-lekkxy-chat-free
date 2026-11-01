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
  FiEdit3,
  FiX,
  FiCamera
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

  // User Profile
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');

  // Posts State
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Reels State
  const [reels, setReels] = useState([
    { id: '1', title: 'Tech Prototyping Showcase', user: 'lekkxygold', views: '3.4k', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
    { id: '2', title: 'Commercial Lounge Architecture', user: 'gene_foster', views: '1.9k', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400' }
  ]);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelUrl, setNewReelUrl] = useState('');

  // Chat & Users Directory State
  const [allUsers, setAllUsers] = useState([
    { id: '1', name: 'David Mark', username: 'david_m', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', online: true },
    { id: '2', name: 'Sarah Connor', username: 'sarah_c', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', online: true },
    { id: '3', name: 'Alexander Smith', username: 'alex_s', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', online: false },
    { id: '4', name: 'Gene Foster', username: 'gene_foster', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', online: true }
  ]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Interactions State
  const [likedPosts, setLikedPosts] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [comments, setComments] = useState({});
  const [activeCommentInput, setActiveCommentInput] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initUserData(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initUserData(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initUserData = (user) => {
    const defaultProfile = {
      id: user.id,
      username: user.user_metadata?.username || user.email.split('@')[0],
      full_name: user.user_metadata?.full_name || 'LCF Member',
      bio: 'Frontend Architect & Community Builder on LCF.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      followers: 142,
      following: 89
    };
    setCurrentUser(defaultProfile);
    setEditName(defaultProfile.full_name);
    setEditBio(defaultProfile.bio);
    setEditAvatar(defaultProfile.avatar_url);
    setEditCover(defaultProfile.cover_url);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, full_name: fullName } }
        });
        if (error) throw error;
        alert('Registration successful! You can now sign in.');
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setCurrentUser(prev => ({
      ...prev,
      full_name: editName,
      bio: editBio,
      avatar_url: editAvatar,
      cover_url: editCover
    }));
    setIsEditingProfile(false);
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      user_name: currentUser?.full_name || 'You',
      username: currentUser?.username || 'you',
      avatar: currentUser?.avatar_url,
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

  const handleCreateReel = (e) => {
    e.preventDefault();
    if (!newReelTitle.trim() || !newReelUrl.trim()) return;

    const newReel = {
      id: Date.now().toString(),
      title: newReelTitle,
      user: currentUser?.username || 'lekkxygold',
      views: '1 view',
      url: newReelUrl
    };

    setReels([newReel, ...reels]);
    setNewReelTitle('');
    setNewReelUrl('');
    setIsCreatingReel(false);
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: likedPosts[postId] ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleFollow = (uname) => {
    setFollowedUsers(prev => ({ ...prev, [uname]: !prev[uname] }));
  };

  const handleAddComment = (postId) => {
    const text = activeCommentInput[postId];
    if (!text || !text.trim()) return;

    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { user: currentUser?.username || 'you', text }]
    }));
    setActiveCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatUser) return;

    setMessages([...messages, { id: Date.now(), sender: 'you', text: newMessage, time: 'Now' }]);
    setNewMessage('');
  };

  const filteredChatUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0b0f17', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading LCF Hub...</p>
        </div>
      </div>
    );
  }

  // --- AUTH SCREEN ---
  if (!session) {
    return (
      <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>LCF Social Hub</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Real Accounts, Real Connections</p>
          </div>

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {authMode === 'signup' && (
              <>
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Olalekan Ogunsola)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  required
                  placeholder="Username (e.g. lekkxygold)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </>
            )}
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ padding: '12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#94a3b8' }}>
            {authMode === 'login' ? (
              <p>No account? <span onClick={() => setAuthMode('signup')} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign up</span></p>
            ) : (
              <p>Have an account? <span onClick={() => setAuthMode('login')} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign in</span></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', paddingBottom: '70px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
            LCF
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700' }}>LCF Hub</span>
        </div>

        {/* Desktop Navbar */}
        <nav style={{ display: 'flex', gap: '4px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '24px', padding: '3px' }}>
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
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '20px',
                backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              {tab.icon}
              <span style={{ display: window.innerWidth < 640 && activeTab !== tab.id ? 'none' : 'inline' }}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleSignOut} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
          <FiLogOut size={16} />
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        
        {/* --- TAB 1: FEED --- */}
        {activeTab === 'feed' && (
          <div>
            {/* Create Post */}
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                <textarea
                  rows={2}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's on your mind? Share to LCF..."
                  style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
              </div>

              {isPosting && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Paste image URL (optional)"
                    value={newPostImage}
                    onChange={(e) => setNewPostImage(e.target.value)}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                <button onClick={() => setIsPosting(!isPosting)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <FiImage /> Attach Photo
                </button>
                <button onClick={handleCreatePost} style={{ padding: '6px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Post
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            {posts.map(post => (
              <div key={post.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {post.user_name} <FiCheckCircle size={12} color="#3b82f6" />
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{post.username} • {post.created_at}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollow(post.username)}
                    style={{ padding: '4px 10px', border: '1px solid #3b82f6', borderRadius: '12px', backgroundColor: followedUsers[post.username] ? '#3b82f6' : 'transparent', color: '#fff', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {followedUsers[post.username] ? 'Following' : 'Follow'}
                  </button>
                </div>

                <p style={{ fontSize: '13px', lineHeight: '1.4', color: '#e2e8f0', margin: '0 0 10px 0' }}>{post.content}</p>

                {post.image && (
                  <img src={post.image} alt="media" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                )}

                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #1e293b', paddingTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                  <button onClick={() => toggleLike(post.id)} style={{ background: 'none', border: 'none', color: likedPosts[post.id] ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <FiHeart fill={likedPosts[post.id] ? '#ef4444' : 'none'} /> {post.likes}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiMessageCircle /> {(comments[post.id] || []).length}
                  </div>
                </div>

                {/* Comments */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #1e293b' }}>
                  {(comments[post.id] || []).map((c, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <strong style={{ color: '#60a5fa' }}>@{c.user}: </strong>{c.text}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={activeCommentInput[post.id] || ''}
                      onChange={(e) => setActiveCommentInput({ ...activeCommentInput, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      style={{ flex: 1, padding: '6px 10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    />
                    <button onClick={() => handleAddComment(post.id)} style={{ padding: '6px 10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 2: REELS --- */}
        {activeTab === 'reels' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Community Reels</h2>
              <button onClick={() => setIsCreatingReel(true)} style={{ padding: '6px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Create Reel
              </button>
            </div>

            {isCreatingReel && (
              <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Publish New Reel</h3>
                <input
                  type="text"
                  placeholder="Reel title..."
                  value={newReelTitle}
                  onChange={(e) => setNewReelTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  placeholder="Image/Video URL..."
                  value={newReelUrl}
                  onChange={(e) => setNewReelUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCreateReel} style={{ padding: '6px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Publish</button>
                  <button onClick={() => setIsCreatingReel(false)} style={{ padding: '6px 14px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {reels.map(reel => (
                <div key={reel.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '300px', border: '1px solid #1e293b' }}>
                  <img src={reel.url} alt="reel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{reel.title}</div>
                    <div style={{ fontSize: '10px', color: '#60a5fa' }}>@{reel.user} • {reel.views}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: CHATS & USER SEARCH --- */}
        {activeTab === 'chats' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', height: '520px', display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '260px 1fr', overflow: 'hidden' }}>
            
            {/* Contacts & Search */}
            <div style={{ borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '12px', display: window.innerWidth < 768 && selectedChatUser ? 'none' : 'block' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0' }}>Messages</h3>
              
              {/* User Search Input */}
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8', fontSize: '12px' }} />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 8px 8px 30px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '400px' }}>
                {filteredChatUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedChatUser(user)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', backgroundColor: selectedChatUser?.id === user.id ? '#1e293b' : 'transparent', cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img src={user.avatar} alt="u" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      {user.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid #0f172a' }}></div>}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>{user.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div style={{ display: window.innerWidth < 768 && !selectedChatUser ? 'none' : 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {window.innerWidth < 768 && (
                        <button onClick={() => setSelectedChatUser(null)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Back</button>
                      )}
                      <img src={selectedChatUser.avatar} alt="u" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{selectedChatUser.name}</div>
                        <div style={{ fontSize: '10px', color: '#22c55e' }}>Online</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ alignSelf: 'flex-start', backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', maxWidth: '75%' }}>
                      Hello! Welcome to LCF direct message. Let's chat!
                    </div>
                    {messages.map(m => (
                      <div key={m.id} style={{ alignSelf: m.sender === 'you' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'you' ? '#2563eb' : '#1e293b', color: '#fff', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', maxWidth: '75%' }}>
                        {m.text}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder={`Message ${selectedChatUser.name}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                      <FiSend />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
                  Select a user from the left to start a conversation.
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- TAB 4: HUBS --- */}
        {activeTab === 'hubs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {[
              { name: 'Afrobeats & Music Producers', members: '1,420 members', desc: 'Collaborate on song lyrics, beats, and marketing.' },
              { name: 'Frontend & UI/UX Engineers', members: '2,890 members', desc: 'React, Tailwind CSS, and web application design.' },
              { name: 'Project Engineering & CAD', members: '950 members', desc: 'Shop drawings, architectural layouts, and permit reviews.' }
            ].map((hub, i) => (
              <div key={i} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>{hub.name}</h3>
                <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px' }}>{hub.members}</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '12px' }}>{hub.desc}</p>
                <button style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Join Hub</button>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 5: PROFILE --- */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundImage: `url(${currentUser?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ padding: '0 20px 20px', position: 'relative', marginTop: '-45px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #151c2c', objectFit: 'cover' }} />
                <button onClick={() => setIsEditingProfile(true)} style={{ padding: '6px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiEdit3 /> Edit Profile
                </button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0' }}>{currentUser?.full_name}</h2>
              <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '10px' }}>@{currentUser?.username}</div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 14px 0' }}>{currentUser?.bio}</p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
                <div><strong style={{ color: '#fff' }}>{currentUser?.followers}</strong> Followers</div>
                <div><strong style={{ color: '#fff' }}>{currentUser?.following}</strong> Following</div>
              </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditingProfile && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Edit Profile</h3>
                    <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
                  </div>

                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bio</label>
                      <textarea rows={2} value={editBio} onChange={(e) => setEditBio(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Avatar Image URL</label>
                      <input type="text" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cover Banner Image URL</label>
                      <input type="text" value={editCover} onChange={(e) => setEditCover(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" style={{ marginTop: '8px', padding: '10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Save Changes</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {window.innerWidth < 768 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: 100 }}>
          {[
            { id: 'feed', icon: <FiHome size={20} /> },
            { id: 'reels', icon: <FiVideo size={20} /> },
            { id: 'chats', icon: <FiMessageSquare size={20} /> },
            { id: 'hubs', icon: <FiUsers size={20} /> },
            { id: 'profile', icon: <FiUser size={20} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ background: 'none', border: 'none', color: activeTab === tab.id ? '#3b82f6' : '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
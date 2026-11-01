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
  FiSend,
  FiImage,
  FiLogOut,
  FiCheckCircle,
  FiSearch,
  FiEdit3,
  FiX,
  FiCamera,
  FiPlus
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

  // Registered Database Users & Search
  const [dbUsers, setDbUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Posts State
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImageBase64, setNewPostImageBase64] = useState(null);

  // Reels State
  const [reels, setReels] = useState([
    { id: '1', title: 'Tech Prototyping Showcase', user: 'lekkxygold', views: '3.4k', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
    { id: '2', title: 'Commercial Lounge Architecture', user: 'gene_foster', views: '1.9k', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400' }
  ]);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelUrl, setNewReelUrl] = useState('');

  // Two-Way Chat State
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPhotoBase64, setChatPhotoBase64] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [friendRequests, setFriendRequests] = useState({});

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
    if (session) {
      fetchRealUsers();
      fetchPosts();
    }
  }, [session]);

  const fetchUserProfile = async (user) => {
    const isVerifiedSpecial = user.email?.toLowerCase() === 'omoopeola1@gmail.com';
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        data = {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email.split('@')[0],
          full_name: user.user_metadata?.full_name || (isVerifiedSpecial ? 'Omoopeola' : 'LCF Member'),
          bio: isVerifiedSpecial ? 'Verified Official LCF Pioneer Account.' : 'LCF Community Member.',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
          verified: isVerifiedSpecial
        };
        await supabase.from('profiles').upsert([data]);
      }

      setCurrentUser(data);
      setEditName(data.full_name);
      setEditBio(data.bio || '');
    } catch (e) {
      console.log('Profile fetch error:', e);
    }
  };

  const fetchRealUsers = async (query = '') => {
    try {
      let req = supabase.from('profiles').select('*');
      if (query.trim()) {
        req = req.or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`);
      }
      const { data } = await req.limit(50);
      if (data && data.length > 0) {
        setDbUsers(data);
      }
    } catch (e) {
      console.log('Users fetch error:', e);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
    } catch (e) {
      console.log('Posts fetch error:', e);
    }
  };

  // Real-time messages sync
  useEffect(() => {
    if (!session || !selectedChatUser) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${selectedChatUser.id}),and(sender_id.eq.${selectedChatUser.id},recipient_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (
          (payload.new.sender_id === session.user.id && payload.new.recipient_id === selectedChatUser.id) ||
          (payload.new.sender_id === selectedChatUser.id && payload.new.recipient_id === session.user.id)
        ) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, selectedChatUser]);

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

  const handleDeviceFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      if (field === 'newPostImageBase64') {
        setNewPostImageBase64(base64);
      } else {
        const updated = { ...currentUser, [field]: base64 };
        setCurrentUser(updated);
        await supabase.from('profiles').upsert([updated]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImageBase64) return;

    const newPost = {
      id: Date.now().toString(),
      user_name: currentUser?.full_name || 'You',
      username: currentUser?.username || 'you',
      avatar: currentUser?.avatar_url,
      verified: currentUser?.verified,
      content: newPostText,
      image: newPostImageBase64,
      likes: 0,
      created_at: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setNewPostImageBase64(null);

    try {
      await supabase.from('posts').insert([newPost]);
    } catch (err) {
      console.log('Post error:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatPhotoBase64) || !selectedChatUser) return;

    const msg = {
      sender_id: session.user.id,
      recipient_id: selectedChatUser.id,
      text: newMessage,
      image: chatPhotoBase64
    };

    const { data, error } = await supabase.from('messages').insert([msg]).select().single();
    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setChatPhotoBase64(null);
    }
  };

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
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Connect with Real Registered Users</p>
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
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  required
                  placeholder="Username"
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

  // --- MAIN APP (Full Screen Mobile Layout) ---
  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
            LCF
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700' }}>LCF Hub</span>
        </div>

        {/* Desktop Navbar */}
        <nav style={{ display: window.innerWidth < 768 ? 'none' : 'flex', gap: '4px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '24px', padding: '3px' }}>
          {[
            { id: 'feed', label: 'Feed', icon: <FiHome /> },
            { id: 'find', label: 'Find Friends', icon: <FiUsers /> },
            { id: 'reels', label: 'Reels', icon: <FiVideo /> },
            { id: 'chats', label: 'Chats', icon: <FiMessageSquare /> },
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
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleSignOut} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Sign Out">
          <FiLogOut size={16} />
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        
        {/* --- TAB 1: FEED --- */}
        {activeTab === 'feed' && (
          <div>
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

              {newPostImageBase64 && (
                <div style={{ position: 'relative', marginTop: '10px' }}>
                  <img src={newPostImageBase64} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button onClick={() => setNewPostImageBase64(null)} style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}>
                    <FiX size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}>
                  <FiImage size={16} /> Attach Photo from Phone
                  <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'newPostImageBase64')} style={{ display: 'none' }} />
                </label>

                <button onClick={handleCreatePost} style={{ padding: '6px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Post
                </button>
              </div>
            </div>

            {posts.map(post => (
              <div key={post.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <img src={post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {post.user_name}
                      {post.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified Account" />}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{post.username} • {post.created_at}</div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', lineHeight: '1.4', color: '#e2e8f0', margin: '0 0 10px 0' }}>{post.content}</p>

                {post.image && (
                  <img src={post.image} alt="media" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                )}

                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #1e293b', paddingTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                  <button onClick={() => setLikedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))} style={{ background: 'none', border: 'none', color: likedPosts[post.id] ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <FiHeart fill={likedPosts[post.id] ? '#ef4444' : 'none'} /> {post.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 2: FIND FRIENDS --- */}
        {activeTab === 'find' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>Find Friends & Registered Members</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Search registered members in the live Supabase database.</p>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8', fontSize: '14px' }} />
              <input
                type="text"
                placeholder="Search by name, username or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  fetchRealUsers(e.target.value);
                }}
                style={{ width: '100%', padding: '10px 10px 10px 36px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {dbUsers.map(user => (
                <div key={user.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />

                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                    {user.full_name}
                    {user.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified Account" />}
                  </div>
                  <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px' }}>@{user.username}</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 14px 0', flex: 1 }}>{user.bio || 'LCF Member'}</p>

                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      onClick={() => {
                        setFriendRequests(prev => ({ ...prev, [user.username]: 'pending' }));
                        alert(`Friend request sent to @${user.username}!`);
                      }}
                      style={{ flex: 1, padding: '6px', backgroundColor: friendRequests[user.username] ? '#1e293b' : '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {friendRequests[user.username] === 'pending' ? 'Request Sent' : 'Add Friend'}
                    </button>
                    <button
                      onClick={() => { setSelectedChatUser(user); setActiveTab('chats'); }}
                      style={{ padding: '6px 10px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 3: REELS --- */}
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
                  placeholder="Video/Image URL..."
                  value={newReelUrl}
                  onChange={(e) => setNewReelUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {
                    setReels([{ id: Date.now().toString(), title: newReelTitle, user: currentUser?.username || 'user', views: '1 view', url: newReelUrl }, ...reels]);
                    setIsCreatingReel(false);
                    setNewReelTitle('');
                    setNewReelUrl('');
                  }} style={{ padding: '6px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Publish</button>
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

        {/* --- TAB 4: TWO-WAY CHATS WITH REGISTERED USERS --- */}
        {activeTab === 'chats' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', height: '520px', display: 'grid', gridTemplateColumns: window.innerWidth < 768 && selectedChatUser ? '1fr' : (window.innerWidth < 768 ? '1fr' : '260px 1fr'), overflow: 'hidden' }}>
            
            {/* Contacts Directory */}
            <div style={{ borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '12px', display: window.innerWidth < 768 && selectedChatUser ? 'none' : 'block' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0' }}>Direct Messages</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '420px' }}>
                {dbUsers.filter(u => u.id !== session?.user?.id).map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedChatUser(user)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', backgroundColor: selectedChatUser?.id === user.id ? '#1e293b' : 'transparent', cursor: 'pointer' }}
                  >
                    <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {user.full_name}
                        {user.verified && <FiCheckCircle size={10} color="#3b82f6" />}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Conversation View */}
            <div style={{ display: window.innerWidth < 768 && !selectedChatUser ? 'none' : 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {window.innerWidth < 768 && (
                        <button onClick={() => setSelectedChatUser(null)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Back</button>
                      )}
                      <img src={selectedChatUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {selectedChatUser.full_name}
                          {selectedChatUser.verified && <FiCheckCircle size={11} color="#3b82f6" />}
                        </div>
                        <div style={{ fontSize: '10px', color: '#22c55e' }}>Active</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {messages.map(m => {
                      const isMe = m.sender_id === session.user.id;
                      return (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            backgroundColor: isMe ? '#2563eb' : '#1e293b',
                            color: '#fff',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            maxWidth: '75%'
                          }}
                        >
                          {m.text && <div>{m.text}</div>}
                          {m.image && <img src={m.image} alt="shared" style={{ width: '100%', borderRadius: '8px', marginTop: '6px', maxHeight: '180px', objectFit: 'cover' }} />}
                        </div>
                      );
                    })}
                  </div>

                  {chatPhotoBase64 && (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid #1e293b', position: 'relative' }}>
                      <img src={chatPhotoBase64} alt="attachment" style={{ height: '60px', borderRadius: '6px' }} />
                      <button onClick={() => setChatPhotoBase64(null)} style={{ position: 'absolute', top: 4, left: 70, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}>
                        <FiX size={12} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center' }} title="Send Photo">
                      <FiImage size={18} />
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setChatPhotoBase64(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} style={{ display: 'none' }} />
                    </label>

                    <input
                      type="text"
                      placeholder={`Message ${selectedChatUser.full_name}...`}
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
                  Select a registered user from the left list to start a conversation.
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- TAB 5: PROFILE --- */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundImage: `url(${currentUser?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <label style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCamera /> Cover Photo
                <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'cover_url')} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ padding: '0 20px 20px', position: 'relative', marginTop: '-45px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #151c2c', objectFit: 'cover' }} />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#fff' }}>
                    <FiCamera size={12} />
                    <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'avatar_url')} style={{ display: 'none' }} />
                  </label>
                </div>

                <button onClick={() => setIsEditingProfile(true)} style={{ padding: '6px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiEdit3 /> Edit Profile
                </button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentUser?.full_name}
                {currentUser?.verified && <FiCheckCircle size={16} color="#3b82f6" title="Verified Account" />}
              </h2>
              <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '10px' }}>@{currentUser?.username} • {currentUser?.email}</div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 14px 0' }}>{currentUser?.bio}</p>
            </div>

            {/* Edit Profile Modal */}
            {isEditingProfile && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Edit Profile</h3>
                    <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const updated = { ...currentUser, full_name: editName, bio: editBio };
                    setCurrentUser(updated);
                    setIsEditingProfile(false);
                    await supabase.from('profiles').upsert([updated]);
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bio</label>
                      <textarea rows={2} value={editBio} onChange={(e) => setEditBio(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }} />
                    </div>
                    <button type="submit" style={{ marginTop: '8px', padding: '10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>Save Changes</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Full-Screen Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.98)', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-around', padding: '12px 0', zIndex: 100 }}>
        {[
          { id: 'feed', label: 'Feed', icon: <FiHome size={20} /> },
          { id: 'find', label: 'Friends', icon: <FiUsers size={20} /> },
          { id: 'reels', label: 'Reels', icon: <FiVideo size={20} /> },
          { id: 'chats', label: 'Chats', icon: <FiMessageSquare size={20} /> },
          { id: 'profile', label: 'Profile', icon: <FiUser size={20} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ background: 'none', border: 'none', color: activeTab === tab.id ? '#3b82f6' : '#94a3b8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '10px' }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
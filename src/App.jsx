import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  FiHome,
  FiMessageSquare,
  FiVideo,
  FiUsers,
  FiUser,
  FiHeart,
  FiSend,
  FiImage,
  FiLogOut,
  FiCheckCircle,
  FiSearch,
  FiEdit3,
  FiX,
  FiCamera,
  FiSave,
  FiBell,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiMessageCircle,
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);

  // Screen Width State (Prevents direct window SSR/initialization crash)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth State
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);

  // PWA Install Prompt State
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // User Profile State
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Registered Users Directory State
  const [dbUsers, setDbUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Friend Requests & Count State
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequestMap, setSentRequestMap] = useState({});
  const [friendCount, setFriendCount] = useState(0);

  // Posts & Comments State
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImageBase64, setNewPostImageBase64] = useState(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [postCommentsMap, setPostCommentsMap] = useState({});
  const [commentInputMap, setCommentInputMap] = useState({});

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Reels State
  const [reels, setReels] = useState([
    { id: '1', title: 'Tech Prototyping Showcase', user: 'lekkxygold', views: '3.4k', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
    { id: '2', title: 'Commercial Lounge Architecture', user: 'gene_foster', views: '1.9k', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400' }
  ]);
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelUrl, setNewReelUrl] = useState('');

  // Messaging State & Unread Counts Map
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPhotoBase64, setChatPhotoBase64] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      }
      setLoading(false);
    }).catch(err => {
      console.log('Session fetch error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      }
    });

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Presence Heartbeat Tracker
  useEffect(() => {
    if (!session) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', session.user.id);
      } catch (err) {
        console.log('Presence update error:', err);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAllRegisteredUsers();
      fetchPosts();
      fetchFriendRequests();
      fetchUnreadMessageCounts();
    }
  }, [session]);

  const fetchUnreadMessageCounts = async () => {
    if (!session) return;
    try {
      // Fetch all messages where current user is the recipient
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('recipient_id', session.user.id);

      if (!error && data) {
        const counts = {};
        data.forEach(m => {
          // Exclude messages from the user currently opened in chat
          if (!selectedChatUser || selectedChatUser.id !== m.sender_id) {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
          }
        });
        setUnreadCounts(counts);
      }
    } catch (e) {
      console.log('Unread count fetch error:', e);
    }
  };

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstallPromptEvent(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

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
          verified: isVerifiedSpecial,
          last_seen: new Date().toISOString()
        };
        await supabase.from('profiles').upsert([data]);
      }

      setCurrentUser(data);
      setEditName(data.full_name || '');
      setEditBio(data.bio || '');
    } catch (e) {
      console.log('Profile fetch error:', e);
    }
  };

  const fetchAllRegisteredUsers = async (query = '') => {
    try {
      let req = supabase.from('profiles').select('*');
      if (query && query.trim().length > 0) {
        req = req.or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`);
      }
      const { data, error } = await req.limit(100);
      if (!error && data) {
        setDbUsers(data);
      }
    } catch (e) {
      console.log('Error fetching registered users:', e);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setPosts(data);
        data.forEach(p => fetchCommentsForPost(p.id));
      }
    } catch (e) {
      console.log('Posts fetch error:', e);
    }
  };

  const fetchCommentsForPost = async (postId) => {
    try {
      const { data } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (data) {
        setPostCommentsMap(prev => ({ ...prev, [postId]: data }));
      }
    } catch (e) {
      console.log('Comments fetch error:', e);
    }
  };

  const handleToggleLike = async (post) => {
    const isCurrentlyLiked = likedPosts[post.id];
    const updatedLikes = isCurrentlyLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1;

    setLikedPosts(prev => ({ ...prev, [post.id]: !isCurrentlyLiked }));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: updatedLikes } : p));

    try {
      await supabase.from('posts').update({ likes: updatedLikes }).eq('id', post.id);
    } catch (e) {
      console.log('Like update error:', e);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputMap[postId];
    if (!text || !text.trim()) return;

    const newCommentObj = {
      post_id: postId,
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      avatar: currentUser?.avatar_url,
      comment: text
    };

    setPostCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { ...newCommentObj, id: Date.now() }]
    }));
    setCommentInputMap(prev => ({ ...prev, [postId]: '' }));

    try {
      await supabase.from('post_comments').insert([newCommentObj]);
    } catch (e) {
      console.log('Add comment error:', e);
    }
  };

  const fetchFriendRequests = async () => {
    if (!session) return;
    try {
      const { data: incoming } = await supabase
        .from('friend_requests')
        .select('*, sender:sender_id(*)')
        .eq('recipient_id', session.user.id)
        .eq('status', 'pending');

      if (incoming) {
        setIncomingRequests(incoming);
      }

      const { data: sent } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .eq('status', 'accepted');

      if (sent) {
        setFriendCount(sent.length);
      }

      const { data: allUserRequests } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`);

      if (allUserRequests) {
        const map = {};
        allUserRequests.forEach(r => {
          const otherId = r.sender_id === session.user.id ? r.recipient_id : r.sender_id;
          if (r.status === 'accepted') {
            map[otherId] = 'accepted';
          } else if (r.sender_id === session.user.id) {
            map[otherId] = r.status;
          }
        });
        setSentRequestMap(map);
      }
    } catch (e) {
      console.log('Friend requests fetch error:', e);
    }
  };

  const handleSendFriendRequest = async (targetUser) => {
    if (!session) return;
    if (targetUser.id === session.user.id) {
      alert("You cannot send a friend request to yourself.");
      return;
    }
    try {
      const req = {
        sender_id: session.user.id,
        recipient_id: targetUser.id,
        status: 'pending'
      };
      await supabase.from('friend_requests').insert([req]);
      setSentRequestMap(prev => ({ ...prev, [targetUser.id]: 'pending' }));
      alert(`Friend request sent to ${targetUser.full_name}!`);
    } catch (e) {
      console.log('Send request error:', e);
    }
  };

  const handleRespondFriendRequest = async (requestId, newStatus) => {
    try {
      await supabase
        .from('friend_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      fetchFriendRequests();
      alert(`Friend request ${newStatus}!`);
    } catch (e) {
      console.log('Respond request error:', e);
    }
  };

  // Real-time notifications and real-time unread counter subscription
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:global_chat_stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        if (msg.recipient_id === session.user.id) {
          // If we are NOT currently looking at this sender's chat room, increment unread count in real-time
          if (!selectedChatUser || selectedChatUser.id !== msg.sender_id) {
            setUnreadCounts(prev => ({
              ...prev,
              [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
            }));
          }
          const sender = dbUsers.find(u => u.id === msg.sender_id) || { full_name: 'Someone' };
          setNotifications(prev => [
            { id: Date.now(), text: `New message from ${sender.full_name || 'Someone'}`, time: 'Just now', type: 'message' },
            ...prev
          ]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests' }, payload => {
        if (payload.new.recipient_id === session.user.id) {
          fetchFriendRequests();
          setNotifications(prev => [
            { id: Date.now(), text: `You received a new friend request!`, time: 'Just now', type: 'friend' },
            ...prev
          ]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, dbUsers, selectedChatUser]);

  // Real-time Chat Room Subscription & Auto-clear unread badge when opening chat
  useEffect(() => {
    if (!session || !selectedChatUser) return;

    // Clear unread badge instantly in real-time when chat is opened
    setUnreadCounts(prev => ({ ...prev, [selectedChatUser.id]: 0 }));

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

    const chatChannel = supabase
      .channel(`chat_room_${session.user.id}_${selectedChatUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === session.user.id && msg.recipient_id === selectedChatUser.id) ||
            (msg.sender_id === selectedChatUser.id && msg.recipient_id === session.user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [session, selectedChatUser]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, full_name: fullName } }
        });
        if (error) throw error;

        if (data?.user) {
          const isVerifiedSpecial = email.toLowerCase() === 'omoopeola1@gmail.com';
          await supabase.from('profiles').upsert([{
            id: data.user.id,
            email,
            username,
            full_name: fullName,
            bio: isVerifiedSpecial ? 'Verified Official LCF Pioneer Account.' : 'LCF Member',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
            verified: isVerifiedSpecial,
            last_seen: new Date().toISOString()
          }]);
        }

        setAuthSuccess('Registration successful! Please check your email for the verification link.');
        setAuthMode('login');
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error('Your email is not verified yet. Please verify or request a new link below.');
          }
          throw error;
        }
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setResendingEmail(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      });

      if (error) throw error;

      setAuthSuccess(`A fresh verification link has been sent to ${email}! Please check your inbox or spam folder.`);
      setAuthMode('login');
    } catch (err) {
      setAuthError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingEmail(false);
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
        alert('Photo updated and saved permanently!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileChanges = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = { ...currentUser, full_name: editName, bio: editBio };
      const { error } = await supabase.from('profiles').upsert([updated]);
      if (error) throw error;
      setCurrentUser(updated);
      setIsEditingProfile(false);
      alert('Profile successfully saved to Supabase database!');
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImageBase64) return;

    const newPost = {
      id: Date.now().toString(),
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      username: currentUser?.username || 'you',
      avatar: currentUser?.avatar_url,
      verified: currentUser?.verified,
      content: newPostText,
      image: newPostImageBase64,
      likes: 0
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

    const tempMsg = { ...msg, id: Date.now().toString(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setChatPhotoBase64(null);

    try {
      const { data, error } = await supabase.from('messages').insert([msg]).select().single();
      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
      }
    } catch (err) {
      console.log('Message send error:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  const getUserStatusText = (lastSeenString) => {
    if (!lastSeenString) return <span style={{ color: '#94a3b8' }}>Offline</span>;
    const lastSeenDate = new Date(lastSeenString);
    const diffMinutes = Math.floor((new Date() - lastSeenDate) / 60000);

    if (diffMinutes < 2) {
      return <span style={{ color: '#22c55e' }}>● Online</span>;
    } else if (diffMinutes < 60) {
      return <span style={{ color: '#94a3b8' }}>Last seen {diffMinutes}m ago</span>;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return <span style={{ color: '#94a3b8' }}>Last seen {hours}h ago</span>;
    } else {
      return <span style={{ color: '#94a3b8' }}>Offline</span>;
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

  if (!session) {
    return (
      <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', width: '100vw' }}>
        <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>LCF Social Hub</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Secure and Private Chat</p>
          </div>

          {authSuccess && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', lineHeight: '1.4' }}>
              {authSuccess}
            </div>
          )}

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', lineHeight: '1.4' }}>
              {authError}
            </div>
          )}

          {(authMode === 'login' || authMode === 'signup') && (
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
          )}

          {authMode === 'resend' && (
            <form onSubmit={handleResendVerification} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                If your verification link expired, enter your email below to receive a new link.
              </p>
              <input
                type="email"
                required
                placeholder="Your registered email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={resendingEmail} style={{ padding: '12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiRefreshCw /> {resendingEmail ? 'Sending...' : 'Send New Verification Link'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {authMode === 'login' && (
              <>
                <p style={{ margin: 0 }}>No account? <span onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign up</span></p>
                <p style={{ margin: 0 }}><span onClick={() => { setAuthMode('resend'); setAuthError(''); setAuthSuccess(''); }} style={{ color: '#38bdf8', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Verification link expired? Resend email</span></p>
              </>
            )}

            {authMode === 'signup' && (
              <p style={{ margin: 0 }}>Have an account? <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign in</span></p>
            )}

            {authMode === 'resend' && (
              <p style={{ margin: 0 }}>Back to <span onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>Sign in</span></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', width: '100vw', maxWidth: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', paddingBottom: '80px', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
            LCF
          </div>
          <span style={{ fontSize: '16px', fontWeight: '700' }}>LCF Hub</span>
        </div>

        <nav style={{ display: !isMobile ? 'flex' : 'none', gap: '4px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '24px', padding: '3px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleInstallClick}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#60a5fa', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}
            title="Download/Install App"
          >
            <FiDownload size={14} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Install App</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: '#1e293b', border: 'none', color: (notifications.length > 0 || incomingRequests.length > 0) ? '#60a5fa' : '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              title="Notifications"
            >
              <FiBell size={16} />
              {(notifications.length + incomingRequests.length) > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {notifications.length + incomingRequests.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '40px', width: '280px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Notifications & Requests</span>
                  <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer' }}>Clear all</button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {incomingRequests.map(req => (
                    <div key={req.id} style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(37,99,235,0.1)' }}>
                      <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600', marginBottom: '6px' }}>
                        {req.sender?.full_name || 'A user'} sent you a friend request
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                          style={{ flex: 1, padding: '4px', backgroundColor: '#22c55e', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'declined')}
                          style={{ flex: 1, padding: '4px', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}

                  {notifications.map((n, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(30,41,59,0.5)', fontSize: '12px' }}>
                      <div style={{ color: '#fff', marginBottom: '2px' }}>{n.text}</div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>{n.time}</div>
                    </div>
                  ))}

                  {incomingRequests.length === 0 && notifications.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSignOut} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }} title="Sign Out">
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* FULL WIDTH MOBILE CONTAINER */}
      <main style={{ width: '100vw', maxWidth: '800px', margin: '0 auto', padding: isMobile ? '4px' : '16px', boxSizing: 'border-box' }}>
        {activeTab === 'feed' && (
          <div>
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: isMobile ? '0px' : '12px', padding: '14px', marginBottom: '16px' }}>
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

            {posts.map(post => {
              const comments = postCommentsMap[post.id] || [];
              const isCommentsOpen = openCommentsPostId === post.id;
              return (
                <div key={post.id} style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderBottom: '1px solid #1e293b', borderRadius: isMobile ? '0px' : '12px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <img src={post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {post.user_name}
                        {post.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified Account" />}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{post.username}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', lineHeight: '1.4', color: '#e2e8f0', margin: '0 0 10px 0' }}>{post.content}</p>

                  {post.image && (
                    <img src={post.image} alt="media" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                  )}

                  <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #1e293b', paddingTop: '10px', color: '#94a3b8', fontSize: '12px' }}>
                    <button onClick={() => handleToggleLike(post)} style={{ background: 'none', border: 'none', color: likedPosts[post.id] ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <FiHeart fill={likedPosts[post.id] ? '#ef4444' : 'none'} /> {post.likes || 0}
                    </button>
                    <button onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <FiMessageCircle /> {comments.length} Comments
                    </button>
                  </div>

                  {isCommentsOpen && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                        {comments.map((c, i) => (
                          <div key={c.id || i} style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                            <span style={{ fontWeight: '600', color: '#60a5fa', marginRight: '6px' }}>{c.user_name}:</span>
                            <span style={{ color: '#e2e8f0' }}>{c.comment}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputMap[post.id] || ''}
                          onChange={(e) => setCommentInputMap({ ...commentInputMap, [post.id]: e.target.value })}
                          style={{ flex: 1, padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
                        />
                        <button onClick={() => handleAddComment(post.id)} style={{ padding: '8px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                          Comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'find' && (
          <div style={{ padding: '0 4px' }}>
            {incomingRequests.length > 0 && (
              <div style={{ backgroundColor: '#151c2c', border: '1px solid #2563eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUserPlus /> Incoming Friend Requests ({incomingRequests.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {incomingRequests.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={req.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{req.sender?.full_name || 'Member'}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{req.sender?.username}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                          style={{ padding: '6px 14px', backgroundColor: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FiUserCheck /> Accept
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'declined')}
                          style={{ padding: '6px 14px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FiUserX /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>Find Friends & Registered Members</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Search registered members in the live database.</p>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8', fontSize: '14px' }} />
              <input
                type="text"
                placeholder="Search username, name, or email..."
                value={userSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserSearchQuery(val);
                  fetchAllRegisteredUsers(val);
                }}
                style={{ width: '100%', padding: '10px 10px 10px 36px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {dbUsers.map(user => {
                const reqStatus = sentRequestMap[user.id];
                const isSelf = user.id === session?.user?.id;
                return (
                  <div key={user.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />

                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                      {user.full_name}
                      {user.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified Account" />}
                    </div>
                    <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px' }}>@{user.username}</div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 14px 0', flex: 1 }}>{user.bio || 'LCF Member'}</p>

                    {!isSelf && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                          disabled={reqStatus === 'pending' || reqStatus === 'accepted'}
                          onClick={() => handleSendFriendRequest(user)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: reqStatus === 'accepted' ? '#22c55e' : (reqStatus === 'pending' ? '#1e293b' : '#2563eb'),
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: reqStatus ? 'default' : 'pointer'
                          }}
                        >
                          {reqStatus === 'accepted' ? 'Friends' : (reqStatus === 'pending' ? 'Request Sent' : 'Add Friend')}
                        </button>
                        <button
                          onClick={() => { setSelectedChatUser(user); setActiveTab('chats'); }}
                          style={{ padding: '6px 10px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Chat
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reels' && (
          <div style={{ padding: '0 4px' }}>
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

        {activeTab === 'chats' && (
          <div style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderRadius: isMobile ? '0px' : '14px', height: isMobile ? 'calc(100vh - 140px)' : '520px', display: 'grid', gridTemplateColumns: isMobile && selectedChatUser ? '1fr' : (isMobile ? '1fr' : '260px 1fr'), overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '12px', display: isMobile && selectedChatUser ? 'none' : 'block' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0' }}>Direct Messages</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '420px' }}>
                {dbUsers.filter(u => u.id !== session?.user?.id).map(user => {
                  const unreadCount = unreadCounts[user.id] || 0;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedChatUser(user)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px', borderRadius: '8px', backgroundColor: selectedChatUser?.id === user.id ? '#1e293b' : 'transparent', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</span>
                            {user.verified && <FiCheckCircle size={10} color="#3b82f6" />}
                          </div>
                          <div style={{ fontSize: '10px' }}>{getUserStatusText(user.last_seen)}</div>
                        </div>
                      </div>

                      {/* Display unread badge ONLY when there are active unread messages */}
                      {unreadCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></span>
                          <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxShadow: '0 2px 6px rgba(37,99,235,0.4)' }}>
                            {unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: isMobile && !selectedChatUser ? 'none' : 'flex', flexDirection: 'column', height: '100%' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isMobile && (
                        <button onClick={() => setSelectedChatUser(null)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Back</button>
                      )}
                      <img src={selectedChatUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {selectedChatUser.full_name}
                          {selectedChatUser.verified && <FiCheckCircle size={11} color="#3b82f6" />}
                        </div>
                        <div style={{ fontSize: '10px' }}>{getUserStatusText(selectedChatUser.last_seen)}</div>
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

        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderRadius: isMobile ? '0px' : '14px', overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundImage: `url(${currentUser?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <label style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCamera /> Change Cover Photo
                <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'cover_url')} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ padding: '0 16px 20px', position: 'relative', marginTop: '-45px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #151c2c', objectFit: 'cover' }} />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#fff' }}>
                    <FiCamera size={12} />
                    <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'avatar_url')} style={{ display: 'none' }} />
                  </label>
                </div>

                <button onClick={() => setIsEditingProfile(true)} style={{ padding: '6px 14px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <FiEdit3 /> Edit Profile
                </button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentUser?.full_name}
                {currentUser?.verified && <FiCheckCircle size={16} color="#3b82f6" title="Verified Account" />}
              </h2>
              <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '8px' }}>@{currentUser?.username} • {currentUser?.email}</div>
              <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600', marginBottom: '10px' }}>👥 {friendCount} Friends</div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 14px 0' }}>{currentUser?.bio}</p>
            </div>

            {isEditingProfile && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Edit Profile</h3>
                    <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
                  </div>

                  <form onSubmit={handleSaveProfileChanges} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bio</label>
                      <textarea rows={2} value={editBio} onChange={(e) => setEditBio(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }} />
                    </div>
                    <button type="submit" disabled={savingProfile} style={{ marginTop: '8px', padding: '10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FiSave /> {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CLEAN APP INSTALL MODAL */}
      {showInstallModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Install LCF Mobile App</h3>
              <button onClick={() => setShowInstallModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              To install LCF as an app on your phone:
            </p>
            <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
              <div>🟢 <b>Android (Chrome):</b> Tap browser menu (⋮) → <b>Install app</b> or <b>Add to Home screen</b>.</div>
              <div>🍏 <b>iPhone (Safari):</b> Tap Share button (⎋) → <b>Add to Home Screen</b>.</div>
            </div>
            <button onClick={() => setShowInstallModal(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.98)', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: '100', width: '100vw', boxSizing: 'border-box' }}>
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

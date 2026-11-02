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

  // Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'resend'
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

  // Messaging State
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPhotoBase64, setChatPhotoBase64] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      }
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

  useEffect(() => {
    if (session) {
      fetchAllRegisteredUsers();
      fetchPosts();
      fetchFriendRequests();
    }
  }, [session]);

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

      const { data: allSent } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', session.user.id);

      if (allSent) {
        const map = {};
        allSent.forEach(r => { map[r.recipient_id] = r.status; });
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

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:notifications_stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new.recipient_id === session.user.id) {
          const sender = dbUsers.find(u => u.id === payload.new.sender_id) || { full_name: 'Someone' };
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
  }, [session, dbUsers]);

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

    const chatChannel = supabase
      .channel(`chat_${session.user.id}_${selectedChatUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        if (
          (msg.sender_id === session.user.id && msg.recipient_id === selectedChatUser.id) ||
          (msg.sender_id === selectedChatUser.id && msg.recipient_id === session.user.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      })
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
            verified: isVerifiedSpecial
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
             

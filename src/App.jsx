import React, { useState, useEffect, useRef } from 'react';
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
  FiMessageCircle,
  FiRefreshCw,
  FiDownload,
  FiMic,
  FiSquare,
  FiPlus,
  FiGift,
  FiShare2,
  FiCreditCard,
  FiCheck,
  FiCopy,
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiCornerDownRight,
  FiArrowLeft
} from 'react-icons/fi';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  // Screen Width State
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth State & Referral Param Capture
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    const getParam = (param) => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has(param)) return urlParams.get(param);
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
        if (hashParams.has(param)) return hashParams.get(param);
      }
      return null;
    };

    const refCode = getParam('ref');
    if (refCode) {
      setReferredBy(refCode);
      setAuthMode('signup');
      localStorage.setItem('lcf_referred_by', refCode);
    } else {
      const savedRef = localStorage.getItem('lcf_referred_by');
      if (savedRef) setReferredBy(savedRef);
    }
  }, []);

  // PWA Install Prompt State
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // User Profile & LCF Points Economy State
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Points Economy
  const [lcfPoints, setLcfPoints] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountPoints, setWithdrawAmountPoints] = useState(2000);
  const [payoutDetails, setPayoutDetails] = useState('');

  // Registered Users Directory State
  const [dbUsers, setDbUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Friends & Connections State
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
  const [replyInputMap, setReplyInputMap] = useState({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [likedPostsMap, setLikedPostsMap] = useState({});

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Reels State & Sound / Reel Comments
  const [reels, setReels] = useState([]);
  const [likedReelsMap, setLikedReelsMap] = useState({});
  const [mutedReelsMap, setMutedReelsMap] = useState({});
  const [activeReelId, setActiveReelId] = useState(null);
  const [openReelCommentsId, setOpenReelCommentsId] = useState(null);
  const [reelCommentsMap, setReelCommentsMap] = useState({});
  const [reelCommentInput, setReelCommentInput] = useState('');
  const [reelReplyInput, setReelReplyInput] = useState('');
  const [activeReelReplyId, setActiveReelReplyId] = useState(null);

  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelMediaBase64, setNewReelMediaBase64] = useState(null);
  const [isReelVideoType, setIsReelVideoType] = useState(false);

  // Messaging State & Unread Counts Map
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatPhotoBase64, setChatPhotoBase64] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const diffMinutes = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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
      fetchReels();
      fetchFriendRequests();
      fetchUnreadMessageCounts();
      fetchUserLikes();
    }
  }, [session]);

  const fetchUserLikes = async () => {
    if (!session) return;
    try {
      const { data: rLikes } = await supabase
        .from('reel_likes')
        .select('reel_id')
        .eq('user_id', session.user.id);
      
      if (rLikes) {
        const rMap = {};
        rLikes.forEach(l => { rMap[l.reel_id] = true; });
        setLikedReelsMap(rMap);
      }

      const { data: pLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', session.user.id);
      
      if (pLikes) {
        const pMap = {};
        pLikes.forEach(l => { pMap[l.post_id] = true; });
        setLikedPostsMap(pMap);
      }
    } catch (e) {
      console.log('Error fetching user likes:', e);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchUnreadMessageCounts = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('recipient_id', session.user.id);

      if (!error && data) {
        const counts = {};
        data.forEach(m => {
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
          full_name: user.user_metadata?.full_name || (isVerifiedSpecial ? 'Omoopeola' : 'lekkxygold'),
          bio: isVerifiedSpecial ? 'Verified Official LCF Pioneer Account.' : 'Am lekkxygold and needed more friends here',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
          verified: isVerifiedSpecial,
          lcf_points: 5,
          last_claim_date: new Date().toISOString(),
          last_seen: new Date().toISOString()
        };
        await supabase.from('profiles').upsert([data]);
      }

      setCurrentUser(data);
      setLcfPoints(data.lcf_points || 0);
      setLastClaimDate(data.last_claim_date || null);
      setEditName(data.full_name || '');
      setEditBio(data.bio || '');
    } catch (e) {
      console.log('Profile fetch error:', e);
    }
  };

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setReels(data);
        if (data.length > 0 && !activeReelId) {
          setActiveReelId(data[0].id);
        }
        data.forEach(r => fetchCommentsForReel(r.id));
      }
    } catch (err) {
      console.log('Error fetching reels:', err);
    }
  };

  const fetchCommentsForReel = async (reelId) => {
    try {
      const { data } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: true });
      if (data) {
        setReelCommentsMap(prev => ({ ...prev, [reelId]: data }));
      }
    } catch (e) {
      console.log('Reel comments fetch error:', e);
    }
  };

  // OPTIMIZED REEL LIKE WITH IMMEDIATE UI UPDATE
  const handleToggleReelLike = async (reel) => {
    if (!session) return;
    const isLiked = likedReelsMap[reel.id];
    const currentLikes = Number(reel.likes) || 0;
    const newLikesCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    setLikedReelsMap(prev => ({ ...prev, [reel.id]: !isLiked }));
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, likes: newLikesCount } : r));

    try {
      if (isLiked) {
        await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reel.id)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('reel_likes')
          .insert([{ reel_id: reel.id, user_id: session.user.id }]);
      }

      await supabase
        .from('reels')
        .update({ likes: newLikesCount })
        .eq('id', reel.id);
    } catch (err) {
      console.log('Reel like sync error:', err);
      setLikedReelsMap(prev => ({ ...prev, [reel.id]: isLiked }));
      setReels(prev => prev.map(r => r.id === reel.id ? { ...r, likes: currentLikes } : r));
    }
  };

  const handleToggleReelSound = (reelId) => {
    setMutedReelsMap(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  // OPTIMIZED REEL COMMENT WITH TEMPORARY ID & ROLLBACK
  const handleAddReelComment = async (reelId, parentId = null) => {
    const textToPost = parentId ? reelReplyInput : reelCommentInput;
    if (!textToPost || !textToPost.trim()) return;

    const commentText = textToPost.trim();
    if (parentId) {
      setReelReplyInput('');
      setActiveReelReplyId(null);
    } else {
      setReelCommentInput('');
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      reel_id: reelId,
      parent_id: parentId,
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      avatar: currentUser?.avatar_url,
      comment: commentText,
      created_at: new Date().toISOString(),
      isPending: true
    };

    setReelCommentsMap(prev => ({
      ...prev,
      [reelId]: [...(prev[reelId] || []), optimisticComment]
    }));

    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .insert([{
          reel_id: reelId,
          parent_id: parentId,
          user_id: session.user.id,
          user_name: currentUser?.full_name || 'You',
          avatar: currentUser?.avatar_url,
          comment: commentText
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReelCommentsMap(prev => ({
          ...prev,
          [reelId]: (prev[reelId] || []).map(c => c.id === tempId ? data : c)
        }));
      }
    } catch (e) {
      console.log('Add reel comment error:', e);
      setReelCommentsMap(prev => ({
        ...prev,
        [reelId]: (prev[reelId] || []).filter(c => c.id !== tempId)
      }));
      if (parentId) {
        setReelReplyInput(commentText);
      } else {
        setReelCommentInput(commentText);
      }
    }
  };

  const handlePublishReel = async () => {
    if (!newReelMediaBase64) {
      alert("Please select a video or photo file from your phone first.");
      return;
    }

    const newReelObj = {
      user_id: session.user.id,
      user: currentUser?.username || 'user',
      title: newReelTitle || 'My Reel',
      url: newReelMediaBase64,
      isvideo: isReelVideoType,
      likes: 0,
      views: '1 view'
    };

    try {
      const { data, error } = await supabase
        .from('reels')
        .insert([newReelObj])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReels([data, ...reels]);
        setActiveReelId(data.id);
      }

      setIsCreatingReel(false);
      setNewReelTitle('');
      setNewReelMediaBase64(null);
      alert("Reel published successfully!");
    } catch (err) {
      alert("Failed to publish reel: " + err.message);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm("Are you sure you want to delete this reel?")) return;
    try {
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reelId);

      if (error) throw error;

      setReels(prev => prev.filter(r => r.id !== reelId));
      alert("Reel deleted successfully.");
    } catch (err) {
      alert("Failed to delete reel: " + err.message);
    }
  };

  // UPDATED CALENDAR-DAY MIDNIGHT RESET CLAIM FUNCTION
  const handleClaimDailyBonus = async () => {
    if (!session || !currentUser) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (lastClaimDate) {
      const lastClaimStr = new Date(lastClaimDate).toISOString().split('T')[0];
      if (lastClaimStr === todayStr) {
        alert("You have already claimed your daily 5 LCF points today! Come back after 12:00 AM for your next reward.");
        return;
      }
    }

    const updatedPoints = (lcfPoints || 0) + 5;
    const nowIso = new Date().toISOString();

    setLcfPoints(updatedPoints);
    setLastClaimDate(nowIso);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          lcf_points: updatedPoints, 
          last_claim_date: nowIso 
        })
        .eq('id', session.user.id);
      
      if (error) throw error;

      alert("🎉 Daily Bonus Claimed! You earned +5 LCF Points. Check back tomorrow after 12 AM!");
    } catch (err) {
      console.log('Claim bonus error:', err);
      alert("Failed to claim daily bonus. Please check your connection.");
      fetchUserProfile(session.user);
    }
  };

  const handleCopyReferralLink = () => {
    const inviteLink = `${window.location.origin}/?ref=${currentUser?.username || 'user'}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    alert(`Invite link copied to clipboard!\nShare this link to earn +80 LCF Points for every friend who signs up.`);
  };

  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator.share({
        title: 'LCF Post',
        text: post.content || 'Check out this content on LCF Social Hub',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(post.content || window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    if (withdrawAmountPoints < 2000) {
      alert("Minimum withdrawal is 2,000 LCF Points (₦1,000 Naira).");
      return;
    }
    if (withdrawAmountPoints > lcfPoints) {
      alert("Insufficient LCF Points balance.");
      return;
    }
    const nairaValue = (withdrawAmountPoints / 2000) * 1000;
    alert(`Withdrawal request of ${withdrawAmountPoints} LCF Points (₦${nairaValue.toLocaleString()} Naira) submitted to ${payoutDetails}! Processing timeframe: 24h.`);
    setShowWithdrawModal(false);
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

  // OPTIMIZED POST LIKE WITH IMMEDIATE UI UPDATE
  const handleToggleLike = async (post) => {
    if (!session) return;
    const isCurrentlyLiked = likedPostsMap[post.id];
    const currentLikes = Number(post.likes) || 0;
    const updatedLikes = isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    setLikedPostsMap(prev => ({ ...prev, [post.id]: !isCurrentlyLiked }));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: updatedLikes } : p));

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: session.user.id }]);
      }

      await supabase.from('posts').update({ likes: updatedLikes }).eq('id', post.id);
    } catch (e) {
      console.log('Like update error:', e);
      setLikedPostsMap(prev => ({ ...prev, [post.id]: isCurrentlyLiked }));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: currentLikes } : p));
    }
  };

  // OPTIMIZED POST COMMENT WITH TEMPORARY ID & ROLLBACK
  const handleAddComment = async (postId, parentId = null) => {
    const textToPost = parentId ? replyInputMap[parentId] : commentInputMap[postId];
    if (!textToPost || !textToPost.trim()) return;

    const commentText = textToPost.trim();
    if (parentId) {
      setReplyInputMap(prev => ({ ...prev, [parentId]: '' }));
      setActiveReplyCommentId(null);
    } else {
      setCommentInputMap(prev => ({ ...prev, [postId]: '' }));
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      post_id: postId,
      parent_id: parentId,
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      avatar: currentUser?.avatar_url,
      comment: commentText,
      created_at: new Date().toISOString(),
      isPending: true
    };

    setPostCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment]
    }));

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          parent_id: parentId,
          user_id: session.user.id,
          user_name: currentUser?.full_name || 'You',
          avatar: currentUser?.avatar_url,
          comment: commentText
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPostCommentsMap(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => c.id === tempId ? data : c)
        }));
      }
    } catch (e) {
      console.log('Add comment error:', e);
      setPostCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== tempId)
      }));
      if (parentId) {
        setReplyInputMap(prev => ({ ...prev, [parentId]: commentText }));
      } else {
        setCommentInputMap(prev => ({ ...prev, [postId]: commentText }));
      }
    }
  };

  const handleViewCreatorProfile = async (userId, username) => {
    if (userId === session.user.id) {
      setActiveTab('profile');
      setViewingUserProfile(null);
      return;
    }

    const found = dbUsers.find(u => u.id === userId || u.username === username);
    if (found) {
      setViewingUserProfile(found);
    } else {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) setViewingUserProfile(data);
      } catch (e) {
        console.log('Profile view error:', e);
      }
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

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:global_chat_stream')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${session.user.id}` 
        }, 
        payload => {
          const msg = payload.new;
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
      )
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

  useEffect(() => {
    if (!session || !selectedChatUser) return;

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
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [session, selectedChatUser]);

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      await supabase.from('messages').delete().eq('id', msgId);
    } catch (err) {
      console.log('Delete message error:', err);
      alert('Failed to delete message.');
    }
  };

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
            lcf_points: 5,
            last_claim_date: new Date().toISOString(),
            last_seen: new Date().toISOString()
          }]);

          const activeRefCode = referredBy || localStorage.getItem('lcf_referred_by');
          if (activeRefCode) {
            try {
              const { error: rpcError } = await supabase.rpc('credit_referral_points', {
                inviter_code: activeRefCode
              });
              if (rpcError) {
                console.log('Referral RPC error:', rpcError.message);
              } else {
                localStorage.removeItem('lcf_referred_by');
              }
            } catch (err) {
              console.log('Referral credit exception:', err);
            }
          }
        }

        setAuthSuccess('Registration successful! You can now sign in.');
        setAuthMode('login');
      } else if (authMode === 'login') {
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
      } else if (field === 'newReelMediaBase64') {
        setNewReelMediaBase64(base64);
        setIsReelVideoType(file.type.startsWith('video'));
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

  const handleSendMessage = async (e, customText = null, customAudio = null) => {
    if (e) e.preventDefault();
    const textToSend = customText !== null ? customText : newMessage;
    const audioToSend = customAudio !== null ? customAudio : null;

    if (!textToSend.trim() && !chatPhotoBase64 && !audioToSend) return;
    if (!selectedChatUser) return;

    const messageData = {
      sender_id: session.user.id,
      recipient_id: selectedChatUser.id,
      content: textToSend.trim(),
      image_url: chatPhotoBase64 || null,
      audio_url: audioToSend || null,
    };

    setNewMessage('');
    setChatPhotoBase64(null);
    setAudioBlobUrl(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
      alert('Could not send message. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          LCF Hub
        </h1>
        {session && currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">⭐ {lcfPoints} Points</span>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 animate-pulse">Loading LCF Hub...</p>
          </div>
        ) : !session ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-10">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              {authMode === 'login' ? 'Welcome Back to LCF' : 'Join LCF Social Hub'}
            </h2>
            {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError}</div>}
            {authSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{authSuccess}</div>}
            
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      required 
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Username</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600">
              {authMode === 'login' ? (
                <p>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-blue-600 font-semibold hover:underline">Sign up</button></p>
              ) : (
                <p>Already have an account? <button onClick={() => setAuthMode('login')} className="text-blue-600 font-semibold hover:underline">Sign in</button></p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Hello, {currentUser?.full_name}!</h3>
                <p className="text-sm text-gray-500">@{currentUser?.username}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <FiLogOut /> Sign Out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

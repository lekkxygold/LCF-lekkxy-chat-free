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
  FiUserCheck,
  FiUserX,
  FiMessageCircle,
  FiRefreshCw,
  FiDownload,
  FiMic,
  FiSquare,
  FiPlay,
  FiPlus,
  FiGift,
  FiShare2,
  FiCreditCard,
  FiCheck,
  FiCopy,
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiCornerDownRight
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
  const [resendingEmail, setResendingEmail] = useState(false);

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
  const [likedPosts, setLikedPosts] = useState({});

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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    }
  }, [session]);

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

  // UNIQUE LIKE PER USER FOR REELS
  const handleToggleReelLike = async (reel) => {
    const isLiked = likedReelsMap[reel.id];
    const currentLikes = Number(reel.likes) || 0;
    const newLikesCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    setLikedReelsMap(prev => ({ ...prev, [reel.id]: !isLiked }));
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, likes: newLikesCount } : r));

    try {
      await supabase
        .from('reels')
        .update({ likes: newLikesCount })
        .eq('id', reel.id);
    } catch (err) {
      console.log('Reel like update error:', err);
    }
  };

  const handleToggleReelSound = (reelId) => {
    setMutedReelsMap(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleAddReelComment = async (reelId, parentId = null) => {
    const textToPost = parentId ? reelReplyInput : reelCommentInput;
    if (!textToPost || !textToPost.trim()) return;

    const newCommentObj = {
      reel_id: reelId,
      parent_id: parentId,
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      avatar: currentUser?.avatar_url,
      comment: textToPost.trim()
    };

    setReelCommentsMap(prev => ({
      ...prev,
      [reelId]: [...(prev[reelId] || []), { ...newCommentObj, id: Date.now() }]
    }));

    if (parentId) {
      setReelReplyInput('');
      setActiveReelReplyId(null);
    } else {
      setReelCommentInput('');
    }

    try {
      await supabase.from('reel_comments').insert([newCommentObj]);
    } catch (e) {
      console.log('Add reel comment error:', e);
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

  const handleClaimDailyBonus = async () => {
    if (!session || !currentUser) return;
    const now = new Date();
    if (lastClaimDate) {
      const lastClaim = new Date(lastClaimDate);
      const hoursDiff = Math.abs(now - lastClaim) / 36e5;
      if (hoursDiff < 24) {
        alert("You have already claimed your daily 5 LCF points today! Check back in 24 hours.");
        return;
      }
    }

    const updatedPoints = lcfPoints + 5;
    const todayIso = now.toISOString();

    setLcfPoints(updatedPoints);
    setLastClaimDate(todayIso);

    try {
      await supabase
        .from('profiles')
        .update({ lcf_points: updatedPoints, last_claim_date: todayIso })
        .eq('id', session.user.id);
      
      alert("🎉 Daily Bonus Claimed! You earned +5 LCF Points.");
    } catch (err) {
      console.log('Claim bonus error:', err);
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

  // UNIQUE LIKE PER USER FOR FEED POSTS
  const handleToggleLike = async (post) => {
    const isCurrentlyLiked = likedPosts[post.id];
    const currentLikes = Number(post.likes) || 0;
    const updatedLikes = isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    setLikedPosts(prev => ({ ...prev, [post.id]: !isCurrentlyLiked }));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: updatedLikes } : p));

    try {
      await supabase.from('posts').update({ likes: updatedLikes }).eq('id', post.id);
    } catch (e) {
      console.log('Like update error:', e);
    }
  };

  const handleAddComment = async (postId, parentId = null) => {
    const textToPost = parentId ? replyInputMap[parentId] : commentInputMap[postId];
    if (!textToPost || !textToPost.trim()) return;

    const newCommentObj = {
      post_id: postId,
      parent_id: parentId,
      user_id: session.user.id,
      user_name: currentUser?.full_name || 'You',
      avatar: currentUser?.avatar_url,
      comment: textToPost.trim()
    };

    setPostCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { ...newCommentObj, id: Date.now() }]
    }));

    if (parentId) {
      setReplyInputMap(prev => ({ ...prev, [parentId]: '' }));
      setActiveReplyCommentId(null);
    } else {
      setCommentInputMap(prev => ({ ...prev, [postId]: '' }));
    }

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
          
          const activeRefCode = referredBy || localStorage.getItem('lcf_referred_by');
          if (activeRefCode) {
            try {
              const { data: refUser, error: refLookupError } = await supabase
                .from('profiles')
                .select('id, lcf_points')
                .eq('username', activeRefCode)
                .single();

              if (refUser && !refLookupError) {
                const currentInviterPoints = Number(refUser.lcf_points) || 0;
                const newInviterPoints = currentInviterPoints + 80;

                await supabase
                  .from('profiles')
                  .update({ lcf_points: newInviterPoints })
                  .eq('id', refUser.id);
              }
            } catch (err) {
              console.log('Referral bonus credit error:', err);
            }
          }

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

    if ((!textToSend.trim() && !chatPhotoBase64 && !audioToSend) || !selectedChatUser) return;

    const msg = {
      sender_id: session.user.id,
      recipient_id: selectedChatUser.id,
      text: audioToSend ? '🎤 Voice note' : textToSend,
      image: chatPhotoBase64 || audioToSend
    };

    const tempMsg = { ...msg, id: Date.now().toString(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setChatPhotoBase64(null);
    setAudioBlobUrl(null);

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

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          setAudioBlobUrl(base64Audio);
          handleSendMessage(null, '🎤 Voice note', base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not supported on this browser.");
      console.log('Mic error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {referredBy ? `🎁 Invited by @${referredBy} (Earn +5 Points)` : 'Earn 5 Points Daily • Earn 80 Points per Friend'}
            </p>
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
                  {referredBy && (
                    <div style={{ fontSize: '11px', color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                      Referred by: <b>@{referredBy}</b>
                    </div>
                  )}
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
                {authMode === 'login' ? 'Sign In' : 'Create Account (+5 Free Bonus Points)'}
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
    <div style={{ backgroundColor: '#0b0f17', color: '#f8fafc', minHeight: '100vh', width: '100vw', maxWidth: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', paddingBottom: '90px', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
            LCF
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '700', display: 'block' }}>LCF Hub</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Lekxxy Chat Free</span>
          </div>
        </div>

        {/* LCF POINTS WALLET BADGE */}
        <div onClick={() => setActiveTab('wallet')} style={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '20px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <FiGift color="#eab308" size={14} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#eab308' }}>{lcfPoints} PTS</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>(₦{((lcfPoints / 2000) * 1000).toLocaleString()})</span>
        </div>

        <nav style={{ display: !isMobile ? 'flex' : 'none', gap: '4px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '24px', padding: '3px' }}>
          {[
            { id: 'home', label: 'Home', icon: <FiHome /> },
            { id: 'feed', label: 'Feed', icon: <FiMessageCircle /> },
            { id: 'reels', label: 'Reels', icon: <FiVideo /> },
            { id: 'chats', label: 'Chats', icon: <FiMessageSquare /> },
            { id: 'friends', label: 'Friends', icon: <FiUsers /> },
            { id: 'wallet', label: 'Wallet', icon: <FiGift /> },
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
            title="Download App"
          >
            <FiDownload size={14} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Install</span>
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
              <div style={{ position: 'absolute', right: 0, top: '40px', width: '280px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Notifications & Requests</span>
                  <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer' }}>Clear all</button>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {incomingRequests.map(req => (
                    <div key={req.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(37,99,235,0.1)' }}>
                      <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600', marginBottom: '6px' }}>
                        {req.sender?.full_name || 'A user'} sent you a friend request
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                          style={{ flex: 1, padding: '4px', backgroundColor: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'declined')}
                          style={{ flex: 1, padding: '4px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}

                  {notifications.map((n, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(30,41,59,0.5)', fontSize: '12px' }}>
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

      {/* MAIN CONTAINER */}
      <main style={{ width: '100vw', maxWidth: '800px', margin: '0 auto', padding: activeTab === 'reels' ? '0' : (isMobile ? '12px' : '20px'), boxSizing: 'border-box' }}>
        
        {/* HOME DASHBOARD TAB */}
        {activeTab === 'home' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Welcome back</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '2px 0 6px 0' }}>Hey, {currentUser?.full_name || 'lekkxygold'} 👋</h2>
              <p style={{ fontSize: '13px', color: '#60a5fa', margin: 0 }}>Connect. Chat. Earn LCF Rewards.</p>
            </div>

            {/* DAILY REWARD CLAIM BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', border: '1px solid #3b82f6', borderRadius: '16px', padding: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                  <FiGift /> Daily Login Reward
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
                  Claim your free <b>+5 LCF Points</b> every day just for logging in!
                </p>
              </div>
              <button
                onClick={handleClaimDailyBonus}
                style={{ padding: '10px 18px', backgroundColor: '#eab308', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiCheckCircle /> Claim 5 Points
              </button>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div onClick={() => setActiveTab('wallet')} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', cursor: 'pointer' }}>
                <div style={{ color: '#eab308', marginBottom: '10px' }}><FiGift size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>LCF Wallet</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{lcfPoints} PTS (₦{((lcfPoints / 2000) * 1000).toLocaleString()})</p>
              </div>

              <div onClick={handleCopyReferralLink} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', cursor: 'pointer' }}>
                <div style={{ color: '#3b82f6', marginBottom: '10px' }}><FiShare2 size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>Invite & Earn</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>+80 Points per invite</p>
              </div>

              <div onClick={() => setActiveTab('chats')} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', cursor: 'pointer' }}>
                <div style={{ color: '#3b82f6', marginBottom: '10px' }}><FiMessageSquare size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>Chats</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Real-time private messaging</p>
              </div>

              <div onClick={() => setActiveTab('friends')} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', cursor: 'pointer' }}>
                <div style={{ color: '#3b82f6', marginBottom: '10px' }}><FiUsers size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>Find Friends</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Search community directory</p>
              </div>
            </div>
          </div>
        )}

        {/* LCF WALLET & REWARDS TAB */}
        {activeTab === 'wallet' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>LCF Points Wallet</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Earn points daily and convert them into Naira payouts.</p>
            </div>

            {/* WALLET BALANCE CARD */}
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Total Earned Balance</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#eab308', marginBottom: '4px' }}>{lcfPoints} <span style={{ fontSize: '18px' }}>PTS</span></div>
              <div style={{ fontSize: '16px', color: '#22c55e', fontWeight: '600', marginBottom: '20px' }}>
                ≈ ₦{((lcfPoints / 2000) * 1000).toLocaleString()} Naira
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleClaimDailyBonus}
                  style={{ padding: '10px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiGift /> Claim Daily +5 PTS
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  style={{ padding: '10px 16px', backgroundColor: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiCreditCard /> Withdraw Payout
                </button>
              </div>
            </div>

            {/* EARNING RULES CARD */}
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px 0', color: '#60a5fa' }}>⚡ Points & Earnings Conversion Table</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                  <span>🎁 Daily Sign-In Bonus</span>
                  <span style={{ color: '#eab308', fontWeight: '700' }}>+5 Points / day</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                  <span>🤝 Friend Invitation Bonus</span>
                  <span style={{ color: '#eab308', fontWeight: '700' }}>+80 Points / invite</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                  <span>🔂 Conversion Rate</span>
                  <span style={{ color: '#22c55e', fontWeight: '700' }}>2,000 Points = ₦1,000 Naira</span>
                </div>
              </div>
            </div>

            {/* REFERRAL INVITE CARD */}
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 6px 0', color: '#fff' }}>Invite Friends & Earn +80 Points</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>Share your unique referral link to earn 80 LCF points for every new user who registers.</p>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?ref=${currentUser?.username || 'user'}`}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#94a3b8', fontSize: '11px', outline: 'none' }}
                />
                <button
                  onClick={handleCopyReferralLink}
                  style={{ padding: '10px 16px', backgroundColor: copiedLink ? '#22c55e' : '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedLink ? <FiCheck /> : <FiCopy />} {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div>
            <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: isMobile ? '0px' : '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
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
                  <img src={newPostImageBase64} alt="preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '12px' }} />
                  <button onClick={() => setNewPostImageBase64(null)} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}>
                    <FiX size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}>
                  <FiImage size={16} /> Photo
                  <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'newPostImageBase64')} style={{ display: 'none' }} />
                </label>

                <button onClick={handleCreatePost} style={{ padding: '8px 18px', backgroundColor: '#2563eb', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Post
                </button>
              </div>
            </div>

            {posts.map(post => {
              const comments = postCommentsMap[post.id] || [];
              const isCommentsOpen = openCommentsPostId === post.id;
              const parentComments = comments.filter(c => !c.parent_id);

              return (
                <div key={post.id} style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderBottom: '1px solid #1e293b', borderRadius: isMobile ? '0px' : '16px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <img src={post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {post.user_name}
                          {post.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified" />}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{post.username} • {formatTimeAgo(post.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#e2e8f0', margin: '0 0 12px 0' }}>{post.content}</p>

                  {post.image && (
                    <img src={post.image} alt="media" style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} />
                  )}

                  <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #1e293b', paddingTop: '12px', color: '#94a3b8', fontSize: '12px' }}>
                    <button onClick={() => handleToggleLike(post)} style={{ background: 'none', border: 'none', color: likedPosts[post.id] ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <FiHeart fill={likedPosts[post.id] ? '#ef4444' : 'none'} size={15} /> {post.likes || 0}
                    </button>
                    <button onClick={() => setOpenCommentsPostId(isCommentsOpen ? null : post.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <FiMessageCircle size={15} /> {comments.length}
                    </button>
                    <button onClick={() => handleSharePost(post)} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: 'auto' }}>
                      <FiShare2 size={15} /> Share
                    </button>
                  </div>

                  {isCommentsOpen && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', maxHeight: '250px', overflowY: 'auto' }}>
                        {parentComments.map(c => {
                          const replies = comments.filter(r => r.parent_id === c.id);
                          const isReplying = activeReplyCommentId === c.id;

                          return (
                            <div key={c.id} style={{ backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontWeight: '600', color: '#60a5fa' }}>{c.user_name}</span>
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{formatTimeAgo(c.created_at)}</span>
                              </div>
                              <div style={{ color: '#e2e8f0', marginBottom: '6px' }}>{c.comment}</div>

                              <button
                                onClick={() => setActiveReplyCommentId(isReplying ? null : c.id)}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <FiCornerDownRight size={11} /> Reply
                              </button>

                              {replies.length > 0 && (
                                <div style={{ marginTop: '8px', paddingLeft: '14px', borderLeft: '2px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {replies.map(rep => (
                                    <div key={rep.id} style={{ fontSize: '11px' }}>
                                      <span style={{ fontWeight: '600', color: '#38bdf8', marginRight: '6px' }}>{rep.user_name}:</span>
                                      <span style={{ color: '#cbd5e1' }}>{rep.comment}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isReplying && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                  <input
                                    type="text"
                                    placeholder={`Reply to ${c.user_name}...`}
                                    value={replyInputMap[c.id] || ''}
                                    onChange={(e) => setReplyInputMap({ ...replyInputMap, [c.id]: e.target.value })}
                                    style={{ flex: 1, padding: '8px 10px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
                                  />
                                  <button
                                    onClick={() => handleAddComment(post.id, c.id)}
                                    style={{ padding: '8px 12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {parentComments.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '10px' }}>No comments yet.</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputMap[post.id] || ''}
                          onChange={(e) => setCommentInputMap({ ...commentInputMap, [post.id]: e.target.value })}
                          style={{ flex: 1, padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                        />
                        <button onClick={() => handleAddComment(post.id)} style={{ padding: '10px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
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

        {/* REELS TAB (STRICT SINGLE-AUDIO & ACCESSIBLE COMMENTS & REPLIES) */}
        {activeTab === 'reels' && (
          <div style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 60px)', backgroundColor: '#000', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50 }}>
              <button onClick={() => setIsCreatingReel(true)} style={{ padding: '8px 16px', backgroundColor: 'rgba(37,99,235,0.85)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiPlus /> Upload Reel
              </button>
            </div>

            {isCreatingReel && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Upload Short Reel</h3>
                  <input
                    type="text"
                    placeholder="Caption / description..."
                    value={newReelTitle}
                    onChange={(e) => setNewReelTitle(e.target.value)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', marginBottom: '12px', boxSizing: 'border-box' }}
                  />

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      <FiVideo size={16} /> Choose Video or Photo
                      <input type="file" accept="video/*,image/*" onChange={(e) => handleDeviceFileUpload(e, 'newReelMediaBase64')} style={{ display: 'none' }} />
                    </label>
                    {newReelMediaBase64 && <div style={{ marginTop: '6px', fontSize: '11px', color: '#22c55e' }}>Media attached!</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePublishReel} style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Publish</button>
                    <button onClick={() => setIsCreatingReel(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollTop = container.scrollTop;
                const height = container.clientHeight;
                const index = Math.round(scrollTop / height);
                if (reels[index] && reels[index].id !== activeReelId) {
                  setActiveReelId(reels[index].id);
                }
              }}
              style={{ height: '100%', width: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
            >
              {reels.map(reel => {
                const isMyReel = reel.user_id === session?.user?.id;
                const isLiked = likedReelsMap[reel.id];
                const likesCount = reel.likes || (isLiked ? 1 : 0);
                const isCurrentActive = activeReelId === reel.id;
                const isMuted = mutedReelsMap[reel.id] ?? !isCurrentActive;
                const comments = reelCommentsMap[reel.id] || [];
                const parentReelComments = comments.filter(c => !c.parent_id);
                const isCommentsOpen = openReelCommentsId === reel.id;

                return (
                  <div key={reel.id} style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                    {reel.isvideo ? (
                      <video
                        src={reel.url}
                        controls={false}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        loop
                        onPlay={() => setActiveReelId(reel.id)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img src={reel.url} alt="reel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}

                    {/* SOUND MUTE / UNMUTE TOGGLE BUTTON */}
                    {reel.isvideo && (
                      <button onClick={() => handleToggleReelSound(reel.id)} style={{ position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 40 }}>
                        {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                      </button>
                    )}

                    {/* RIGHT TIKTOK ACTION SIDEBAR */}
                    <div style={{ position: 'absolute', right: 16, bottom: 90, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', zIndex: 40 }}>
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <img src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="creator" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }} />
                      </div>

                      {/* LIKE BUTTON */}
                      <button onClick={() => handleToggleReelLike(reel)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: isLiked ? '#ef4444' : '#fff', cursor: 'pointer' }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '50%' }}>
                          <FiHeart size={26} fill={isLiked ? '#ef4444' : 'none'} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          {likesCount}
                        </span>
                      </button>

                      {/* COMMENTS BUTTON */}
                      <button onClick={() => setOpenReelCommentsId(isCommentsOpen ? null : reel.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '50%' }}>
                          <FiMessageCircle size={26} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          {comments.length}
                        </span>
                      </button>

                      {/* SHARE BUTTON */}
                      <button onClick={() => handleSharePost({ content: reel.title })} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '50%' }}>
                          <FiShare2 size={26} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          Share
                        </span>
                      </button>

                      {isMyReel && (
                        <button onClick={() => handleDeleteReel(reel.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ef4444', cursor: 'pointer' }}>
                          <div style={{ backgroundColor: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(10px)', padding: '10px', borderRadius: '50%' }}>
                            <FiTrash2 size={20} />
                          </div>
                        </button>
                      )}
                    </div>

                    {/* BOTTOM TEXT CAPTION */}
                    <div style={{ position: 'absolute', bottom: 80, left: 16, right: 80, zIndex: 40, pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>@{reel.user}</div>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: '1.4' }}>{reel.title}</div>
                    </div>

                    {/* REEL COMMENTS MODAL & REPLIES DRAWER */}
                    {isCommentsOpen && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', backgroundColor: '#151c2c', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '16px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '12px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#fff' }}>Comments ({comments.length})</h4>
                          <button onClick={() => setOpenReelCommentsId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                          {parentReelComments.map(c => {
                            const replies = comments.filter(r => r.parent_id === c.id);
                            const isReplying = activeReelReplyId === c.id;

                            return (
                              <div key={c.id} style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>
                                <div style={{ fontWeight: '600', color: '#60a5fa', marginBottom: '2px' }}>{c.user_name}</div>
                                <div style={{ color: '#e2e8f0', marginBottom: '6px' }}>{c.comment}</div>

                                <button
                                  onClick={() => setActiveReelReplyId(isReplying ? null : c.id)}
                                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FiCornerDownRight size={11} /> Reply
                                </button>

                                {replies.length > 0 && (
                                  <div style={{ marginTop: '6px', paddingLeft: '12px', borderLeft: '2px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {replies.map(rep => (
                                      <div key={rep.id} style={{ fontSize: '11px' }}>
                                        <span style={{ fontWeight: '600', color: '#38bdf8', marginRight: '6px' }}>{rep.user_name}:</span>
                                        <span style={{ color: '#cbd5e1' }}>{rep.comment}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isReplying && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                    <input
                                      type="text"
                                      placeholder={`Reply to ${c.user_name}...`}
                                      value={reelReplyInput}
                                      onChange={(e) => setReelReplyInput(e.target.value)}
                                      style={{ flex: 1, padding: '8px 10px', backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
                                    />
                                    <button
                                      onClick={() => handleAddReelComment(reel.id, c.id)}
                                      style={{ padding: '8px 12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                      Send
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {parentReelComments.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '12px' }}>No comments yet. Be the first to comment!</div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={reelCommentInput}
                            onChange={(e) => setReelCommentInput(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                          />
                          <button onClick={() => handleAddReelComment(reel.id)} style={{ padding: '10px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <div style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderRadius: isMobile ? '0px' : '16px', height: isMobile ? 'calc(100vh - 130px)' : '580px', display: 'grid', gridTemplateColumns: isMobile && selectedChatUser ? '1fr' : (isMobile ? '1fr' : '280px 1fr'), overflow: 'hidden', position: 'relative' }}>
            <div style={{ borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '12px', display: isMobile && selectedChatUser ? 'none' : 'block', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Chats</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Private conversations</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dbUsers.filter(u => u.id !== session?.user?.id).map(user => {
                  const unreadCount = unreadCounts[user.id] || 0;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedChatUser(user)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', borderRadius: '10px', backgroundColor: selectedChatUser?.id === user.id ? '#1e293b' : 'transparent', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</span>
                            {user.verified && <FiCheckCircle size={11} color="#3b82f6" />}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{user.username}</div>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></span>
                          <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                            {unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: isMobile && !selectedChatUser ? 'none' : 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#151c2c', position: 'relative', overflow: 'hidden' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#151c2c', zIndex: 10, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isMobile && (
                        <button onClick={() => setSelectedChatUser(null)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer', marginRight: '4px' }}>Back</button>
                      )}
                      <img src={selectedChatUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {selectedChatUser.full_name}
                          {selectedChatUser.verified && <FiCheckCircle size={11} color="#3b82f6" />}
                        </div>
                        <div style={{ fontSize: '10px' }}>{getUserStatusText(selectedChatUser.last_seen)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '70px' }}>
                    {messages.map(m => {
                      const isMe = m.sender_id === session.user.id;
                      const isVoice = m.text?.startsWith('🎤') || (m.image && m.image.startsWith('data:audio'));
                      return (
                        <div
                          key={m.id}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (isMe) handleDeleteMessage(m.id);
                          }}
                          onDoubleClick={() => {
                            if (isMe) handleDeleteMessage(m.id);
                          }}
                          title="Long press or double tap to delete"
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            backgroundColor: isMe ? '#2563eb' : '#1e293b',
                            color: '#fff',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            maxWidth: '75%',
                            position: 'relative',
                            cursor: isMe ? 'pointer' : 'default'
                          }}
                        >
                          {isVoice ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <FiMic size={14} /> <span>Voice note</span>
                              </div>
                              <audio controls src={m.image || audioBlobUrl} style={{ width: '200px', height: '32px' }} />
                            </div>
                          ) : (
                            m.text && <div>{m.text}</div>
                          )}
                          {m.image && !isVoice && <img src={m.image} alt="shared" style={{ width: '100%', borderRadius: '8px', marginTop: '6px', maxHeight: '180px', objectFit: 'cover' }} />}
                          
                          {isMe && (
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: '2px' }}>
                              Hold to delete
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {chatPhotoBase64 && (
                    <div style={{ padding: '8px 14px', borderTop: '1px solid #1e293b', position: 'absolute', bottom: '60px', left: 0, right: 0, backgroundColor: '#151c2c', zIndex: 11 }}>
                      <img src={chatPhotoBase64} alt="attachment" style={{ height: '60px', borderRadius: '6px' }} />
                      <button onClick={() => setChatPhotoBase64(null)} style={{ position: 'absolute', top: 4, left: 70, backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}>
                        <FiX size={12} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 18px', backgroundColor: '#151c2c', borderTop: '1px solid #1e293b', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 12, flexShrink: 0 }}>
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

                    {isRecording ? (
                      <button type="button" onClick={stopRecording} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1s infinite' }} title="Stop & Send Voice Note">
                        <FiSquare size={14} />
                      </button>
                    ) : (
                      <button type="button" onClick={startRecording} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Record Voice Note">
                        <FiMic size={18} />
                      </button>
                    )}

                    <input
                      type="text"
                      placeholder={isRecording ? "Recording voice note..." : "Type a message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isRecording}
                      style={{ flex: 1, padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                      <FiSend />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px' }}>
                  Select a private conversation to start chatting.
                </div>
              )}
            </div>
          </div>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'friends' && (
          <div style={{ padding: '0 4px' }}>
            {incomingRequests.length > 0 && (
              <div style={{ backgroundColor: '#151c2c', border: '1px solid #2563eb', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 14px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUserPlus /> Incoming Friend Requests ({incomingRequests.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {incomingRequests.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={req.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{req.sender?.full_name || 'Member'}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{req.sender?.username}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                          style={{ padding: '6px 14px', backgroundColor: '#22c55e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.id, 'declined')}
                          style={{ padding: '6px 14px', backgroundColor: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>Find Friends & Members</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Search registered members in the live database.</p>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <FiSearch style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8', fontSize: '14px' }} />
              <input
                type="text"
                placeholder="Search username or name..."
                value={userSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserSearchQuery(val);
                  fetchAllRegisteredUsers(val);
                }}
                style={{ width: '100%', padding: '12px 12px 12px 40px', backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {dbUsers.map(user => {
                const reqStatus = sentRequestMap[user.id];
                const isSelf = user.id === session?.user?.id;
                return (
                  <div key={user.id} style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="u" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />

                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                      {user.full_name}
                      {user.verified && <FiCheckCircle size={13} color="#3b82f6" title="Verified Account" />}
                    </div>
                    <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px' }}>@{user.username}</div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 16px 0', flex: 1 }}>{user.bio || 'LCF Member'}</p>

                    {!isSelf && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                          disabled={reqStatus === 'pending' || reqStatus === 'accepted'}
                          onClick={() => handleSendFriendRequest(user)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            backgroundColor: reqStatus === 'accepted' ? '#22c55e' : (reqStatus === 'pending' ? '#1e293b' : '#2563eb'),
                            border: 'none',
                            borderRadius: '8px',
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
                          style={{ padding: '8px 12px', backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
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

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: '#151c2c', border: isMobile ? 'none' : '1px solid #1e293b', borderRadius: isMobile ? '0px' : '16px', overflow: 'hidden' }}>
            <div style={{ height: '140px', backgroundImage: `url(${currentUser?.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
              <label style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCamera /> Change Cover Photo
                <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'cover_url')} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ padding: '0 20px 24px', position: 'relative', marginTop: '-45px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={currentUser?.avatar_url} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #151c2c', objectFit: 'cover' }} />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#fff' }}>
                    <FiCamera size={12} />
                    <input type="file" accept="image/*" onChange={(e) => handleDeviceFileUpload(e, 'avatar_url')} style={{ display: 'none' }} />
                  </label>
                </div>

                <button onClick={() => setIsEditingProfile(true)} style={{ padding: '8px 16px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <FiEdit3 /> Edit
                </button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentUser?.full_name}
                {currentUser?.verified && <FiCheckCircle size={16} color="#3b82f6" title="Verified" />}
              </h2>
              <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '10px' }}>@{currentUser?.username}</div>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                <div><b style={{ color: '#eab308' }}>{lcfPoints}</b> LCF Points</div>
                <div><b style={{ color: '#fff' }}>{friendCount}</b> Friends</div>
              </div>

              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 18px 0' }}>{currentUser?.bio}</p>

              <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Email: <span style={{ color: '#fff' }}>{currentUser?.email}</span></div>
                <div>User ID: <span style={{ color: '#fff', fontSize: '10px' }}>{currentUser?.id}</span></div>
                <div>Referral Code: <span style={{ color: '#60a5fa' }}>{currentUser?.username}</span></div>
              </div>
            </div>

            {isEditingProfile && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Edit Profile</h3>
                    <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
                  </div>

                  <form onSubmit={handleSaveProfileChanges} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bio</label>
                      <textarea rows={2} value={editBio} onChange={(e) => setEditBio(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box', resize: 'none' }} />
                    </div>
                    <button type="submit" disabled={savingProfile} style={{ marginTop: '10px', padding: '12px', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FiSave /> {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PAYOUT WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Request Naira Payout</h3>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FiX size={18} /></button>
            </div>

            <form onSubmit={handleRequestWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Points to Withdraw (Min 2,000 PTS)</label>
                <input
                  type="number"
                  min={2000}
                  step={100}
                  value={withdrawAmountPoints}
                  onChange={(e) => setWithdrawAmountPoints(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#22c55e', backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                You will receive: <b>₦{((withdrawAmountPoints / 2000) * 1000).toLocaleString()} Naira</b>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Payout Account (OPay Number or Bank Details)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OPay 08123456789 or Access Bank 0123456789"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" style={{ marginTop: '8px', padding: '12px', backgroundColor: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Submit Payout Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PWA INSTALL MODAL */}
      {showInstallModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#151c2c', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Install LCF App</h3>
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
          { id: 'home', label: 'Home', icon: <FiHome size={18} /> },
          { id: 'feed', label: 'Feed', icon: <FiMessageCircle size={18} /> },
          { id: 'reels', label: 'Reels', icon: <FiVideo size={18} /> },
          { id: 'chats', label: 'Chats', icon: <FiMessageSquare size={18} /> },
          { id: 'friends', label: 'Friends', icon: <FiUsers size={18} /> },
          { id: 'wallet', label: 'Wallet', icon: <FiGift size={18} /> },
          { id: 'profile', label: 'Profile', icon: <FiUser size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ background: 'none', border: 'none', color: activeTab === tab.id ? '#3b82f6' : '#94a3b8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '9px' }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

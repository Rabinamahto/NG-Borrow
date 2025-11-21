import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { FiSend, FiUser, FiMoreVertical } from 'react-icons/fi';
import { BsEmojiSmile } from 'react-icons/bs';
import { getSnippet, formatRelativeTime } from '../utils/chatHelpers';

const WhatsAppChat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  // helper: parse different timestamp shapes to ms since epoch
  const parseTimeToMs = (t) => {
    if (!t) return 0;
    try {
      if (typeof t === 'number') return t;
      if (typeof t === 'string') {
        const p = Date.parse(t);
        return isNaN(p) ? 0 : p;
      }
      if (t.seconds) return t.seconds * 1000;
      if (t instanceof Date) return t.getTime();
      return Number(t) || 0;
    } catch (e) {
      return 0;
    }
  };

  const sortByLastMessage = (list) => {
    const arr = Array.isArray(list) ? list.slice() : [];
    arr.sort((a, b) => {
      const aTime = parseTimeToMs(a.lastMessageTime || a.lastMessageAt || (a.lastMessage && a.lastMessage.timestamp) || 0);
      const bTime = parseTimeToMs(b.lastMessageTime || b.lastMessageAt || (b.lastMessage && b.lastMessage.timestamp) || 0);
      return bTime - aTime;
    });
    return arr;
  };
  const notificationsRef = useRef(new Set());
  const [toasts, setToasts] = useState([]);
  const [sending, setSending] = useState(false);
  // debugInfo removed for production: on-screen debug panel was removed
  
  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return (
      user.name ||
      user.otherUserName ||
      user.withUserName ||
      user.borrowerName ||
      user.itemOwnerName ||
      user.receiverName ||
      user.senderName ||
      user.email ||
      user.otherUserEmail ||
      'Unknown User'
    );
  };
  const currentUser = auth?.currentUser;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  // Mobile view state
  const [showChatList, setShowChatList] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Load approved users for chat
  useEffect(() => {
    console.log('🔄 Component mounted, loading chat users...');
    loadChatUsers();
  }, [currentUser]);

  // Force load on component mount
  useEffect(() => {
    console.log('🚀 Force loading chat users on mount...');
    setTimeout(() => {
      loadChatUsers();
    }, 100);
  }, []);

  // Also reload chat users when component mounts or when returning to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, reloading chat users...');
        loadChatUsers();
      }
    };

    const handleFocus = () => {
      console.log('Window focused, reloading chat users...');
      loadChatUsers();
    };

    // Also listen for storage changes (if user opens multiple tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'borrowRequests' || e.key === 'chatUsers') {
        console.log('Storage changed, reloading chat users...');
        loadChatUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    // Initial load on mount
    setTimeout(() => {
      console.log('Component mounted, loading chat users...');
      loadChatUsers();
    }, 100);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // If a chat is opened but that user is not yet in the list, add them so left column shows the active chat
  useEffect(() => {
    try {
      if (!selectedUser) return;
      const selId = selectedUser?.id || selectedUser?.uid || selectedUser?.userId || selectedUser?.otherUserId || selectedUser?.borrowerId || selectedUser?.itemOwnerId || (typeof selectedUser === 'string' ? selectedUser : null);
      if (!selId) return;
      const selName = getDisplayName(selectedUser);
      const normalized = { id: selId, name: selName, ...selectedUser };

      setChatUsers(prev => {
        const list = Array.isArray(prev) ? prev.slice() : [];
        if (list.find(u => u.id === selId)) return list;
        const next = [normalized, ...list];
        try { localStorage.setItem('chatUsers', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch (err) {
      console.warn('Failed to ensure selected user in chatUsers', err);
    }
  }, [selectedUser]);

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Listen to current user's chat meta so left list stays synced and we can show notifications
  useEffect(() => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const userChatsCol = collection(db, 'users', uid, 'chats');
      const q = query(userChatsCol, orderBy('lastUpdated', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const updated = [];
        snapshot.forEach(snap => updated.push({ id: snap.id, ...snap.data() }));

        setChatUsers(prev => {
          const map = new Map();
          updated.forEach(c => map.set(c.id, c));
          (prev || []).forEach(p => { if (!map.has(p.id)) map.set(p.id, p); });
          return Array.from(map.values());
        });

        // notify for new lastMessage entries
        snapshot.docChanges().forEach(change => {
          const data = change.doc.data() || {};
          const last = data.lastMessage;
          if (!last || !last.id) return;
          if (notificationsRef.current.has(last.id)) return;
          if (last.senderId === uid) return; // don't notify own messages
          notificationsRef.current.add(last.id);

          const title = (data.otherUser && (data.otherUser.name || data.otherUser.displayName)) || data.otherName || 'New message';
          const body = (last.text || '').slice(0, 120);

          if ("Notification" in window && Notification.permission === 'granted') {
            try { new Notification(title, { body }); } catch (e) { /* ignore */ }
          }
          setToasts(prev => [...prev.slice(-3), { id: last.id, title, body }]);
        });
      });
      return () => unsub();
    } catch (e) {
      console.error('chat meta listener error', e);
    }
  }, [currentUser]);

    // Handle URL parameters for direct user selection
  useEffect(() => {
    const userId = searchParams.get('user');
    const userName = searchParams.get('name');
    const itemName = searchParams.get('item');
    
    if (userId && userName) {
      // Find user in chat list or create one
      let targetUser = chatUsers.find(user => user.id === userId);
      
      if (!targetUser) {
        // Create user object if not found and add to chatUsers list
        targetUser = {
          id: userId,
          name: decodeURIComponent(userName),
          email: '',
          phone: '',
          itemName: itemName ? decodeURIComponent(itemName) : 'Chat Item',
          itemImage: null,
          itemCategory: '',
          borrowRequestId: `direct_${Date.now()}`,
          lastSeen: 'Online',
          avatar: userName.charAt(0).toUpperCase()
        };
        
        // Add to chatUsers if not already there
        setChatUsers(prevUsers => {
          const exists = prevUsers.find(u => u.id === userId);
          if (!exists) {
            return [...prevUsers, targetUser];
          }
          return prevUsers;
        });
      }
      
      handleUserSelect(targetUser);
      // Clear URL params after selecting user
      navigate('/chat', { replace: true });
    }
  }, [searchParams, chatUsers, navigate]);

  // Listen to messages for selected user
  useEffect(() => {
    // Subscribe to messages using the stable currentChatId. This avoids races
    // where selectedUser changes but a watcher for the old chat is still active.
    if (!currentChatId || !currentUser) return;

    const chatId = currentChatId;
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = [];
      snapshot.forEach(doc => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList);
      // Update chatUsers entry for this selectedUser so the left list shows the latest
      try {
        const last = messageList[messageList.length - 1];
        if (last && selectedUser) {
          const lastText = last.text || last.message || '';
          let lastTime = last.timestamp || last.createdAt || new Date().toISOString();
          // Normalize Firestore Timestamp if present
          if (lastTime && lastTime.seconds) {
            lastTime = new Date(lastTime.seconds * 1000).toISOString();
          }
          setChatUsers(prev => {
            const list = Array.isArray(prev) ? prev.slice() : [];
            // remove any existing entry for this user
            const others = list.filter(u => u.id !== selectedUser.id);
            const me = list.find(u => u.id === selectedUser.id) || selectedUser;
            const updated = { ...me, id: selectedUser.id, lastMessage: lastText, lastMessageTime: lastTime };
            let next = [updated, ...others];
            next = sortByLastMessage(next);
            try { localStorage.setItem('chatUsers', JSON.stringify(next)); } catch (e) {}
            return next;
          });
        }
      } catch (e) { /* ignore */ }

      scrollToBottom();
    }, (error) => {
      console.log('Loading messages from localStorage fallback');
      loadMessagesFromLocalStorage();
    });

    return () => unsubscribe();
  }, [currentChatId, currentUser]);

  const loadChatUsers = () => {
    try {
      console.log('🔄 Starting loadChatUsers function...');
      // Use actual current user if logged in, otherwise fallback to demo-user
      const currentUserId = currentUser?.uid || currentUser?.email || 'demo-user';
      console.log('👤 Current user ID:', currentUserId);
      console.log('👤 Current user object:', currentUser);
      
      // Load from localStorage borrowRequests (our main data source)
      const borrowRequestsJSON = localStorage.getItem('borrowRequests');
      const borrowRequests = borrowRequestsJSON ? JSON.parse(borrowRequestsJSON) : [];
      console.log('📋 Raw borrow requests JSON:', borrowRequestsJSON);
      console.log('📋 Parsed borrow requests:', borrowRequests);
      
      // Load existing chat users from localStorage to maintain history
      const existingChatsJSON = localStorage.getItem('chatUsers');
      const existingChats = existingChatsJSON ? JSON.parse(existingChatsJSON) : [];
      console.log('💬 Existing chat users:', existingChats);
      
      // Also check for any chat conversations that exist in localStorage
      const allChatConversations = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_') && key.includes(currentUserId)) {
          const messages = JSON.parse(localStorage.getItem(key) || '[]');
          if (messages.length > 0) {
            allChatConversations.push({ chatKey: key, messages });
          }
        }
      }
      
      console.log('💬 Found chat conversations:', allChatConversations);
      
      const approvedRequests = borrowRequests.filter(request => 
        request.status === 'approved'
      );
      console.log('✅ Approved requests found:', approvedRequests.length, approvedRequests);

      const uniqueUsers = new Map();

      // First add existing chat users to maintain history
      console.log('📤 Adding existing chat users:', existingChats.length);
      existingChats.forEach(user => {
        console.log('➕ Adding existing user:', user.name);
        uniqueUsers.set(user.id, {
          ...user,
          lastMessage: '', // Will be updated from actual messages
          lastMessageTime: null
        });
      });

      // Add users from chat conversations that exist but might not be in chatUsers
      allChatConversations.forEach(({ chatKey, messages }) => {
        const lastMessage = messages[messages.length - 1];
        const otherUserId = chatKey.replace('chat_', '').split('_').find(id => id !== currentUserId);
        
        if (otherUserId && !uniqueUsers.has(otherUserId)) {
          // Try to find user info from messages
          const userMessage = messages.find(msg => msg.senderId === otherUserId || msg.receiverId === otherUserId);
          if (userMessage) {
            const isOwner = userMessage.senderId === otherUserId;
            const userName = isOwner ? userMessage.senderName : userMessage.receiverName;
            
            uniqueUsers.set(otherUserId, {
              id: otherUserId,
              name: userName || 'Chat User',
              email: '',
              phone: '',
              itemName: userMessage.itemName || 'Previous Chat',
              itemImage: null,
              itemCategory: 'Previous Conversation',
              lastSeen: 'Online',
              avatar: userName?.charAt(0)?.toUpperCase() || 'U',
              role: 'chat-user',
              items: [userMessage.itemName || 'Chat'],
              lastMessage: lastMessage.text,
              lastMessageTime: lastMessage.timestamp
            });
          }
        } else if (otherUserId && uniqueUsers.has(otherUserId)) {
          // Update last message info
          const user = uniqueUsers.get(otherUserId);
          user.lastMessage = lastMessage.text;
          user.lastMessageTime = lastMessage.timestamp;
        }
      });

      // Then add users from approved requests
      console.log('📝 Processing approved requests for user:', currentUserId);
      approvedRequests.forEach((request, index) => {
        console.log(`🔍 Processing request ${index + 1}:`, {
          borrowerId: request.borrowerId,
          itemOwnerId: request.itemOwnerId,
          itemTitle: request.itemTitle,
          status: request.status
        });

        // For borrower: add item owner to chat list
        if (request.borrowerId === currentUserId && request.itemOwnerId) {
          console.log('👤 Current user is borrower, adding owner:', request.itemOwnerName);
          if (!uniqueUsers.has(request.itemOwnerId)) {
            console.log('➕ Creating new owner user:', request.itemOwnerName);
            uniqueUsers.set(request.itemOwnerId, {
              id: request.itemOwnerId,
              name: request.itemOwnerName || 'Item Owner',
              email: request.itemOwnerEmail || '',
              phone: request.itemOwnerPhone || '',
              itemName: request.itemTitle || 'Unknown Item',
              itemImage: request.itemImage || null,
              itemCategory: request.itemCategory || '',
              borrowRequestId: request.borrowRequestId,
              lastSeen: 'Online',
              avatar: request.itemOwnerName?.charAt(0)?.toUpperCase() || 'O',
              role: 'owner',
              items: [request.itemTitle],
              lastMessage: '',
              lastMessageTime: null
            });
          } else {
            console.log('📝 Adding item to existing owner user:', request.itemTitle);
            // Add item to existing user's items list
            const existingUser = uniqueUsers.get(request.itemOwnerId);
            if (!existingUser.items) existingUser.items = [];
            if (!existingUser.items.includes(request.itemTitle)) {
              existingUser.items.push(request.itemTitle);
            }
          }
        }
        
        // For owner: add borrower to chat list
        if (request.itemOwnerId === currentUserId && request.borrowerId) {
          console.log('👤 Current user is owner, adding borrower:', request.borrowerName);
          if (!uniqueUsers.has(request.borrowerId)) {
            console.log('➕ Creating new borrower user:', request.borrowerName);
            uniqueUsers.set(request.borrowerId, {
              id: request.borrowerId,
              name: request.borrowerName || 'Borrower',
              email: request.borrowerEmail || '',
              phone: request.borrowerPhone || '',
              itemName: request.itemTitle || 'Unknown Item',
              itemImage: request.itemImage || null,
              itemCategory: request.itemCategory || '',
              borrowRequestId: request.borrowRequestId,
              lastSeen: 'Online',
              avatar: request.borrowerName?.charAt(0)?.toUpperCase() || 'B',
              role: 'borrower',
              items: [request.itemTitle],
              lastMessage: '',
              lastMessageTime: null
            });
          } else {
            console.log('📝 Adding item to existing borrower user:', request.itemTitle);
            // Add item to existing user's items list
            const existingUser = uniqueUsers.get(request.borrowerId);
            if (!existingUser.items) existingUser.items = [];
            if (!existingUser.items.includes(request.itemTitle)) {
              existingUser.items.push(request.itemTitle);
            }
          }
        }
      });

      // Sort users by last message time (most recent first)
      const users = Array.from(uniqueUsers.values()).sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
        return bTime - aTime;
      });
      
      console.log('✅ Final chat users (sorted by recent activity):', users);
      console.log('📊 Users count:', users.length);
      
      // Save to localStorage to maintain across refreshes
      localStorage.setItem('chatUsers', JSON.stringify(users));
      
      setChatUsers(users);
      setLoading(false);
      
      console.log('✅ Chat users state updated, loading set to false');
      
      // Auto-select first user if no URL params and no current selection
      if (users.length > 0 && !selectedUser && !searchParams.get('user')) {
        console.log('🎯 Auto-selecting first user:', users[0].name);
        // On desktop, auto-select first user. On mobile, let user choose
        if (!isMobile) {
          setSelectedUser(users[0]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading chat users:', error);
      setLoading(false);
    }
  };

  const loadMessagesFromLocalStorage = () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      const chatId = [currentUser.uid, selectedUser.id].sort().join('_');
      const chatKey = 'chat_' + chatId;
      const messagesJSON = localStorage.getItem(chatKey);
      const chatMessages = messagesJSON ? JSON.parse(messagesJSON) : [];
      setMessages(chatMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    // Robust scroll: prefer setting container.scrollTop directly to avoid
    // layout-jump behavior from flex reflows. Also fallback to scrollIntoView.
    setTimeout(() => {
      try {
        const container = messagesContainerRef.current;
        if (container) {
          // jump to bottom immediately to avoid upward flicker
          container.scrollTop = container.scrollHeight;
          return;
        }
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: 'end' });
      } catch (e) {
        try { messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: 'end' }); } catch (_) {}
      }
    }, 80);
  };

  // Ensure we scroll to bottom whenever messages change (new message) or when a
  // user is selected. The small timeout lets layout stabilize (images, fonts).
  useEffect(() => {
    if (!messages) return;
    if (messages.length === 0) {
      // keep empty state centered, but still ensure input is visible
      scrollToBottom();
      return;
    }
    scrollToBottom();
  }, [messages.length]);

  // Also try after selecting a user to avoid initial jump caused by sidebar changes
  useEffect(() => {
    if (!selectedUser) return;
    // allow layout to settle
    const t = setTimeout(() => scrollToBottom(), 120);
    return () => clearTimeout(t);
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;
    if (sending) {
      console.log('sendMessage called but already sending');
      return;
    }
    setSending(true);

    const messageData = {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email || 'You',
      receiverId: selectedUser.id,
      receiverName: selectedUser.name,
      itemId: selectedUser.itemId || null,
      itemName: selectedUser.itemName || null,
      createdAt: new Date(),
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
    console.log('sendMessage -> start', { to: selectedUser && selectedUser.id, text: newMessage.trim() });
      // Try to save to Firestore
      const chatId = currentChatId || [currentUser.uid, selectedUser.id].sort().join('_');
      const docRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        ...messageData,
        createdAt: serverTimestamp()
      });
    console.log('sendMessage -> addDoc succeeded', docRef.id);

      // update chat meta for both participants so left-list stays current and notifications work
      try {
        const lastMsgMeta = { id: docRef.id, text: messageData.text, senderId: messageData.senderId, timestamp: serverTimestamp() };
        const meta = {
          lastMessage: lastMsgMeta,
          lastUpdated: serverTimestamp(),
          otherUser: { uid: selectedUser.id, name: selectedUser.name || selectedUser.itemOwnerName || selectedUser.borrowerName }
        };

        await setDoc(doc(db, 'users', currentUser.uid, 'chats', chatId), meta, { merge: true });
        await setDoc(doc(db, 'users', selectedUser.id, 'chats', chatId), meta, { merge: true });
        // increment recipient unread count
        try {
          await updateDoc(doc(db, 'users', selectedUser.id, 'chats', chatId), { unreadCount: increment(1) });
        } catch (e) {
          // ignore if update fails
        }
        // Also update local chatUsers state so UI reorders immediately
        try {
          const now = new Date().toISOString();
          setChatUsers(prev => {
            const list = Array.isArray(prev) ? prev.slice() : [];
            const others = list.filter(u => u.id !== selectedUser.id);
            const me = list.find(u => u.id === selectedUser.id) || selectedUser;
            const updated = { ...me, id: selectedUser.id, lastMessage: messageData.text, lastMessageTime: now };
            let next = [updated, ...others];
            next = sortByLastMessage(next);
            try { localStorage.setItem('chatUsers', JSON.stringify(next)); } catch (e) {}
            return next;
          });
        } catch (e) { /* ignore */ }
      } catch (metaErr) {
        console.warn('Failed to update chat meta for users', metaErr);
      }
    } catch (error) {
      console.log('Firestore not available, saving to localStorage', error);
      
      // Fallback to localStorage
      const chatId = [currentUser.uid, selectedUser.id].sort().join('_');
      const chatKey = 'chat_' + chatId;
      const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
      const newMessageWithId = { ...messageData, id: Date.now().toString() };
      existingMessages.push(newMessageWithId);
      localStorage.setItem(chatKey, JSON.stringify(existingMessages));
      
      // Update local state
      setMessages(existingMessages);
      scrollToBottom();
      
      // Update chat users with last message info
      const updatedChatUsers = chatUsers.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            lastMessage: messageData.text,
            lastMessageTime: messageData.timestamp
          };
        }
        return user;
      });
  // Move updated user to top and sort by last message time
  const others = updatedChatUsers.filter(u => u.id !== selectedUser.id);
  const updatedUser = updatedChatUsers.find(u => u.id === selectedUser.id) || { id: selectedUser.id, name: selectedUser.name, lastMessage: messageData.text, lastMessageTime: messageData.timestamp };
  let reordered = [updatedUser, ...others];
  reordered = sortByLastMessage(reordered);
  setChatUsers(reordered);
  localStorage.setItem('chatUsers', JSON.stringify(reordered));
      
      // Send notification to other user (store in their notifications)
      try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const notification = {
          id: `chat_${Date.now()}`,
          title: `New message from ${messageData.senderName}`,
          message: messageData.text.substring(0, 50) + (messageData.text.length > 50 ? '...' : ''),
          type: 'chat',
          isNew: true,
          time: 'Just now',
          timestamp: new Date().toISOString(),
          fromUserId: currentUser.uid,
          toUserId: selectedUser.id,
          chatId: chatId,
          itemName: selectedUser.itemName
        };
        notifications.unshift(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
      } catch (error) {
        console.log('Failed to send notification:', error);
      }
    }

    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Context Menu Functions
  const handleRightClick = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: message.id || message.timestamp
    });
    setSelectedMessage(message);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const copyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.text);
    }
    closeContextMenu();
  };

  const deleteForMe = () => {
    if (!selectedMessage) return;
    
    const messageId = selectedMessage.id || selectedMessage.timestamp;
    const chatId = [currentUser.uid, selectedUser.id].sort().join('_');
    const chatKey = 'chat_' + chatId;
    
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMessages = existingMessages.map(msg => {
      if ((msg.id || msg.timestamp) === messageId) {
        return { ...msg, deletedForMe: true };
      }
      return msg;
    });
    
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    closeContextMenu();
  };

  const deleteForEveryone = () => {
    if (!selectedMessage || selectedMessage.senderId !== currentUser.uid) return;
    
    const messageId = selectedMessage.id || selectedMessage.timestamp;
    const chatId = [currentUser.uid, selectedUser.id].sort().join('_');
    const chatKey = 'chat_' + chatId;
    
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMessages = existingMessages.map(msg => {
      if ((msg.id || msg.timestamp) === messageId) {
        return { ...msg, deletedForEveryone: true, text: 'This message was deleted' };
      }
      return msg;
    });
    
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    closeContextMenu();
  };

  const startEditing = () => {
    if (!selectedMessage || selectedMessage.senderId !== currentUser.uid) return;
    
    setEditingMessageId(selectedMessage.id || selectedMessage.timestamp);
    setEditingText(selectedMessage.text);
    closeContextMenu();
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;
    
    const chatId = [currentUser.uid, selectedUser.id].sort().join('_');
    const chatKey = 'chat_' + chatId;
    
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMessages = existingMessages.map(msg => {
      if ((msg.id || msg.timestamp) === editingMessageId) {
        return { ...msg, text: editingText, edited: true };
      }
      return msg;
    });
    
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChatList(true); // Always show chat list on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle user selection for mobile
  const handleUserSelect = (user) => {
    console.log('handleUserSelect -> selecting user', user && (user.id || user.email || user.name));
  // debug info removed
    setSelectedUser(user);
    // immediately clear messages to avoid showing messages from the previous chat
    setMessages([]);
    try {
      const uid = currentUser?.uid;
      if (uid && user?.id) {
        const chatId = [uid, user.id].sort().join('_');
        setCurrentChatId(chatId);
      } else {
        setCurrentChatId(null);
      }
    } catch (e) { setCurrentChatId(null); }
    if (isMobile) {
      setShowChatList(false); // Hide chat list on mobile when user selected
    }

    // Persist a minimal chat entry so the conversation stays in the left list
    // even if no message is sent yet. We try Firestore first and fall back to localStorage.
    try {
      const currentUid = currentUser?.uid;
      if (currentUid && user?.id) {
        const chatId = [currentUid, user.id].sort().join('_');

        // Update user's chat doc to ensure it exists (keeps left-list persistent)
        // Create a minimal presence doc for the current user only.
        // IMPORTANT: do NOT set `lastUpdated` or `lastMessage` here —
        // those fields control ordering and should only change when a message is sent.
        const presence = {
          otherUser: { uid: user.id, name: user.name || user.itemOwnerName || user.borrowerName },
          createdAt: serverTimestamp()
        };

        // Firestore write (best-effort) for current user's chat record only.
        try {
          setDoc(doc(db, 'users', currentUid, 'chats', chatId), presence, { merge: true }).catch(() => {});
          // mark messages as read for this chat for current user (best-effort)
          updateDoc(doc(db, 'users', currentUid, 'chats', chatId), { unreadCount: 0 }).catch(() => {});
        } catch (e) {
          // ignore firestore runtime problems
        }

        // Also ensure localStorage has this user in chatUsers for offline persistence
        try {
          const stored = JSON.parse(localStorage.getItem('chatUsers') || '[]');
          if (!stored.find(u => u.id === user.id)) {
            let toSave = [{ id: user.id, name: user.name || user.itemOwnerName || user.borrowerName, itemName: user.itemName || user.items?.[0] || '' }, ...stored];
            toSave = sortByLastMessage(toSave);
            localStorage.setItem('chatUsers', JSON.stringify(toSave));
            setChatUsers(prev => {
              if (!prev) return toSave;
              if (prev.find(u => u.id === user.id)) return prev;
              const next = [ { id: user.id, name: user.name || user.itemOwnerName || user.borrowerName, itemName: user.itemName || user.items?.[0] || '' }, ...prev ];
              return sortByLastMessage(next);
            });
          } else {
            // ensure unread cleared locally
            const updated = stored.map(u => u.id === user.id ? { ...u, unreadCount: 0 } : u);
            localStorage.setItem('chatUsers', JSON.stringify(updated));
          }
        } catch (lsErr) {
          // ignore localStorage errors
        }
      }
    } catch (err) { console.error('handleUserSelect error', err); }
  };

  // Go back to chat list on mobile
  const goBackToChatList = () => {
    if (isMobile) {
      setShowChatList(true);
      setSelectedUser(null);
    }
  };

  // Test function to create dummy data
  const createTestData = () => {
    console.log('🧪 Creating test data...');
    const actualCurrentUserId = currentUser?.uid || currentUser?.email || 'demo-user';
    console.log('📝 Using current user ID for test data:', actualCurrentUserId);
    
    const testRequests = [
      {
        id: 'test_001',
        borrowRequestId: 'test_001',
        itemId: 'item_001',
        itemTitle: 'Flower Poster',
        itemImage: null,
        itemCategory: 'Decoration',
        itemOwnerId: 'kkumar124@navgurukul.org',
        itemOwnerName: 'Kajal Kumar',
        itemOwnerEmail: 'kkumar124@navgurukul.org',
        itemOwnerPhone: '+91 9876543210',
        borrowerId: actualCurrentUserId,
        borrowerName: currentUser?.displayName || 'Current User',
        borrowerEmail: currentUser?.email || 'user@example.com',
        borrowerPhone: '+91 8765432109',
        status: 'approved',
        requestDate: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      },
      // Add reverse scenario - current user as owner
      {
        id: 'test_002',
        borrowRequestId: 'test_002',
        itemId: 'item_002',
        itemTitle: 'Study Lamp',
        itemImage: null,
        itemCategory: 'Electronics',
        itemOwnerId: actualCurrentUserId,
        itemOwnerName: currentUser?.displayName || 'Current User',
        itemOwnerEmail: currentUser?.email || 'user@example.com',
        itemOwnerPhone: '+91 8765432109',
        borrowerId: 'borrower123@example.com',
        borrowerName: 'Another User',
        borrowerEmail: 'borrower123@example.com',
        borrowerPhone: '+91 7654321098',
        status: 'approved',
        requestDate: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('borrowRequests', JSON.stringify(testRequests));
    
    // Create messages for both scenarios
    const testMessages1 = [
      {
        id: 'msg_001',
        text: 'hiii',
        senderId: actualCurrentUserId,
        senderName: currentUser?.displayName || 'Current User',
        receiverId: 'kkumar124@navgurukul.org',
        receiverName: 'Kajal Kumar',
        itemName: 'Flower Poster',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: 'msg_002',
        text: 'hello kajal',
        senderId: actualCurrentUserId,
        senderName: currentUser?.displayName || 'Current User',
        receiverId: 'kkumar124@navgurukul.org',
        receiverName: 'Kajal Kumar',
        itemName: 'Flower Poster',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        createdAt: new Date(Date.now() - 180000)
      },
      {
        id: 'msg_003',
        text: 'hiii puja',
        senderId: 'kkumar124@navgurukul.org',
        senderName: 'Kajal Kumar',
        receiverId: actualCurrentUserId,
        receiverName: currentUser?.displayName || 'Current User',
        itemName: 'Flower Poster',
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      }
    ];

    const testMessages2 = [
      {
        id: 'msg_101',
        text: 'Hi! I need the study lamp for my exams',
        senderId: 'borrower123@example.com',
        senderName: 'Another User',
        receiverId: actualCurrentUserId,
        receiverName: currentUser?.displayName || 'Current User',
        itemName: 'Study Lamp',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        createdAt: new Date(Date.now() - 120000)
      },
      {
        id: 'msg_102',
        text: 'Sure! The lamp is in great condition. When do you need it?',
        senderId: actualCurrentUserId,
        senderName: currentUser?.displayName || 'Current User',
        receiverId: 'borrower123@example.com',
        receiverName: 'Another User',
        itemName: 'Study Lamp',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        createdAt: new Date(Date.now() - 60000)
      }
    ];

    // Use proper chat ID format with sorted user IDs
    const chatId1 = `chat_${[actualCurrentUserId, 'kkumar124@navgurukul.org'].sort().join('_')}`;
    const chatId2 = `chat_${[actualCurrentUserId, 'borrower123@example.com'].sort().join('_')}`;
    
    localStorage.setItem(chatId1, JSON.stringify(testMessages1));
    localStorage.setItem(chatId2, JSON.stringify(testMessages2));
    
    console.log('✅ Test data created with chat IDs:', chatId1, chatId2);
    loadChatUsers();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const today = new Date();
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === todayDate.getTime() - 86400000) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* In-app toasts for incoming messages */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(ts => (
            <div key={ts.id} className="bg-white shadow-md rounded-lg px-4 py-2 border">
              <strong className="block text-sm">{ts.title}</strong>
              <span className="text-xs text-gray-600">{ts.body}</span>
            </div>
          ))}
        </div>
      )}
      {/* Left Sidebar - Chat List */}
      <div className={`${(isMobile && !showChatList) ? 'hidden' : 'block'} w-full md:w-1/3 bg-white border-r border-gray-300 flex flex-col`}>
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
              {currentUser?.displayName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-semibold">NGJugaad Chat</h2>
              <p className="text-xs text-green-100">Borrow & Lend</p>
            </div>
          </div>
          <FiMoreVertical className="w-6 h-6 cursor-pointer" />
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = searchTerm.trim().toLowerCase();
                  if (!q) return;
                  const found = chatUsers.find(u => (u.name || '').toLowerCase().includes(q) || (u.itemName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
                  if (found) {
                    handleUserSelect(found);
                  }
                }
              }}
              placeholder="Search or start new chat"
              className="w-full px-2 py-2 text-sm focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-xs text-gray-500 ml-2">Clear</button>
            )}
          </div>
        </div>

        {/* Compact status bar */}
        <div className="p-3 bg-yellow-50 border-b text-xs">
          <div className="flex justify-between items-center">
            <div>
              <div>Users={chatUsers.length}, Loading={loading ? 'true' : 'false'}</div>
              <div>Current: {(currentUser?.uid || currentUser?.email || 'demo-user').substring(0, 20)}...</div>
              <div>Requests: {JSON.parse(localStorage.getItem('borrowRequests') || '[]').length}, LS Users: {JSON.parse(localStorage.getItem('chatUsers') || '[]').length}</div>
            </div>
            <button 
              onClick={loadChatUsers}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Chat Users List */}
        <div className="flex-1 overflow-y-auto">
          {/* Ensure selectedUser is shown at top even if not present in chatUsers */}
          { (() => {
              const exists = selectedUser && chatUsers.find(u => u.id === selectedUser.id);
              if (selectedUser && !exists) {
                return (
                  <div key={`selected-${selectedUser.id}`} onClick={() => handleUserSelect(selectedUser)} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUser?.id === selectedUser?.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">{ (getDisplayName(selectedUser) || 'U').charAt(0).toUpperCase() }</div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-900 truncate mr-2">{getDisplayName(selectedUser)}</h3>
                          <span className="text-xs text-gray-500">{formatRelativeTime(selectedUser?.lastMessageAt || selectedUser?.lastMessageTime)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">📦 {selectedUser.itemName || 'Chat Item'}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          }
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-medium">Loading chats...</p>
            </div>
          ) : chatUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FiUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No chats yet</p>
              <p className="text-sm mt-1">Approve borrow requests to start chatting</p>
              <div className="space-y-2 mt-3">
                <button 
                  onClick={loadChatUsers}
                  className="block w-full px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Reload Chats
                </button>
                <button 
                  onClick={createTestData}
                  className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  Create Test Data
                </button>
              </div>
            </div>
          ) : (
            // apply simple client-side filter when a search term is present
            (() => {
              const q = (searchTerm || '').trim().toLowerCase();
              const listToShow = q
                ? chatUsers.filter(u => {
                    const name = (u.name || '').toLowerCase();
                    const item = (u.itemName || u.items?.[0] || '').toLowerCase();
                    const email = (u.email || '').toLowerCase();
                    return name.includes(q) || item.includes(q) || email.includes(q);
                  })
                : chatUsers;
              return listToShow.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser?.id === user.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar/Item Image */}
                  <div className="relative flex-shrink-0">
                    {user.itemImage ? (
                      <img 
                        src={user.itemImage} 
                        alt={user.itemName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        { (getDisplayName(user) || 'U').charAt(0).toUpperCase() }
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-gray-900 truncate mr-2">{getDisplayName(user)}</h3>
                        {user.role === 'owner' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            Owner
                          </span>
                        )}
                        {user.role === 'borrower' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Borrower
                          </span>
                        )}
                        {user.role === 'chat-user' && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                            Previous Chat
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatRelativeTime(user.lastMessageTime || user.lastMessageAt)}</span>
                    </div>
                    
                    {/* Items Display */}
                    <div className="mb-1">
                      {user.items && user.items.length > 1 ? (
                        <p className="text-sm text-gray-600 truncate">
                          📦 {user.items.length} items: {user.items.slice(0, 2).join(', ')}
                          {user.items.length > 2 && ` +${user.items.length - 2} more`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 truncate">
                          📦 {user.itemName || user.items?.[0] || 'Chat Item'}
                        </p>
                      )}
                    </div>
                    
                    {/* Last Message */}
                    {user.lastMessage ? (
                      <p className="text-xs text-gray-500 truncate">💬 {getSnippet(user.lastMessage, 80)}</p>
                    ) : (
                      <p className="text-xs text-green-600">
                        {user.itemCategory || 'Chat'} • Click to start conversation
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
            })()
          )}
        </div>
      </div>

  {/* Right Side - Chat Window */}
  <div className={`${(isMobile && showChatList) ? 'hidden' : 'block'} flex-1 flex flex-col`} style={{ minHeight: 0 }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-green-600 text-white p-4 flex items-center justify-between border-b">
              <div className="flex items-center space-x-3">
                {/* Back button for mobile */}
                {isMobile && (
                  <button 
                    onClick={goBackToChatList}
                    className="p-2 hover:bg-green-700 rounded-full transition-colors"
                  >
                    ←
                  </button>
                )}
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getDisplayName(selectedUser).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{getDisplayName(selectedUser)}</h3>
                  <p className="text-xs text-green-100">{selectedUser.lastSeen}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FiMoreVertical className="w-5 h-5 cursor-pointer hover:text-green-200" />
              </div>
            </div>

            {/* Item Info Bar */}
            <div className="bg-yellow-50 border-b border-yellow-200 p-3">
              <div className="flex items-center space-x-3">
                {selectedUser.itemImage && (
                  <img 
                    src={selectedUser.itemImage} 
                    alt={selectedUser.itemName}
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                )}
                <div>
                  <h4 className="font-medium text-gray-900">📦 {selectedUser.itemName}</h4>
                  <p className="text-sm text-gray-600">{selectedUser.itemCategory} • Approved Request</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{
              backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')",
              minHeight: 0
            }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <FiUser className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-lg font-medium">Start your conversation</p>
                  <p className="text-sm">Messages about "{selectedUser.itemName}"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.filter(msg => !msg.deletedForMe).map((message, index) => {
                    const isMyMessage = message.senderId === currentUser?.uid;
                    const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt);
                    const messageId = message.id || message.timestamp;
                    const isEditing = editingMessageId === messageId;
                    
                    return (
                      <div key={messageId || index}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm">
                              {formatDate(message.createdAt)}
                            </div>
                          </div>
                        )}
                        
                        <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm cursor-pointer relative ${
                              isMyMessage
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-800'
                            }`}
                            onContextMenu={(e) => handleRightClick(e, message)}
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="w-full p-2 text-sm text-gray-800 bg-white rounded border"
                                  autoFocus
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={saveEdit}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm">
                                  {message.deletedForEveryone ? (
                                    <em className="text-gray-400">This message was deleted</em>
                                  ) : (
                                    message.text
                                  )}
                                  {message.edited && !message.deletedForEveryone && (
                                    <span className="text-xs ml-2 opacity-70">(edited)</span>
                                  )}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  isMyMessage ? 'text-green-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.createdAt)}
                                  {isMyMessage && (
                                    <span className="ml-1">✓✓</span>
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
              <div className="bg-white p-4 border-t sticky bottom-0 z-10">
              <div className="flex items-center space-x-3">
                <BsEmojiSmile className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUser className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Welcome to NGJugaad Chat
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Select a conversation from the left to start messaging about borrowed items.
                Chat with item owners and borrowers seamlessly!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
          />
          
          {/* Context Menu */}
          <div
            className="fixed bg-white shadow-2xl rounded-xl border border-gray-200 py-1 z-50 min-w-48 max-w-64"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 200),
              transform: contextMenu.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
            }}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Message Options</p>
            </div>
            
            <button
              onClick={copyMessage}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <span className="text-lg">📋</span>
              <span className="font-medium text-gray-700">Copy</span>
            </button>
            
            {selectedMessage?.senderId === currentUser?.uid && !selectedMessage?.deletedForEveryone && (
              <>
                <button
                  onClick={startEditing}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <span className="text-lg">✏️</span>
                  <span className="font-medium text-gray-700">Edit</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={deleteForEveryone}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center space-x-3 transition-colors text-red-600"
                >
                  <span className="text-lg">🗑️</span>
                  <span className="font-medium">Delete for Everyone</span>
                </button>
              </>
            )}
            
            <button
              onClick={deleteForMe}
              className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center space-x-3 transition-colors text-red-600"
            >
              <span className="text-lg">�</span>
              <span className="font-medium">Delete for Me</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WhatsAppChat;
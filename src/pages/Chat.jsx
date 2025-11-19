import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';


/**
 * @param {string} text 
 */
const copyToClipboard = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; 
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      console.log('Text copied successfully!');
      return true;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  document.body.removeChild(textarea);
  return false;
};

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Rahul Sharma",
    productName: "Premium AI Assistant Software",
    status: "Request Accepted",
    statusDate: "Oct 5, 2025, 9:00 AM", 
    avatar: "R",
    photoUrl: "https://placehold.co/40x40/4F46E5/ffffff?text=R",
  },
  {
    id: 2,
    name: "Owner: Priya Verma",
    productName: "Handmade Wooden Table",
    status: "You Purchased",
    statusDate: "Sep 30, 2025, 3:45 PM", 
    avatar: "P",
    photoUrl: "https://placehold.co/40x40/EC4899/ffffff?text=P",
  },
  {
    id: 3,
    name: "Amit Singh",
    productName: "Fitness E-book & Plan",
    status: "Request Pending", 
    statusDate: "Oct 6, 2025, 11:30 AM", 
    avatar: "A",
    photoUrl: "https://placehold.co/40x40/10B981/ffffff?text=A",
  },
  {
    id: 4,
    name: "Vikas Dubey",
    productName: "Custom Web Development Service",
    status: "Request Accepted",
    statusDate: "Oct 1, 2025, 1:15 PM", 
    avatar: "V",
    photoUrl: "https://placehold.co/40x40/F59E0B/ffffff?text=V",
  },
  {
    id: 5,
    name: "Sneha Reddy",
    productName: "Digital Art Commissions",
    status: "Request Accepted",
    statusDate: "Sep 28, 2025, 8:00 PM",
    avatar: "S",
    photoUrl: "https://placehold.co/40x40/8B5CF6/ffffff?text=S",
  },
  {
    id: 6,
    name: "Rajesh Kumar",
    productName: "Used Physics Textbook",
    status: "You Purchased",
    statusDate: "Oct 3, 2025, 10:45 AM",
    avatar: "K",
    photoUrl: "https://placehold.co/40x40/06B6D4/ffffff?text=K",
  },
  {
    id: 7,
    name: "Zoya Khan",
    productName: "Tutoring Services (Math)",
    status: "Request Accepted",
    statusDate: "Oct 2, 2025, 4:20 PM",
    avatar: "Z",
    photoUrl: "https://placehold.co/40x40/F43F5E/ffffff?text=Z",
  },
];


const getSimulatedMessages = (contactId) => {
    return [];
};

import { getDisplayName as getNameHelper, getSnippet, formatRelativeTime } from '../utils/chatHelpers';

const getDisplayName = (user) => getNameHelper(user);


const ContextMenu = ({ x, y, onAction, onCancel }) => {
  const menuRef = useRef(null);
  const actions = [
    { label: "Edit Message", action: "edit", icon: "✏️" },
    { label: "Copy", action: "copy", icon: "📋" },
    { label: "Forward", action: "forward", icon: "➡️" },
    { label: "Delete for Me", action: "deleteForMe", color: "text-red-500", icon: "🗑️" },
    { label: "Delete for Everyone", action: "deleteForEveryone", color: "text-red-600", icon: "❌" },
    { label: "Cancel", action: "cancel", icon: "↩️" },
  ];

  useEffect(() => {
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let newX = x;
      let newY = y;

      if (x + menuWidth > vw) {
        newX = vw - menuWidth - 10; 
      }

      if (y + menuHeight > vh) {
        newY = vh - menuHeight - 10; 
      }

      if (newX < 10) newX = 10;

      if (newY < 10) newY = 10;

      menuRef.current.style.left = `${newX}px`;
      menuRef.current.style.top = `${newY}px`;
    }
  }, [x, y]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [onCancel]);

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-[100] bg-white rounded-xl shadow-2xl overflow-hidden py-1 border border-gray-200 backdrop-blur-sm min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map(({ label, action, color, icon }) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className={`w-full text-left px-4 py-2 text-sm flex items-center hover:bg-indigo-50 transition ${color}`}
        >
          <span className="mr-3 text-lg">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
};

const Message = ({ text, time, isSent, id, isDeleted, onRightClick, onTouchStart, onTouchEnd, onTouchMove }) => {
  if (isDeleted) {
    const align = isSent ? "justify-end" : "justify-start";
    return (
      <div className={`flex mb-3 ${align}`}>
        <div className="max-w-[85%] p-3 rounded-xl bg-gray-200 text-gray-500 italic text-sm shadow-sm">
          <p>🚫 This message was deleted for everyone.</p>
          <span className="text-xs block text-right mt-1">{time}</span>
        </div>
      </div>
    );
  }

  const align = isSent ? "justify-end" : "justify-start";
  const bubble = isSent ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-800 shadow-md";
  const margin = isSent ? "ml-6" : "mr-6";
  const timeColor = isSent ? "text-indigo-200" : "text-gray-500";
  const bubbleClasses = `${bubble} ${margin} p-3 rounded-xl`; 

  return (
    <div
      className={`flex mb-3 ${align}`}
      onContextMenu={isSent ? (e) => onRightClick(e, id) : undefined}
      onTouchStart={isSent ? (e) => onTouchStart(e, id) : undefined}
      onTouchEnd={isSent ? onTouchEnd : undefined}
      onTouchMove={isSent ? onTouchMove : undefined}
    >
      <div className={bubbleClasses}>
        <p className="text-sm break-words whitespace-pre-wrap">{text}</p>
        <span className={`text-xs block text-right mt-1 ${timeColor}`}>{time}</span>
      </div>
    </div>
  );
};

const ChatComponent = ({ contact, onClose }) => {
  const [messages, setMessages] = useState(() => getSimulatedMessages(contact.id));
  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null, messageText: "" });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const messagesEndRef = useRef(null);
  const pressTimer = useRef(null);

  // Load messages from Firestore if chatId exists, otherwise fallback to localStorage
  useEffect(() => {
    let unsub = null;
    const load = async () => {
      try {
        if (contact?.chatId && db) {
          const messagesQuery = query(collection(db, 'chats', contact.chatId, 'messages'), orderBy('timestamp', 'asc'));
          unsub = onSnapshot(messagesQuery, (snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            setMessages(list);
          }, (err) => {
            console.warn('Failed to load firestore messages, falling back to localStorage', err);
            // fallback continues below
          });
        } else {
          // localStorage fallback: chat_<user1>_<user2>
          const currentUserId = auth.currentUser?.uid || 'demo-user';
          const chatId = [currentUserId, contact.id].sort().join('_');
          const chatKey = 'chat_' + chatId;
          const msgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Error loading messages for contact', err);
      }
    };

    load();

    return () => { if (unsub) unsub(); };
  }, [contact]);

  useEffect(() => {
    setMessages(getSimulatedMessages(contact.id));
    setEditingMessageId(null);
    setInput("");
    setStatusMessage({ text: "", type: "" });
  }, [contact.id]); 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" }); 
  }, [messages, contact.id]); 

  // Ensure selected contact appears in left conversation list
  useEffect(() => {
    try {
      if (!contact) return;
      const selId = contact?.id || contact?.uid || contact?.userId || (typeof contact === 'string' ? contact : null);
      if (!selId) return;
      const selName = contact?.name || contact?.displayName || selId;
      const normalized = { id: selId, name: selName, ...contact };

      // chat list is drawn from MOCK_PRODUCTS in this view; but keep a session-local list in localStorage
      const existingJSON = localStorage.getItem('chatUsers');
      const existing = existingJSON ? JSON.parse(existingJSON) : [];
      if (!existing.find(u => u.id === selId)) {
        const next = [normalized, ...existing];
        try { localStorage.setItem('chatUsers', JSON.stringify(next)); } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to ensure contact in left list', err);
    }
  }, [contact]);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => setStatusMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const showStatus = (text, type = "success") => {
    setStatusMessage({ text, type });
  };

  const handleSend = (e) => {
    e.preventDefault();
    const textToSend = input.trim();
    if (!textToSend) return;

    if (editingMessageId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId
            ? {
                ...msg,
                text: textToSend,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " (edited)",
              }
            : msg
        )
      );
      setEditingMessageId(null);
      showStatus("Message edited successfully!");
    } else {
      const newMsg = {
        id: Date.now(),
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSent: true,
        isDeleted: false,
      };
      setMessages((prev) => [...prev, newMsg]);
    }
    setInput("");
  };

  const showContextMenu = (x, y, id, text) => {
    setContextMenu({ visible: true, x, y, messageId: id, messageText: text });
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null, messageText: "" });
  }, []);

  const handleRightClick = (e, id) => {
    e.preventDefault();
    const message = messages.find(m => m.id === id);
    if (!message || message.isDeleted) return; 
    showContextMenu(e.clientX, e.clientY, id, message.text);
  };

  const handleTouchStart = (e, id) => {
    if (e.touches.length !== 1) return;
    const message = messages.find(m => m.id === id);
    if (!message || message.isDeleted) return;

    pressTimer.current = setTimeout(() => {
      showContextMenu(e.touches[0].clientX, e.touches[0].clientY, id, message.text);
    }, 600);
  };

  const handleTouchEnd = () => clearTimeout(pressTimer.current);
  const handleTouchMove = () => clearTimeout(pressTimer.current);

  const handleMessageAction = (action) => {
    const msgId = contextMenu.messageId;
    const msgText = contextMenu.messageText;

    if (action === "cancel") {
      closeContextMenu();
      return;
    }

    if (action === "edit") {
      setInput(msgText);
      setEditingMessageId(msgId);
      closeContextMenu();
      document.querySelector('input[type="text"]').focus(); 
      return;
    }

    if (action === "deleteForMe") {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      showStatus("Message deleted for you.");
    } else if (action === "deleteForEveryone") {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isDeleted: true, text: "Message deleted" } : m))
      );
      showStatus("Message deleted for everyone.");
    } else if (action === "copy") {
      if (copyToClipboard(msgText)) {
        showStatus("Message copied to clipboard.");
      } else {
        showStatus("Failed to copy message.", "error");
      }
    } else if (action === "forward") {
      if (copyToClipboard(msgText)) {
        showStatus("Message copied and ready to forward.");
      } else {
        showStatus("Failed to prepare message for forwarding.", "error");
      }
    }

    closeContextMenu();
  };

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl shadow-2xl relative h-full">
      <div className="flex items-center p-4 bg-indigo-700 text-white rounded-t-xl shadow-md sticky top-0 z-10 flex-shrink-0">
        <button
          onClick={onClose}
          className="mr-3 p-2 hover:bg-indigo-600 rounded-full transition duration-150"
          aria-label="Close Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-grow">
          <p className="font-semibold text-lg">{contact.name}</p>
          <p className="text-sm text-indigo-200 truncate">{contact.productName}</p>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-gray-100 flex flex-col custom-scrollbar">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>

        {messages.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-center text-gray-500 italic p-10">
            <p>Send the first message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              {...msg}
              onRightClick={handleRightClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {statusMessage.text && (
        <div className={`p-2 text-center text-sm font-medium ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSend} className="flex flex-col p-3 bg-white border-t border-gray-200 flex-shrink-0">
        {editingMessageId && (
            <div className="flex items-center p-2 mb-2 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                <span className="font-medium text-yellow-800 flex-grow">
                    Edit Message: {messages.find(m => m.id === editingMessageId)?.text.substring(0, 40)}...
                </span>
                <button
                    type="button"
                    onClick={() => { setEditingMessageId(null); setInput(""); }}
                    className="ml-2 text-yellow-800 hover:text-yellow-900 font-bold"
                    aria-label="Cancel Edit"
                >
                    &times;
                </button>
            </div>
        )}
        <div className="flex">
            <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-3 border border-gray-300 rounded-full mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Message input"
            />
            <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-3 rounded-full hover:bg-indigo-700 shadow-lg disabled:bg-indigo-300 transition duration-150 font-medium"
            disabled={!input.trim()}
            >
            {editingMessageId ? "Save" : "Send"}
            </button>
        </div>
      </form>


      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleMessageAction}
          onCancel={closeContextMenu}
        />
      )}
    </div>
  );
};

const ProductListItem = ({ contact, onChat }) => {
  const statusTitle = (() => {
    switch(contact.status) {
      case "Request Accepted":
        return `Request Accepted by ${contact.name}`;
      case "You Purchased":
        return `Purchase Confirmed with ${contact.name}`;
      default:
        return `Conversation with ${contact.name}`;
    }
  })();

  const getStatusColor = (status) => {
    switch(status) {
      case "Request Accepted":
      case "You Purchased":
        return "text-green-700 bg-green-100 border border-green-200";
      case "Request Pending": 
        return "text-yellow-700 bg-yellow-100 border border-yellow-200";
      default:
        return "text-gray-600 bg-gray-100 border border-gray-200";
    }
  };

  return (
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-white rounded-xl shadow-lg mb-4 border border-gray-100 transition duration-150 hover:shadow-xl hover:border-indigo-200 cursor-pointer"
      onClick={() => onChat(contact)}
    >
      <img src={contact.photoUrl} alt={contact.name} className="w-12 h-12 rounded-full mr-4 mb-3 sm:mb-0 object-cover" />
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="font-semibold text-gray-800 truncate pr-2">
            {statusTitle}
          </p>
        </div>
        
        {contact.statusDate && (
          <p className="text-xs text-indigo-600 font-medium mb-1 flex items-center">
            🗓️ <span className="ml-1 mr-2 text-gray-600">Status Update:</span> {contact.statusDate}
          </p>
        )}
        
        <p className="text-sm text-gray-500 truncate mb-2">{contact.productName}</p>
        
        <span className={`text-xs font-medium py-1 px-3 rounded-full flex-shrink-0 ${getStatusColor(contact.status)}`}>
          {contact.status}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onChat(contact); }}
        className="mt-4 sm:mt-0 px-5 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-md flex-shrink-0 transition duration-150 text-sm font-medium"
      >
        Chat Now
      </button>
    </div>
  );
};

const ListView = ({ onChatSelect }) => {
  const [conversations, setConversations] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const unique = new Map();
        const currentUserId = auth.currentUser?.uid || 'demo-user';

        // load from localStorage borrowRequests (approved ones)
        const borrowRequests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
        const approved = borrowRequests.filter(r => r.status === 'approved');
        approved.forEach(req => {
          // owner or borrower
          if (req.borrowerId === currentUserId && req.itemOwnerId) {
            unique.set(req.itemOwnerId, {
              id: req.itemOwnerId,
              name: req.itemOwnerName || req.itemOwnerEmail || req.itemOwnerId,
              itemName: req.itemTitle || '',
              itemImage: req.itemImage || null,
              chatId: req.chatId || null
            });
          }
          if (req.itemOwnerId === currentUserId && req.borrowerId) {
            unique.set(req.borrowerId, {
              id: req.borrowerId,
              name: req.borrowerName || req.borrowerEmail || req.borrowerId,
              itemName: req.itemTitle || '',
              itemImage: req.itemImage || null,
              chatId: req.chatId || null
            });
          }
        });

        // merge localStorage chat_* conversations
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith('chat_')) continue;
          const msgs = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(msgs) || msgs.length === 0) continue;
          const idPart = key.replace('chat_', '');
          const parts = idPart.split('_');
          const otherId = parts.find(p => p !== currentUserId) || parts[0];
          const lastMsg = msgs[msgs.length - 1];
          if (!unique.has(otherId)) {
            unique.set(otherId, {
              id: otherId,
              name: lastMsg.senderName || lastMsg.receiverName || otherId,
              itemName: lastMsg.itemName || '',
              itemImage: null,
              chatId: null,
              lastMessage: lastMsg.text,
              lastMessageAt: lastMsg.timestamp
            });
          } else {
            const ex = unique.get(otherId);
            ex.lastMessage = lastMsg.text;
            ex.lastMessageAt = lastMsg.timestamp;
            unique.set(otherId, ex);
          }
        }

        // If firebase configured, listen to users/{uid}/chats once and merge
        if (auth.currentUser && db) {
          try {
            const q = query(collection(db, 'users', currentUserId, 'chats'), orderBy('lastMessageAt', 'desc'));
            const unsub = onSnapshot(q, (snapshot) => {
              snapshot.forEach(doc => {
                const d = doc.data();
                const other = d.otherUserId || d.withUserId || d.participantId;
                if (!other) return;
                const existing = unique.get(other) || {};
                unique.set(other, {
                  id: other,
                  name: d.otherUserName || d.withUserName || d.otherUserEmail || existing.name || other,
                  itemName: d.itemTitle || existing.itemName || '',
                  itemImage: d.itemImage || existing.itemImage || null,
                  chatId: d.chatId || doc.id || existing.chatId || null,
                  lastMessage: d.lastMessage || existing.lastMessage || '',
                  lastMessageAt: d.lastMessageAt || existing.lastMessageAt || null
                });
              });
              setConversations(Array.from(unique.values()));
              setLoading(false);
            }, (err) => {
              console.warn('Failed to listen to firestore chats', err);
              setConversations(Array.from(unique.values()));
              setLoading(false);
            });
            // keep unsub on window for dev (optional)
            window.__cv_unsub = unsub;
          } catch (err) {
            console.warn('Error querying firestore chats', err);
            setConversations(Array.from(unique.values()));
            setLoading(false);
          }
        } else {
          setConversations(Array.from(unique.values()).length ? Array.from(unique.values()) : MOCK_PRODUCTS);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading conversations', err);
        setConversations(MOCK_PRODUCTS);
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  return (
    <div className="p-4 sm:p-6 w-full flex flex-col h-full"> 
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-2 flex-shrink-0">
        Active Product Conversations
      </h1>
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2"> 
        {loading ? (
          <p className="text-gray-500 italic text-center py-10">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="text-gray-500 italic text-center py-10">No active chats found.</p>
        ) : (
          conversations.map((contact) => (
            <ProductListItem key={contact.id || contact.chatId || contact.email} contact={contact} onChat={onChatSelect} />
          ))
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const [selected, setSelected] = useState(null);
  const isChatOpen = selected !== null;

  return (
    <div className="bg-gray-100 relative overflow-hidden pt-4 sm:pt-0 pb-4 sm:pb-6 min-h-screen sm:min-h-[calc(100vh-60px)] font-sans"> 
      
      <div className={`flex h-full ${isChatOpen ? 'sm:flex' : 'sm:block'}`}>
        
        <div 
          className={`w-full ${isChatOpen ? 'sm:w-1/2' : 'sm:w-full'} flex-shrink-0 p-4 sm:p-6`}
        >
          <div className={`rounded-xl shadow-2xl bg-white ${isChatOpen ? 'h-[calc(100vh-100px)] min-h-[500px]' : 'h-full'}`}>
            <ListView onChatSelect={setSelected} />
          </div>
        </div>

        {isChatOpen && (
          <div 
            className="hidden sm:block sm:w-1/2 sm:flex-shrink-0 p-4 sm:p-6"
          >
            <div className="h-[calc(100vh-100px)] min-h-[500px] rounded-xl shadow-2xl overflow-hidden">
                <ChatComponent contact={selected} onClose={() => setSelected(null)} />
            </div>
          </div>
        )}
      </div>
      
      {isChatOpen && (
        <div 
          className={`fixed inset-0 bg-white z-40 transition-transform duration-500 ease-in-out 
                     sm:hidden transform ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <ChatComponent contact={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
};

export default Chat;

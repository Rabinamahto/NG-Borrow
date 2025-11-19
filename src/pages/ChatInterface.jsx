import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { getDisplayName, getSnippet, formatRelativeTime } from '../utils/chatHelpers';

const ChatInterface = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);

  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return (
      user.name || user.displayName || user.otherUserName || user.withUserName || user.borrowerName || user.itemOwnerName || user.email || user.otherUserEmail || 'Unknown User'
    );
  };
  
  useEffect(() => {
    loadChatUsers();
  }, []);

  // Ensure the currently selected user appears in the left conversation list
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
      console.warn('Error ensuring selected user in list', err);
    }
  }, [selectedUser]);

  const loadChatUsers = () => {
    try {
      // Check both borrowRequests and Firestore-style data
      const borrowRequestsJSON = localStorage.getItem('borrowRequests');
      const borrowRequests = borrowRequestsJSON ? JSON.parse(borrowRequestsJSON) : [];

      console.log('All borrow requests:', borrowRequests);

      // Look for approved requests in our new data structure
      const approvedRequests = borrowRequests.filter(request => 
        request.status === 'approved'
      );

      console.log('Approved requests:', approvedRequests);

      const uniqueUsers = new Map();
      const currentUserId = auth.currentUser?.uid || 'demo-user';

      console.log('Current user ID:', currentUserId);

      approvedRequests.forEach(request => {
        // For borrower: add item owner to chat list
        if (request.borrowerId === currentUserId && request.itemOwnerId && !uniqueUsers.has(request.itemOwnerId)) {
          uniqueUsers.set(request.itemOwnerId, {
            id: request.itemOwnerId,
            name: request.itemOwnerName || 'Item Owner',
            email: request.itemOwnerEmail || '',
            itemName: request.itemTitle || 'Unknown Item',
            itemImage: request.itemImage || null,
            borrowRequestId: request.borrowRequestId,
            lastActivity: new Date().toISOString()
          });
        }
        
        // For owner: add borrower to chat list
        if (request.itemOwnerId === currentUserId && request.borrowerId && !uniqueUsers.has(request.borrowerId)) {
          uniqueUsers.set(request.borrowerId, {
            id: request.borrowerId,
            name: request.borrowerName || 'Borrower',
            email: request.borrowerEmail || '',
            itemName: request.itemTitle || 'Unknown Item',
            itemImage: request.itemImage || null,
            borrowRequestId: request.borrowRequestId,
            lastActivity: new Date().toISOString()
          });
        }
      });

      // If Firebase is available, listen to user's chats in Firestore and merge
      if (auth.currentUser && db) {
        try {
          const chatsQuery = query(
            collection(db, 'users', currentUserId, 'chats'),
            orderBy('lastMessageAt', 'desc')
          );

          const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              const otherUserId = data.otherUserId || data.withUserId || data.participantId;
              if (!otherUserId) return;

              const existing = uniqueUsers.get(otherUserId) || {
                id: otherUserId,
                name: data.otherUserName || data.withUserName || data.otherUserEmail || otherUserId,
                email: data.otherUserEmail || data.withUserEmail || '',
                itemName: data.itemTitle || data.itemName || '',
                itemImage: data.itemImage || null,
                borrowRequestId: data.borrowRequestId || null,
                lastActivity: data.lastMessageAt || null,
                lastMessage: data.lastMessage || '',
                lastMessageAt: data.lastMessageAt || null,
                // prefer the explicit chatId stored in the document, fall back to the user-chats doc id
                chatId: data.chatId || docSnap.id
              };

              // If items present in this doc, add them
              if (data.itemId || data.itemTitle) {
                existing.items = existing.items || [];
                existing.items.push({ id: data.itemId, title: data.itemTitle, image: data.itemImage, chatId: data.chatId || docSnap.id });
              }

              // prefer firestore timestamps for lastMessageAt
              if (data.lastMessageAt) {
                existing.lastMessage = data.lastMessage || existing.lastMessage;
                existing.lastMessageAt = data.lastMessageAt;
              }

              uniqueUsers.set(otherUserId, existing);
            });

            // After merging firestore entries, rebuild users list and set state
            const users = Array.from(uniqueUsers.values())
              .sort((a, b) => {
                const ta = a.lastMessageAt ? new Date(a.lastMessageAt.seconds ? a.lastMessageAt.seconds * 1000 : a.lastMessageAt).getTime() : 0;
                const tb = b.lastMessageAt ? new Date(b.lastMessageAt.seconds ? b.lastMessageAt.seconds * 1000 : b.lastMessageAt).getTime() : 0;
                return tb - ta;
              });

            setChatUsers(users);
            setLoading(false);
          }, (err) => {
            console.warn('Firestore chats listener error', err);
          });

          // keep listener for cleanup by returning it from this inner try block
          // but we can't return here because outer function continues; store unsubscribe to window for dev cleanup
          window.__chats_unsubscribe = unsubscribe;
        } catch (err) {
          console.warn('Error listening to Firestore chats', err);
        }
      }

      // Also load any existing localStorage chats (chat_{id1}_{id2})
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith('chat_')) continue;
          const messagesJSON = localStorage.getItem(key);
          if (!messagesJSON) continue;
          const msgs = JSON.parse(messagesJSON);
          if (!Array.isArray(msgs) || msgs.length === 0) continue;

          // derive other user id from key (chat_<idA>_<idB>)
          const idPart = key.replace('chat_', '');
          const parts = idPart.split('_');
          const otherId = parts.find(p => p !== currentUserId) || parts[0];

          const lastMsg = msgs[msgs.length - 1];
          const existing = uniqueUsers.get(otherId) || {
            id: otherId,
            name: otherId,
            email: '',
            itemName: '',
            itemImage: null,
            borrowRequestId: null,
            lastActivity: null,
            lastMessage: '',
            lastMessageAt: null
          };

          existing.lastMessage = lastMsg.text || lastMsg.message || existing.lastMessage;
          existing.lastMessageAt = lastMsg.timestamp || lastMsg.createdAt || new Date().toISOString();

          uniqueUsers.set(otherId, existing);
        }
      } catch (err) {
        console.warn('Error loading localStorage chats', err);
      }

      const users = Array.from(uniqueUsers.values())
        .sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });

      console.log('Chat users found (merged):', users);
      setChatUsers(users);

      if (users.length > 0 && !selectedUser) {
        setSelectedUser(users[0]);
        loadMessages(users[0].id);
      }
    } catch (error) {
      console.error('Error loading chat users:', error);
    }
  };

  // Helper to update chatUsers when sending a new local message
  const updateLocalChatPreview = (otherUserId, message) => {
    setChatUsers(prev => {
      const map = new Map(prev.map(u => [u.id, { ...u }]));
      const existing = map.get(otherUserId) || {
        id: otherUserId,
        name: otherUserId,
        email: '',
        itemName: '',
        itemImage: null,
        borrowRequestId: null,
        lastActivity: null,
        lastMessage: '',
        lastMessageAt: null
      };
      existing.lastMessage = message.text || message;
      existing.lastMessageAt = message.timestamp || new Date().toISOString();
      map.set(otherUserId, existing);
      return Array.from(map.values()).sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });
  };

  const loadMessages = (userId) => {
    // If there is a Firestore chat for this user, listen to its messages; otherwise fallback to localStorage
    try {
      const currentUserId = auth.currentUser?.uid || 'demo-user';
      // find selected chat user object to see if chatId exists
      const userObj = chatUsers.find(u => u.id === userId);
      // cleanup any previous listener
      if (window.__messages_unsubscribe) {
        try { window.__messages_unsubscribe(); } catch(e){}
        window.__messages_unsubscribe = null;
      }

      if (userObj && userObj.chatId && db) {
        try {
          const messagesQuery = query(
            collection(db, 'chats', userObj.chatId, 'messages'),
            orderBy('timestamp', 'asc')
          );

          const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messageList = [];
            snapshot.forEach(docSnap => messageList.push({ id: docSnap.id, ...docSnap.data() }));
            setMessages(messageList);
          }, (err) => {
            console.error('Error listening to Firestore messages', err);
            setMessages([]);
          });

          window.__messages_unsubscribe = unsubscribe;
          return;
        } catch (err) {
          console.warn('Error loading firestore messages:', err);
        }
      }

      // fallback to localStorage
      const chatId = [currentUserId, userId].sort().join('_');
      const chatKey = 'chat_' + chatId;
      const messagesJSON = localStorage.getItem(chatKey);
      const chatMessages = messagesJSON ? JSON.parse(messagesJSON) : [];
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const currentUserId = auth.currentUser?.uid || 'demo-user';

      // If selectedUser has a Firestore chatId, write to Firestore; otherwise use localStorage
      if (selectedUser.chatId && db) {
        const messageData = {
          text: newMessage.trim(),
          senderId: currentUserId,
          senderName: auth.currentUser?.displayName || 'Demo User',
          timestamp: serverTimestamp(),
          type: 'text'
        };

        addDoc(collection(db, 'chats', selectedUser.chatId, 'messages'), messageData)
          .then(async () => {
            try {
              // update chats doc last message
              const chatDocRef = doc(db, 'chats', selectedUser.chatId);
              await updateDoc(chatDocRef, {
                lastMessage: newMessage.trim(),
                lastMessageTime: serverTimestamp(),
                lastMessageSender: currentUserId
              });
            } catch (err) {
              // it's okay if update fails
              console.warn('Failed to update chat doc', err);
            }
          })
          .catch(err => console.error('Failed to send firestore message', err));

        // optimistic UI: clear input and update preview
        setNewMessage('');
        updateLocalChatPreview(selectedUser.id, { text: newMessage.trim(), timestamp: new Date().toISOString() });
      } else {
        const chatId = [currentUserId, selectedUser.id].sort().join('_');
        const chatKey = 'chat_' + chatId;
        
        const message = {
          id: Date.now().toString(),
          text: newMessage.trim(),
          senderId: currentUserId,
          senderName: auth.currentUser?.displayName || 'Demo User',
          timestamp: new Date().toISOString(),
          read: false
        };

        const messagesJSON = localStorage.getItem(chatKey);
        const existingMessages = messagesJSON ? JSON.parse(messagesJSON) : [];
        const updatedMessages = [...existingMessages, message];
        
        localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
        setMessages(updatedMessages);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 bg-white border-r border-gray-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Chat Users</h2>
        </div>
        
        <div className="overflow-y-auto h-full">
          {(() => {
            const displayUsers = (selectedUser && !chatUsers.find(u => u.id === (selectedUser.id || selectedUser.uid))) ? [selectedUser, ...chatUsers] : chatUsers;
            return displayUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No approved borrow requests found.</p>
              <p className="text-sm mt-2">Users will appear here once requests are approved.</p>
            </div>
            ) : (
                      displayUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    loadMessages(user.id);
                  }}
                  className={"p-4 border-b cursor-pointer hover:bg-gray-50 " + 
                    (selectedUser?.id === user.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "")
                  }
                >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">{getDisplayName(user)}</h3>
                            <span className="text-xs text-gray-500">{formatRelativeTime(user.lastMessageAt || user.lastMessageTime)}</span>
                          </div>
                          <p className="text-sm text-gray-600">📦 {user.itemName || (user.items && user.items[0]) || 'Chat Item'}</p>
                          {user.lastMessage ? (
                            <p className="text-xs text-gray-500 truncate">💬 {getSnippet(user.lastMessage, 80)}</p>
                          ) : (
                            <p className="text-xs text-gray-400">{user.email}</p>
                          )}
                </div>
              ))
            );
          })()}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <React.Fragment>
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{getDisplayName(selectedUser)}</h3>
              <p className="text-sm text-gray-500">Item: {selectedUser.itemName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const currentUserId = auth.currentUser?.uid || 'demo-user';
                  const isOwnMessage = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={"flex " + (isOwnMessage ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={"max-w-xs lg:max-w-md px-4 py-2 rounded-lg " + 
                          (isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900")
                        }
                      >
                        <p>{message.text}</p>
                        <p className={"text-xs mt-1 " + 
                          (isOwnMessage ? "text-blue-100" : "text-gray-500")
                        }>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

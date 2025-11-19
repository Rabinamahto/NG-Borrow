import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FiUser, FiMessageCircle, FiClock } from 'react-icons/fi';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth?.currentUser;

  useEffect(() => {
    if (!currentUser || !db) {
      setLoading(false);
      return;
    }

    try {
      // Listen to user's chats
      const chatsQuery = query(
        collection(db, 'users', currentUser.uid, 'chats'),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chatList = [];
        const userChatsMap = new Map(); // Group by user

        snapshot.forEach(doc => {
          const chatData = doc.data();
          const otherUserId = chatData.otherUserId || chatData.withUserId;
          
          if (otherUserId) {
            if (userChatsMap.has(otherUserId)) {
              // Add item to existing user chat
              const existingChat = userChatsMap.get(otherUserId);
              existingChat.items.push({
                id: chatData.itemId,
                title: chatData.itemTitle,
                image: chatData.itemImage,
                chatId: doc.id
              });
              // Update with most recent message
              if (chatData.lastMessageAt && (!existingChat.lastMessageAt || chatData.lastMessageAt > existingChat.lastMessageAt)) {
                existingChat.lastMessage = chatData.lastMessage;
                existingChat.lastMessageAt = chatData.lastMessageAt;
              }
            } else {
              // Create new user chat group
              userChatsMap.set(otherUserId, {
                id: doc.id,
                otherUserId: otherUserId,
                otherUserName: chatData.otherUserName || chatData.withUserName || 'Unknown User',
                otherUserEmail: chatData.otherUserEmail || chatData.withUserEmail || '',
                lastMessage: chatData.lastMessage || 'Start a conversation...',
                lastMessageAt: chatData.lastMessageAt,
                items: [{
                  id: chatData.itemId,
                  title: chatData.itemTitle,
                  image: chatData.itemImage,
                  chatId: doc.id
                }]
              });
            }
          }
        });

        setChats(Array.from(userChatsMap.values()));
        setLoading(false);
      }, (error) => {
        console.error('Error fetching chats:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up chat listener:', error);
      setLoading(false);
    }
  }, [currentUser]);

  const handleChatClick = (chat) => {
    // Navigate to ChatSimple with the first available chat ID
    if (chat.items && chat.items.length > 0) {
      navigate(`/chat/${chat.items[0].chatId}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // Less than 1 minute
      if (diff < 60000) return 'Just now';
      // Less than 1 hour
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      // Less than 24 hours
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      // More than 24 hours
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Messages</h1>
          <p className="text-gray-600">
            Chat with users you've exchanged items with
          </p>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {chats.length === 0 ? (
            <div className="p-12 text-center">
              <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
              <p className="text-gray-500 mb-4">
                Chats will appear here when you approve or get approved for borrow requests
              </p>
              <button
                onClick={() => navigate('/borrow-requests')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Borrow Requests
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(chat.otherUserName || chat.otherUserEmail || 'U').charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {chat.otherUserName || chat.otherUserEmail || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      
                      {/* Items */}
                      {chat.items && chat.items.length > 1 ? (
                        <p className="text-sm text-blue-600 font-medium mb-1">
                          📦 {chat.items.length} items: {chat.items.map(item => item.title).slice(0, 2).join(', ')}{chat.items.length > 2 ? '...' : ''}
                        </p>
                      ) : chat.items && chat.items.length === 1 ? (
                        <p className="text-sm text-gray-600 mb-1 truncate">
                          📦 {chat.items[0].title}
                        </p>
                      ) : null}
                      
                      {/* Last Message */}
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage || 'Start a conversation...'}
                      </p>
                      
                      {/* User Email */}
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {chat.otherUserEmail}
                      </p>
                    </div>
                    
                    {/* Item thumbnails */}
                    {chat.items && chat.items.length > 0 && chat.items[0].image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={chat.items[0].image} 
                          alt={chat.items[0].title}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        {chats.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> These chats are available because you've either approved someone's borrow request or had your request approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
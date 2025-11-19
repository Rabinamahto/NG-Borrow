import React, { useState, useEffect, useRef } from "react";
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FiSend, FiArrowLeft, FiUser, FiEdit2, FiTrash2, FiCopy, FiShare, FiMoreVertical } from 'react-icons/fi';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const currentUser = auth?.currentUser;

  // Load user's chats
  useEffect(() => {
    if (!currentUser || !db) {
      setLoading(false);
      return;
    }

    try {
      const chatsQuery = query(
        collection(db, 'users', currentUser.uid, 'chats'),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chatMap = new Map(); // Group chats by otherUserId
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const otherUserId = data.otherUserId;
          
          if (chatMap.has(otherUserId)) {
            // Add item to existing user chat
            const existingChat = chatMap.get(otherUserId);
            // Add to existing chat group
            existingChat.items.push({
              id: data.itemId,
              title: data.itemTitle,
              chatId: doc.id,
              image: data.itemImage
            });
            // Update other properties if needed
            existingChat.otherUserName = existingChat.otherUserName || data.otherUserName || data.withUserName || 'Unknown User';
            existingChat.otherUserEmail = existingChat.otherUserEmail || data.otherUserEmail || data.withUserEmail || '';
            // Update with most recent message
            if (data.lastMessageAt && (!existingChat.lastMessageAt || data.lastMessageAt > existingChat.lastMessageAt)) {
              existingChat.lastMessage = data.lastMessage;
              existingChat.lastMessageAt = data.lastMessageAt;
            }
          } else {
            // Create new grouped chat
            chatMap.set(otherUserId, {
              id: doc.id,
              chatId: doc.id,
              otherUserId: otherUserId,
              otherUserName: data.otherUserName || data.withUserName || 'Unknown User',
              otherUserEmail: data.otherUserEmail || data.withUserEmail || '',
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
              items: [{
                id: data.itemId,
                title: data.itemTitle,
                chatId: doc.id,
                image: data.itemImage
              }],
              ...data
            });
          }
        });
        
        setChats(Array.from(chatMap.values()));
        setLoading(false);
      }, (error) => {
        console.error('Error fetching chats:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up chats listener:', error);
      setLoading(false);
    }
  }, [currentUser]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat || !db) return;

    try {
      const messagesQuery = query(
        collection(db, 'chats', selectedChat.chatId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messageList = [];
        snapshot.forEach(doc => {
          messageList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messageList);
        scrollToBottom();
      }, (error) => {
        console.error('Error fetching messages:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up messages listener:', error);
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      };

      // Add message to chat
      await addDoc(collection(db, 'chats', selectedChat.chatId, 'messages'), messageData);

      // Update last message in chat lists for both users
      const participants = [currentUser.uid, selectedChat.withUserId];
      
      for (const userId of participants) {
        try {
          const userChatsQuery = query(
            collection(db, 'users', userId, 'chats'),
            where('chatId', '==', selectedChat.chatId)
          );
          
          // We would need to update the chat document here
          // For now, we'll just add the message successfully
        } catch (error) {
          console.warn('Failed to update chat list for user:', userId);
        }
      }

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  // Context menu handlers
  const handleRightClick = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: message
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleEditMessage = () => {
    setEditingMessage(contextMenu.message);
    setEditText(contextMenu.message.text);
    closeContextMenu();
  };

  const handleDeleteMessage = async (deleteForEveryone = false) => {
    try {
      const messageRef = doc(db, 'chats', selectedChat.chatId, 'messages', contextMenu.message.id);
      
      if (deleteForEveryone) {
        await deleteDoc(messageRef);
      } else {
        await updateDoc(messageRef, {
          deletedFor: [...(contextMenu.message.deletedFor || []), currentUser.uid]
        });
      }
      
      closeContextMenu();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(contextMenu.message.text);
    closeContextMenu();
    alert('Message copied!');
  };

  const handleForwardMessage = () => {
    // For now, just copy to clipboard
    navigator.clipboard.writeText(contextMenu.message.text);
    closeContextMenu();
    alert('Message copied for forwarding!');
  };

  const saveEditedMessage = async () => {
    try {
      const messageRef = doc(db, 'chats', selectedChat.chatId, 'messages', editingMessage.id);
      await updateDoc(messageRef, {
        text: editText,
        editedAt: serverTimestamp(),
        edited: true
      });
      
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading chats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mt-4">
        <div className="flex h-[calc(100vh-120px)]">
          {/* Chat List */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 ${selectedChat ? 'hidden md:block' : ''}`}>
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
              <p className="text-sm text-gray-600">
                {chats.length} active conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="overflow-y-auto h-full">
              {chats.length === 0 ? (
                <div className="p-6 text-center">
                  <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No chats yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Chats will appear here when you approve/get approved for borrow requests
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      console.log('Selected chat:', chat);
                      setSelectedChat(chat);
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {(chat.otherUserName || chat.withUserName || chat.otherUserEmail || 'U')?.charAt(0)?.toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900 truncate">
                            {chat.otherUserName || chat.withUserName || chat.otherUserEmail || 'Unknown User'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessageAt)}
                          </span>
                        </div>
                        
                        {/* Show items count if multiple */}
                        {chat.items && chat.items.length > 1 ? (
                          <p className="text-sm text-blue-600 font-medium">
                            {chat.items.length} items
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 truncate">
                            {chat.items?.[0]?.title || chat.itemTitle}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {chat.lastMessage || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : ''}`}>
            {selectedChat ? (
              <div className="flex flex-col h-full">
                {console.log('Rendering selectedChat:', selectedChat)}
                
                {/* Test Header - Always Visible */}
                <div style={{
                  backgroundColor: 'red',
                  color: 'white',
                  padding: '10px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  HEADER TEST - USER: {selectedChat?.otherUserName || selectedChat?.withUserName || selectedChat?.otherUserEmail || 'Unknown'}
                </div>
                
                {/* Chat Header */}
                <div className="p-6 bg-blue-100 border-b-4 border-blue-500 flex items-center gap-4 min-h-[100px] flex-shrink-0">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 text-gray-600 hover:text-gray-800 rounded-lg bg-white"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {/* User Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0 border-4 border-white">
                    {selectedChat?.otherUserName?.charAt(0)?.toUpperCase() || 
                     selectedChat?.withUserName?.charAt(0)?.toUpperCase() || 
                     selectedChat?.otherUserEmail?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  
                  <div className="flex-1 min-w-0 bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-2xl truncate">
                        {selectedChat?.otherUserName || 
                         selectedChat?.withUserName || 
                         selectedChat?.otherUserEmail || 
                         'Unknown User'}
                      </h3>
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                    </div>
                    
                    {selectedChat?.items && selectedChat.items.length > 1 ? (
                      <p className="text-sm text-gray-600 mt-2 truncate">
                        💼 {selectedChat.items.length} items: {selectedChat.items.map(item => item.title).join(', ')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2 truncate">
                        📦 About: {selectedChat?.items?.[0]?.title || selectedChat?.itemTitle || 'Item discussion'}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2 truncate">
                      {selectedChat?.otherUserEmail || 'No email available'}
                    </p>
                  </div>
                  
                  {/* Item thumbnail */}
                  {selectedChat?.items?.[0]?.image && (
                    <img 
                      src={selectedChat.items[0].image} 
                      alt={selectedChat.items[0].title}
                      className="w-16 h-16 rounded-lg object-cover border-4 border-white shadow-lg flex-shrink-0"
                    />
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FiUser className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Don't show deleted messages for current user
                      if (message.deletedFor && message.deletedFor.includes(currentUser?.uid)) {
                        return null;
                      }
                      
                      const isMyMessage = message.senderId === currentUser?.uid;
                    
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                        <div
                          onContextMenu={(e) => handleRightClick(e, message)}
                          className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg cursor-pointer relative group ${
                            isMyMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {editingMessage?.id === message.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full px-2 py-1 text-sm bg-white text-gray-800 rounded border"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEditedMessage}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{message.text}</p>
                              {message.edited && (
                                <p className={`text-xs italic ${
                                  isMyMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  (edited)
                                </p>
                              )}
                              <p className={`text-xs mt-1 ${
                                isMyMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </>
                          )}
                          
                          {/* Context menu button (visible on hover) */}
                          {isMyMessage && (
                            <button
                              onClick={(e) => handleRightClick(e, message)}
                              className="absolute -right-2 -top-2 w-6 h-6 bg-gray-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <FiMoreVertical className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-6 border-t bg-white shadow-lg">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a chat to start messaging
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenu.message.senderId === currentUser?.uid && (
              <>
                <button
                  onClick={handleEditMessage}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMessage(false)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete for me
                </button>
                <button
                  onClick={() => handleDeleteMessage(true)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete for everyone
                </button>
              </>
            )}
            <button
              onClick={handleCopyMessage}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FiCopy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={handleForwardMessage}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FiShare className="w-4 h-4" />
              Forward
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
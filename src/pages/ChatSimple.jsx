import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { 
  FiArrowLeft, 
  FiSend, 
  FiMoreVertical, 
  FiTrash2, 
  FiEdit3,
  FiCheck,
  FiX
} from 'react-icons/fi';

const ChatSimple = () => {
  const { chatId } = useParams();
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatAndMessages = async () => {
      try {
        // Get chat document to find other user
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find(id => id !== user.uid);
          
          if (otherUserId) {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
              setOtherUser({ id: otherUserId, ...otherUserDoc.data() });
            }
          }
        }

        // Listen to messages
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messageList);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setLoading(false);
      }
    };

    const unsubscribe = fetchChatAndMessages();
    return () => unsubscribe?.then?.(unsub => unsub?.());
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) {
      console.log('Cannot send message - missing requirements:', {
        hasMessage: !!newMessage.trim(),
        hasUser: !!user,
        hasChatId: !!chatId
      });
      return;
    }

    try {
      console.log('Sending message:', {
        text: newMessage,
        chatId,
        userId: user.uid,
        userEmail: user.email
      });

      const messageData = {
        text: newMessage,
        senderId: user.uid,
        senderEmail: user.email,
        timestamp: serverTimestamp(),
        type: 'text'
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      // Update chat's lastMessage
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: user.uid
      });

      console.log('Message sent successfully');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
      setMenuOpen(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startEditing = (message) => {
    setEditingMessage(message.id);
    setEditText(message.text);
    setMenuOpen(null);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;

    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', editingMessage), {
        text: editText,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const messageDate = timestamp.toDate();
    const today = new Date();
    return messageDate.toDateString() === today.toDateString();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    if (isToday(timestamp)) {
      return 'Today';
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Link 
            to="/chat" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUser?.name?.charAt(0) || otherUser?.email?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {otherUser?.name || otherUser?.email || 'Unknown User'}
              </h1>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiMoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === user?.uid;
            const showDate = index === 0 || 
              !messages[index - 1].timestamp || 
              !isToday(messages[index - 1].timestamp) !== !isToday(message.timestamp);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center py-2">
                    <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    } shadow-sm`}
                    onMouseEnter={() => isOwn && setMenuOpen(message.id)}
                    onMouseLeave={() => setMenuOpen(null)}
                  >
                    {editingMessage === message.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-current"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={saveEdit}
                            className="p-1 hover:bg-black/10 rounded"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="p-1 hover:bg-black/10 rounded"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="break-words">{message.text}</p>
                        {message.edited && (
                          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            (edited)
                          </span>
                        )}
                      </>
                    )}
                    
                    <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>

                    {/* Message Menu */}
                    {isOwn && menuOpen === message.id && editingMessage !== message.id && (
                      <div className="absolute top-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button
                          onClick={() => startEditing(message)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <FiEdit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-3">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-transparent resize-none outline-none text-gray-800 placeholder-gray-500"
              rows={1}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSimple;
import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

const ChatInterface = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
    loadChatUsers();
  }, []);

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

      const users = Array.from(uniqueUsers.values());
      console.log('Chat users found:', users);
      setChatUsers(users);
      
      if (users.length > 0 && !selectedUser) {
        setSelectedUser(users[0]);
        loadMessages(users[0].id);
      }
    } catch (error) {
      console.error('Error loading chat users:', error);
    }
  };

  const loadMessages = (userId) => {
    try {
      const currentUserId = auth.currentUser?.uid || 'demo-user';
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
          {chatUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No approved borrow requests found.</p>
              <p className="text-sm mt-2">Users will appear here once requests are approved.</p>
            </div>
          ) : (
            chatUsers.map((user) => (
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
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">Item: {user.itemName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <React.Fragment>
            <div className="p-4 bg-white border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
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
